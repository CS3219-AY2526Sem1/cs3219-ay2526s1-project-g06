import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { io, Socket } from "socket.io-client";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TOPICS = ["DP", "Math", "Linked List"];

interface Match {
  roomId: string;
  user1: { userId: string; email: string };
  user2: { userId: string; email: string };
  difficulties: string[];
  topics: string[];
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState<Match | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to matching service via Nginx
    socketRef.current = io("http://16.176.159.10");

    // Connect to matching service - use local for development
    // socketRef.current = io("http://localhost:4002");

    socketRef.current.on("waiting", (data) => {
      setStatusMessage(data.message);
    });

    socketRef.current.on("match_found", (match: Match) => {
      console.log("Match found!", match);
      setIsSearching(false);
      setMatchFound(match);
      setStatusMessage(`Matched with ${match.user1.userId === user?.sub ? match.user2.email : match.user1.email}!`);
    });

    socketRef.current.on("match_cancelled", (data) => {
      setStatusMessage(data.message);
      setIsSearching(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const canFindMatch = selectedDifficulties.length > 0 && selectedTopics.length > 0;

  const handleFindMatch = () => {
    if (!user || !socketRef.current) return;

    setIsSearching(true);
    setStatusMessage("Searching for a match...");
    socketRef.current.emit("find_match", {
      userId: user.sub,
      email: user.email,
      difficulties: selectedDifficulties,
      topics: selectedTopics,
    });
  };

  const handleCancelMatch = () => {
    if (!user || !socketRef.current) return;

    socketRef.current.emit("cancel_match", { userId: user.sub });
    setIsSearching(false);
    setStatusMessage("");
  };

  return (
    <main style={{ maxWidth: 720, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Welcome, {user?.email}</h1>
        <button onClick={signOut}>Log out</button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Select Difficulty</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {DIFFICULTIES.map((difficulty) => (
            <label key={difficulty} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedDifficulties.includes(difficulty)}
                onChange={() => toggleDifficulty(difficulty)}
              />
              <span>{difficulty}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Select Topics</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {TOPICS.map((topic) => (
            <label key={topic} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedTopics.includes(topic)}
                onChange={() => toggleTopic(topic)}
              />
              <span>{topic}</span>
            </label>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: "1rem",
          marginBottom: "1rem",
          backgroundColor: matchFound ? "#d4edda" : "#fff3cd",
          color: matchFound ? "#155724" : "#856404",
          borderRadius: "4px",
          border: `1px solid ${matchFound ? "#c3e6cb" : "#ffeeba"}`
        }}>
          {statusMessage}
        </div>
      )}

      {matchFound && (
        <div style={{
          padding: "1.5rem",
          marginBottom: "1rem",
          backgroundColor: "#e7f3ff",
          borderRadius: "8px",
          border: "1px solid #b3d9ff"
        }}>
          <h3>Match Details</h3>
          <p><strong>Room ID:</strong> {matchFound.roomId}</p>
          <p><strong>Partner:</strong> {matchFound.user1.userId === user?.sub ? matchFound.user2.email : matchFound.user1.email}</p>
          <p><strong>Difficulties:</strong> {matchFound.difficulties.join(", ")}</p>
          <p><strong>Topics:</strong> {matchFound.topics.join(", ")}</p>
          <p style={{ marginTop: "1rem", fontStyle: "italic" }}>Collaboration room coming soon!</p>
        </div>
      )}

      {!isSearching && !matchFound && (
        <button
          onClick={handleFindMatch}
          disabled={!canFindMatch}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: "bold",
            backgroundColor: canFindMatch ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: canFindMatch ? "pointer" : "not-allowed",
          }}
        >
          Find Match
        </button>
      )}

      {isSearching && (
        <button
          onClick={handleCancelMatch}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: "bold",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel Search
        </button>
      )}
    </main>
  );
}