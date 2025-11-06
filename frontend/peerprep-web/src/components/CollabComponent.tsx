/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../auth/AuthContext";

const getCollabUrl = () => {
  if (import.meta.env.VITE_COLLAB_SERVICE_URL) return import.meta.env.VITE_COLLAB_SERVICE_URL;
  return import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}`;
};
const getSocketPath = () => {
  return import.meta.env.VITE_COLLAB_SERVICE_URL ? "/socket.io/" : "/collab/socket.io/";
};

/** ----- Types ----- */
export type Question = {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  topic?: string;
};

type Participant = { userId?: string; email?: string };

type JoinRoomPayload = {
  roomId: string;
  token?: string;
  topic?: string;
  difficulty?: string;
  user?: { userId?: string; email?: string };
};

type JoinAckPayload = {
  question?: Question;
  code?: string;
  participants?: Participant[];
  error?: string;
};

type CollabInitPayload = {
  question?: Question;
  code?: string;
  participants?: Participant[];
};

type CodespaceChangePayload = {
  code: string;
  updatedAt?: number;
  clientTs?: number;
};

type PresenceUpdatePayload = {
  participants: Participant[];
};

type ServerErrorPayload = {
  message?: string;
};

type CollabProps = {
  roomId: string;
  token?: string;
  topic?: string;
  difficulty?: string;
};

/** ----- Small debounce helper ----- */
function debounce<T extends (...args: unknown[]) => void>(fn: T, wait = 50) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

const CollabComponent: React.FC<CollabProps> = ({
  roomId,
  token,
  topic,
  difficulty,
}) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const suppressNextLocalApply = useRef(false);
  const collabUrl = useMemo(getCollabUrl, []);
  const socketPath = useMemo(getSocketPath, []);
  const { user } = useAuth();

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
      const payload: JoinRoomPayload = {
        roomId,
        token,
        topic,
        difficulty,
        user: { userId: user?.sub, email: user?.email },
      };
      socket.emit("join_room", payload, (init: JoinAckPayload) => {
        if (init?.question) setQuestion(init.question);
        if (typeof init?.code === "string") {
          suppressNextLocalApply.current = true;
          setCode(init.code);
        }
        if (Array.isArray(init?.participants)) {
          setParticipants(init.participants);
        }
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("collab:init", (payload: CollabInitPayload) => {
      if (payload?.question) setQuestion(payload.question);
      if (typeof payload?.code === "string") {
        suppressNextLocalApply.current = true;
        setCode(payload.code);
      }
      if (Array.isArray(payload?.participants)) {
        setParticipants(payload.participants);
      }
    });

    // Always apply remote updates to avoid stale-closure misses
    socket.on("codespace:change", (payload: CodespaceChangePayload) => {
      if (typeof payload?.code !== "string") return;
      suppressNextLocalApply.current = true;
      setCode(payload.code);
    });

    socket.on("presence:update", (payload: PresenceUpdatePayload) => {
      if (Array.isArray(payload?.participants)) {
        setParticipants(payload.participants);
      }
    });

    socket.on("error", (err: ServerErrorPayload) => {
      // optional: surface this in UI
      console.warn("[collab] server error:", err?.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [collabUrl, socketPath, roomId, token, topic, difficulty, user?.sub, user?.email]);

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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ textAlign: "left" }}>Collaborative Codespace</h1>
        <span style={{ fontSize: 12, color: connected ? "green" : "gray" }}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </header>

      {/* Side-by-side layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 24,
          alignItems: "flex-start",
          marginTop: 20,
        }}
      >
        {/* Question column */}
        <div style={{ flex: 1, textAlign: "left" }}>
          {question ? (
            <>
              <h2 style={{ margin: 0 }}>{question.title}</h2>
              {(question.topic || question.difficulty) && (
                <p style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                  {question.topic && <>Topic: <strong>{question.topic}</strong></>}
                  {(question.topic && question.difficulty) && " · "}
                  {question.difficulty && <>Difficulty: <strong>{question.difficulty}</strong></>}
                </p>
              )}
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#f6f8fa",
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 8,
                  textAlign: "left",
                }}
              >
                {question.description}
              </pre>
            </>
          ) : (
            <em>Loading question…</em>
          )}
        </div>

        {/* Editor column */}
        <div style={{ flex: 1 }}>
          <label htmlFor="codespace" style={{ fontWeight: 600, display: "block", textAlign: "left" }}>
            Shared editor
          </label>
          <textarea
            id="codespace"
            value={code}
            onChange={onCodeChange}
            rows={20}
            style={{
              width: "100%",
              minHeight: 400,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 14,
              lineHeight: 1.5,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d0d7de",
              textAlign: "left",
            }}
            placeholder="Type here to sync with your partner…"
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, textAlign: "left" }}>
            Participants:{" "}
            {participants.length ? (
              participants.map((p, i) => (
                <span key={`${p.email ?? p.userId ?? i}-${i}`}>
                  {p.email || p.userId || "Unknown"}
                  {i < participants.length - 1 ? ", " : ""}
                </span>
              ))
            ) : (
              <em>just you (waiting for partner)…</em>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabComponent;