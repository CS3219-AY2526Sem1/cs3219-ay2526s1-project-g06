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
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 50) {
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
  const [notification, setNotification] = useState<string | null>(null);
  const previousParticipantCount = useRef<number>(0);
  const notificationTimeoutRef = useRef<number | null>(null);

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
          previousParticipantCount.current = init.participants.length;
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
        previousParticipantCount.current = payload.participants.length;
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
        const newCount = payload.participants.length;
        const prevCount = previousParticipantCount.current;

        console.log('[Collab] Presence update:', {
          prevCount,
          newCount,
          participants: payload.participants,
          willShowNotification: prevCount > 0 && newCount < prevCount && newCount > 0
        });

        // Detect when someone leaves (count decreased and we're not alone)
        if (prevCount > 0 && newCount < prevCount && newCount > 0) {
          console.log('[Collab] Partner disconnected - setting notification state');

          // Clear any existing notification timeout
          if (notificationTimeoutRef.current) {
            console.log('[Collab] Clearing existing timeout');
            clearTimeout(notificationTimeoutRef.current);
          }

          const message = "Your partner has disconnected from the session.";
          console.log('[Collab] Setting notification:', message);
          setNotification(message);

          // Auto-hide notification after 5 seconds
          const timeoutId = setTimeout(() => {
            console.log('[Collab] Auto-hiding notification');
            setNotification(null);
            notificationTimeoutRef.current = null;
          }, 5000);

          notificationTimeoutRef.current = timeoutId;
          console.log('[Collab] Timeout set:', timeoutId);
        }

        previousParticipantCount.current = newCount;
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
      // Clean up notification timeout
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
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

  const handleDisconnect = () => {
    if (socketRef.current) {
      console.log('[Collab] Manual disconnect initiated');
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
    // Give socket time to disconnect before navigating
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 100);
  };

  // Debug: Log notification state changes
  useEffect(() => {
    console.log('[Collab] Notification state changed:', notification);
  }, [notification]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16, position: "relative" }}>
      {/* Notification Popup */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            backgroundColor: "#ff9800",
            color: "white",
            padding: "16px 24px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: 400,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{notification}</span>
          <button
            onClick={() => {
              if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
                notificationTimeoutRef.current = null;
              }
              setNotification(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: 18,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ textAlign: "left", margin: 0 }}>Collaborative Codespace</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: connected ? "green" : "gray" }}>
            {connected ? "Connected" : "Disconnected"}
          </span>
          <button
            onClick={handleDisconnect}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Side-by-side layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 24,
          alignItems: "stretch",
          marginTop: 20,
          height: "calc(100vh - 180px)",
          overflow: "hidden",
        }}
      >
        {/* Question column */}
        <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", minWidth: 0 }}>
          {question ? (
            <>
              <h2 style={{ margin: 0, flexShrink: 0 }}>{question.title}</h2>
              {(question.topic || question.difficulty) && (
                <p style={{ fontSize: 14, color: "#555", marginTop: 4, flexShrink: 0 }}>
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
                  flex: 1,
                  overflowY: "auto",
                  margin: "8px 0 0 0",
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <label htmlFor="codespace" style={{ fontWeight: 600, display: "block", textAlign: "left", flexShrink: 0 }}>
            Shared editor
          </label>
          <textarea
            id="codespace"
            value={code}
            onChange={onCodeChange}
            style={{
              width: "calc(100% - 2px)",
              flex: 1,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 14,
              lineHeight: 1.5,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d0d7de",
              textAlign: "left",
              resize: "none",
              minHeight: 0,
              boxSizing: "border-box",
            }}
            placeholder="Type here to sync with your partner…"
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, textAlign: "left", flexShrink: 0 }}>
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
