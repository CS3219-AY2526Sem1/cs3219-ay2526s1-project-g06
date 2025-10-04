import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TOPICS = ["DP", "Math", "Linked List"];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

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
    console.log("Finding match with:", { selectedDifficulties, selectedTopics });
    // TODO: Implement matching logic
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
    </main>
  );
}