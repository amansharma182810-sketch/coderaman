import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const socket = io(API);

function App() {
  const [queue, setQueue] = useState([]);
  const [patientName, setPatientName] = useState('');

  const loadQueue = () => fetch(`${API}/api/queue`).then(r => r.json()).then(setQueue).catch(() => setQueue([]));
  useEffect(() => { loadQueue(); socket.emit('queue:subscribe'); socket.on('queue:updated', loadQueue); return () => socket.removeAllListeners(); }, []);
  const addPatient = async (e) => { e.preventDefault(); if (!patientName.trim()) return; await fetch(`${API}/api/queue`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({patientName}) }); setPatientName(''); loadQueue(); };

  return <main className="shell"><header><div><span className="eyebrow">CLINIC OPERATIONS</span><h1>CareFlow</h1></div><span className="badge">Live Queue</span></header><section className="grid"><div className="card"><h2>Register patient</h2><form onSubmit={addPatient}><input value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Patient name"/><button>Add to queue</button></form></div><div className="card"><div className="row"><h2>Waiting room</h2><strong>{queue.length}</strong></div>{queue.length ? queue.map(p=><div className="patient" key={p.id}><span className="token">#{p.token_number}</span><span>{p.patient_name}</span><span className="waiting">Waiting</span></div>) : <p className="muted">No patients waiting.</p>}</div></section></main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
