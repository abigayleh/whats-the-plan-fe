import { useEffect } from 'react';
import { socket } from '../socket/socketClient';

// Subscribes a refresh to server events — and to 'connect' as well, because anything broadcast
// while the socket was down is gone for good: a reconnect has to re-read rather than sit on
// stale data until the next event happens to arrive. Pass a null handler to stay unsubscribed
// (e.g. while logged out). `events` and `handler` must be stable across renders.
export default function useSocketEvents(events, handler) {
  useEffect(() => {
    if (!handler) return undefined;
    const names = [...events, 'connect'];
    names.forEach((name) => socket.on(name, handler));
    return () => names.forEach((name) => socket.off(name, handler));
  }, [events, handler]);
}