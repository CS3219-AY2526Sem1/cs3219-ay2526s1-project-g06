import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";

type MatchPayload = {
  roomId: string;
  partner: { userId: string; email?: string };
  collab: {
    docId?: string;
    wsUrl?: string;
    wsPath?: string;
    token?: string;
    topic?: string;
    difficulty?: string;
    question?: {
      id: string;
      title: string;
      prompt: string;
      starterCode?: string;
      language?: string;
    };
  };
};

export function useMatching() {
  const [match, setMatch] = useState<MatchPayload | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const url = import.meta.env.VITE_MATCHING_URL || `https://${window.location.hostname}`;
    const path = import.meta.env.VITE_MATCHING_PATH || "/socket.io/";

    const s = io(url, { path, withCredentials: true });
    socketRef.current = s;

    s.on("connect", () => {
      console.log("[Matching] Connected to matching service");
    });

    s.on("match_found", (payload: MatchPayload) => {
      setMatch(payload);
      // navigate to collab page and pass payload
      navigate("/collab", { state: payload });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [navigate]);

  return { match };
}