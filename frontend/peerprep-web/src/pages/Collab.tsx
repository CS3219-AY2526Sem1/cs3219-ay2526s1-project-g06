import React, {useEffect, useRef, useState} from "react";
import {io, Socket} from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}:4004` : "http://localhost:4004"

const CollabComponent = () => {
  const [codespaceContent, setCodespaceContent] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {path: "/collab/socket.io/",});
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
