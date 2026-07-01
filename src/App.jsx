import { useEffect, useState } from 'react';
import { socket } from './socket/socketClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [health, setHealth] = useState('checking...');
  const [pong, setPong] = useState('waiting for pong...');

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth('unreachable'));

    socket.connect();
    socket.on('pong', () => setPong('pong received'));
    socket.emit('ping');

    return () => {
      socket.off('pong');
      socket.disconnect();
    };
  }, []);

  return (
    <main>
      <h1>What's the Plan</h1>
      <p>API health: {health}</p>
      <p>Socket: {pong}</p>
    </main>
  );
}

export default App;
