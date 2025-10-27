import { useLocation } from "react-router-dom";
import CollabComponent, { Question } from "../components/CollabComponent";

/**
 * This page expects to be navigated to by the Matching flow:
 * navigate("/collab", { state: matchPayload })
 * where matchPayload looks like:
 * {
 *   roomId: string,
 *   partner: { userId: string, email?: string },
 *   collab: {
 *     wsUrl?: string, wsPath?: string, token?: string,
 *     topic?: string, difficulty?: string, question?: Question
 *   }
 * }
 */
type MatchPayload = {
  roomId: string;
  partner: { userId: string; email?: string };
  collab: {
    wsUrl?: string;
    wsPath?: string;
    token?: string;
    topic?: string;
    difficulty?: string;
    question?: Question;
  };
};

export default function Collab() {
  const location = useLocation();
  const match = location.state as MatchPayload | null;

  if (!match) return null;

  const { roomId, collab } = match;

  return (
    <CollabComponent
      roomId={roomId}
      token={collab.token}
      topic={collab.topic}
      difficulty={collab.difficulty}
    />
  );
}