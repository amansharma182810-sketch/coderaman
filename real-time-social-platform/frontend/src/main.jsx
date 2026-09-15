import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import './styles.css';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

function App() {
  const [online, setOnline] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    socket.on('connect', () => setOnline(true));
    socket.on('disconnect', () => setOnline(false));
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/posts`)
      .then((r) => r.json())
      .then((data) => setPosts(data.items || []))
      .catch(() => setPosts([]));
    return () => socket.removeAllListeners();
  }, []);

  return <main className="shell">
    <header><div><span className="eyebrow">FULL-STACK • REAL-TIME</span><h1>ConnectHub</h1></div><span className={online ? 'status live' : 'status'}>{online ? '● Online' : '○ Offline'}</span></header>
    <section className="hero"><h2>A modern social platform.</h2><p>Build communities, share updates and chat in real time.</p><button onClick={() => socket.emit('chat:join', 'demo')}>Join demo room</button></section>
    <section className="card"><h3>Feed</h3>{posts.length ? posts.map((post) => <article key={post._id}>{post.content}</article>) : <p className="muted">No posts yet. Connect MongoDB and the Post API to populate the feed.</p>}</section>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
