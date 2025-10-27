import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../auth/AuthContext";

// Optional globals to allow Matching to override ws url/path at runtime
declare global {
  interface Window {
    __COLLAB_WS_URL__?: string;
    __COLLAB_WS_PATH__?: string;
  }
}

// Resolve collab socket base URL
const getCollabUrl = () => {
  if (window.__COLLAB_WS_URL__) return window.__COLLAB_WS_URL__;
  if (import.meta.env.VITE_COLLAB_SERVICE_URL) return import.meta.env.VITE_COLLAB_SERVICE_URL;
  return import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}`;
};

// Resolve socket path (matches your server's `path: "/collab/socket.io/"`)
const getSocketPath = () => {
  if (window.__COLLAB_WS_PATH__) return window.__COLLAB_WS_PATH__;
  return import.meta.env.VITE_COLLAB_SERVICE_URL ? "/socket.io/" : "/collab/socket.io/";
};

// Simple debounce
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 50) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export type Question = {
  id: string;
  title: string;
  prompt: string;
  starterCode?: string;
  language?: string;
};

type CollabProps = {
  roomId: string;
  token?: string;        // short-lived join token (if enabled)
  topic?: string;
  difficulty?: string;
};

const CollabComponent: React.FC<CollabProps> = ({
  roomId,
  token,
  topic,
  difficulty,
}) => {
  const [question, setQuestion] = useState<Question | null>();
  const [code, setCode] = useState<string>("");
  const [participants, setParticipants] = useState<{ userId?: string; email?: string }[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const suppressNextLocalApply = useRef(false);
  const collabUrl = useMemo(getCollabUrl, []);
  const socketPath = useMemo(getSocketPath, []);
  const { user } = useAuth();
  // Debounced emitter for code changes
  const emitCodeChange = useMemo(
    () =>
      debounce((payload: { code: string; clientTs: number }) => {
        socketRef.current?.emit("codespace:change", { ...payload, roomId });
      }, 40),
    [roomId]
  );

  useEffect(() => {
    const socket = io(collabUrl, {
      path: socketPath,
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
        setConnected(true);
        socket.emit(
            "join_room",
            { roomId, token, topic, difficulty, user: { userId: user?.sub, email: user?.email } },
            (init: any) => {
              if (init?.question) setQuestion(init.question);
              if (typeof init?.code === "string") {
                suppressNextLocalApply.current = true;
                setCode(init.code);
              }
              if (Array.isArray(init?.participants)) {
                setParticipants(init.participants);
              }
              console.log("[collab] join_room ack", init);
        }
          );
      });

    socket.on("disconnect", () => setConnected(false));

    // Initial payload from server: { question, code, participants, updatedAt }
    socket.on("collab:init", (payload: any) => {
      if (payload?.question) setQuestion(payload.question);
      if (typeof payload?.code === "string") {
        suppressNextLocalApply.current = true;
        setCode(payload.code);
      }
      if (Array.isArray(payload?.participants)) {
        setParticipants(payload.participants);
      }
    });

    // Remote code changes
    socket.on("codespace:change", (payload: { code: string; updatedAt?: number }) => {
      if (typeof payload?.code !== "string") return;
      if (payload.code !== code) {
        suppressNextLocalApply.current = true;
        setCode(payload.code);
      }
    });

    // Presence
    socket.on("presence:update", (payload: { participants: any[] }) => {
      if (Array.isArray(payload?.participants)) {
        setParticipants(payload.participants);
      }
    });

    socket.on("error", (err: any) => {
      console.warn("[collab] server error:", err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collabUrl, socketPath, roomId, token, topic, difficulty]);

  // Local edit -> emit debounced change
  const onCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (suppressNextLocalApply.current) {
      suppressNextLocalApply.current = false;
    } else {
      emitCodeChange({ code: next, clientTs: Date.now() });
    }
    setCode(next);
  };

  return (
    <div className="collab-container" style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Collaborative Codespace</h1>
        <span style={{ fontSize: 12, color: connected ? "green" : "gray" }}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </header>

      <section style={{ marginTop: 16, marginBottom: 16 }}>
        {question ? (
          <>
            <h2 style={{ margin: 0 }}>{question.title}</h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f6f8fa",
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              {question.prompt}
            </pre>
          </>
        ) : (
          <em>Loading question…</em>
        )}
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <label htmlFor="codespace" style={{ fontWeight: 600 }}>
          Shared editor
        </label>
        <textarea
          id="codespace"
          value={code}
          onChange={onCodeChange}
          rows={18}
          style={{
            width: "100%",
            minHeight: 360,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 14,
            lineHeight: 1.5,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #d0d7de",
          }}
          placeholder="Type here to sync with your partner…"
        />
      </section>

      <section style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Participants:{" "}
          {participants.length ? (
            participants.map((p, i) => (
              <span key={i}>
                {p.email || p.userId || "Unknown"}
                {i < participants.length - 1 ? ", " : ""}
              </span>
            ))
          ) : (
            <em>just you (waiting for partner)…</em>
          )}
        </div>
      </section>
    </div>
  );
};

export default CollabComponent;