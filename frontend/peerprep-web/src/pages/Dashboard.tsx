import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { io, Socket } from "socket.io-client";
import { deleteAccount } from '../api/auth';
import { auth } from '../lib/firebase';

import { useNavigate } from 'react-router-dom';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const navigate = useNavigate();
  const goCollab = () => {
    navigate('/collab');
  };

  useEffect(() => {
    // Connect to matching service via Nginx
    // Note: Must use HTTP backend, so CloudFront HTTPS won't work (mixed content blocked)
    // Use environment variable or default to current hostname
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}`;
    socketRef.current = io(backendUrl, {path: "/matching/socket.io/",});

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

  const handleDeleteAccount = async () => {
  try {
    // No Firebase token needed - uses session cookie
    await deleteAccount();
    
    // User is now deleted from both systems
    await signOut();
    
  } catch (error) {
    console.error('Account deletion failed:', error);
    alert('Failed to delete account. Please try again.');
  }
};

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Logo in top right */}
      <img 
        src="/peerprep_logo.png" 
        alt="PeerPrep Logo" 
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '60px',  
          height: 'auto',
          zIndex: 10
        }}
      />

      {/* Logout Button - Top Left */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        left: '1rem',
        zIndex: 10
      }}>
        <button
          onClick={signOut}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Logout
        </button>
      </div>

      {/* Delete Account Button - Bottom Left */}
      <div style={{ 
        position: 'fixed', 
        bottom: '1rem', 
        left: '1rem',
        zIndex: 10
      }}>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Delete Account
        </button>
      </div>

      <main style={{ maxWidth: 720, margin: "3rem auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>Welcome, {user?.displayName}</h1>
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
          <button
            onClick={goCollab}
            style={{
              padding: "0.75rem 2rem",
              fontSize: "1rem",
              fontWeight: "bold",
              backgroundColor: canFindMatch ? "#4CAF50" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Collab
          </button>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>Delete Account?</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              This will permanently delete your account and all data from PeerPrep. 
              This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deletingAccount ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deletingAccount ? 'not-allowed' : 'pointer'
                }}
              >
                {deletingAccount ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
