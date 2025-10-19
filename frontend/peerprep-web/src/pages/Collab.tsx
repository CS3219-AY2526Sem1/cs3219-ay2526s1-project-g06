import React, {useEffect, useRef, useState} from "react";
import {io, Socket} from "socket.io-client";

// Configure collab service URL based on environment
const getCollabUrl = () => {
  // Use direct service URL if available (for local development)
  if (import.meta.env.VITE_COLLAB_SERVICE_URL) {
    return import.meta.env.VITE_COLLAB_SERVICE_URL;
  }
  // Otherwise use backend URL for production (via Nginx)
  return import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}`;
};

const CollabComponent = () => {
  const [codespaceContent, setCodespaceContent] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const collabUrl = getCollabUrl();
    const socketPath = import.meta.env.VITE_COLLAB_SERVICE_URL ? "/socket.io/" : "/collab/socket.io/";

    console.log('Connecting to collab service:', collabUrl, 'with path:', socketPath);
    const socket = io(collabUrl, {path: socketPath});
    socketRef.current = socket;
    
    socket.on('codespace change', (text: string) => {
      setCodespaceContent(text);
        })
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCodespaceContent(newText);
    if (socketRef.current) {
      socketRef.current.emit('codespace change', newText);
    }
  }
  
  return (
    <div className="collab-container">
      <h1>Collaborative Codespace</h1>
      <textarea
        id="codespace" 
        value={codespaceContent}
        onChange={handleInputChange}
        rows={10} 
        cols={80}
        style={{ width: '100%', minHeight: '300px' }}
      />
    </div>
  );
};

export default CollabComponent;
