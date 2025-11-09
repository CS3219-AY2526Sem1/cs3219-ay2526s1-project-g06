import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { io, Socket } from "socket.io-client";
import { deleteAccount } from '../api/auth';
import { getAuth } from 'firebase/auth';

import { useNavigate } from 'react-router-dom';

import QuestionHistoryComponent from './QuestionHistory'

// Resolve Question Service base URL
const getQuestionBase = () =>
  import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL + "/api/question_service" : "http://localhost:4003/api/question_service";

// API helpers
async function fetchTopics(): Promise<string[]> {
  const res = await fetch(`${getQuestionBase()}/topics`);
  if (!res.ok) throw new Error(`Failed to fetch topics: ${res.status}`);
  return res.json();
}

async function fetchDifficultiesForTopic(topic: string): Promise<string[]> {
  const res = await fetch(`${getQuestionBase()}/filtered/difficulties/topic/${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error(`Failed to fetch difficulties: ${res.status}`);
  return res.json();
}


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
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState<Match | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [sessionCleanedUp, setSessionCleanedUp] = useState(false);
  const sessionCleanupAttempted = useRef(false);

  const navigate = useNavigate();
  // Load all topics at mount
  useEffect(() => {
    fetchTopics()
      .then((t) => setTopics(t))
      .catch((e) => console.error(e));
  }, []);

  // When topic changes, load difficulties for that topic
  useEffect(() => {
    if (!selectedTopic) {
      setDifficulties([]);
      setSelectedDifficulty("");
      return;
    }
    fetchDifficultiesForTopic(selectedTopic)
      .then((ds) => {
        setDifficulties(ds);
        // If previously selected difficulty no longer valid, clear it
        setSelectedDifficulty((prev) => (ds.includes(prev) ? prev : ""));
      })
      .catch((e) => console.error(e));
  }, [selectedTopic]);

  useEffect(() => {
    console.log('[Matching] useEffect triggered, user:', user?.email, user?.sub);

    // Connect to matching service
    // In development: Connect directly to matching service port
    // In production: Connect via Nginx with path prefix
    const matchingUrl = import.meta.env.VITE_MATCHING_SERVICE_URL || import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}`;
    const socketPath = import.meta.env.VITE_MATCHING_SERVICE_URL ? "/socket.io/" : "/matching/socket.io/";

    console.log('Connecting to matching service:', matchingUrl, 'with path:', socketPath);
    socketRef.current = io(matchingUrl, {path: socketPath});

    // Expose socket globally so CollabComponent can notify when leaving
    (window as any).__matchingSocket = socketRef.current;

    socketRef.current.on("connect", () => {
      console.log('[Matching] Connected to matching service');
      console.log('[Matching] User at connect time:', user?.email, user?.sub);
      console.log('[Matching] sessionCleanupAttempted:', sessionCleanupAttempted.current);

      // Clean up any stale active session when Dashboard mounts
      // This handles the case where user returns to Dashboard after collab
      if (user?.sub && !sessionCleanupAttempted.current) {
        console.log('[Matching] Sending leave_session on connect to clean up any stale session');
        sessionCleanupAttempted.current = true;
        socketRef.current?.emit('leave_session', { userId: user.sub }, (response: any) => {
          console.log('[Matching] Session cleanup acknowledged:', response);
          setSessionCleanedUp(true);
        });
      } else if (!user?.sub) {
        console.log('[Matching] No user yet, enabling match button');
        setSessionCleanedUp(true);
      } else {
        console.log('[Matching] Session cleanup already attempted, enabling match button');
        setSessionCleanedUp(true);
      }
    });

    socketRef.current.on("waiting", (data) => {
      setStatusMessage(data.message);
    });

    socketRef.current.on("match_found", (match: Match) => {
      const topic = match.topics?.[0] || selectedTopic;
      const difficulty = match.difficulties?.[0] || selectedDifficulty;

      navigate("/collab", {
        state: {
          roomId: match.roomId,
          collab: { topic, difficulty },
        },
      });
    });

    socketRef.current.on("match_cancelled", (data) => {
      setStatusMessage(data.message);
      setIsSearching(false);
    });

    socketRef.current.on("match_error", (data: { message: string }) => {
      console.error('[Matching] Match error:', data.message);
      setStatusMessage(data.message);
      setIsSearching(false);
      alert(data.message); // Show alert to user
    });

    return () => {
      console.log('[Matching] Cleaning up socket connection');
      socketRef.current?.disconnect();
      delete (window as any).__matchingSocket;
      sessionCleanupAttempted.current = false;
      setSessionCleanedUp(false);
    };
  }, [user]);

    const onSelectTopic = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedTopic(e.target.value);
    };
    
    const onSelectDifficulty = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedDifficulty(e.target.value);
    };
    
    const canFindMatch = Boolean(selectedTopic) && Boolean(selectedDifficulty) && sessionCleanedUp;

  const handleFindMatch = () => {
    console.log('[Matching] Find match clicked');
    console.log('[Matching] - User:', user?.email, user?.sub);
    console.log('[Matching] - Socket connected:', socketRef.current?.connected);
    console.log('[Matching] - Session cleaned up:', sessionCleanedUp);
    console.log('[Matching] - Can find match:', canFindMatch);
    console.log('[Matching] - Selected topic:', selectedTopic);
    console.log('[Matching] - Selected difficulty:', selectedDifficulty);

    if (!user || !socketRef.current) {
      console.log('[Matching] Cannot find match - missing user or socket');
      return;
    }

    setIsSearching(true);
    setStatusMessage("Searching for a match...");
    console.log('[Matching] Emitting find_match event');
    socketRef.current.emit("find_match", {
      userId: user.sub,
      email: user.email,
      difficulties: [selectedDifficulty],
      topics: [selectedTopic],
    });
  };

  const handleCancelMatch = () => {
    if (!user || !socketRef.current) return;

    socketRef.current.emit("cancel_match", { userId: user.sub });
    setIsSearching(false);
    setStatusMessage("");
  };

  const handleDeleteAccount = async () => {
  if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    return;
  }

  try {
    console.log('🗑️ Dashboard: Starting account deletion...');
    
    // 1. Delete account via backend (deletes from Firebase + MongoDB)
    await deleteAccount();
    console.log('✅ Dashboard: Account deleted from backend');
    
    // 2. Sign out WITHOUT triggering auth state listeners
    // This prevents the second unauthorized request
    const auth = getAuth();
    await auth.signOut();
    console.log('✅ Dashboard: Firebase signed out');
    
    // 3. Clear local state
    signOut(); // This will clear AuthContext
    
    // 4. Navigate to login
    navigate('/login', { replace: true });
    
  } catch (error) {
    console.error('❌ Dashboard: Account deletion failed:', error);
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

      {/* Top Left Buttons - Profile and Logout */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        left: '1rem',
        zIndex: 10,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button 
          onClick={() => navigate('/profile')}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLElement;
            target.style.background = '#e5e7eb';
            target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLElement;
            target.style.background = '#f3f4f6';
            target.style.transform = 'translateY(0)';
          }}
        >
          Profile
        </button>

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

        <div style={{ marginBottom: "2rem", textAlign: "left" }}>
          <h2>Select Topic</h2>
          <select
            value={selectedTopic}
            onChange={onSelectTopic}
            style={{ padding: "0.5rem", minWidth: 240 }}
          >
            <option value="">— Choose a topic —</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "2rem", textAlign: "left" }}>
          <h2>Select Difficulty</h2>
          <select
            value={selectedDifficulty}
            onChange={onSelectDifficulty}
            disabled={!selectedTopic} // enable only after topic chosen
            style={{ padding: "0.5rem", minWidth: 240 }}
          >
            <option value="">— Choose a difficulty —</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {!selectedTopic && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
              Select a topic to see available difficulties.
            </div>
          )}
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
        <QuestionHistoryComponent user={user} />
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
