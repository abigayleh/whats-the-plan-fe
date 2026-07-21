import { useEffect, useState } from 'react';

// Mirrors the accent palette in styles/abstracts/_variables.scss — kept as plain
// hex here since SCSS variables aren't exposed as CSS custom properties.
const COLORS = ['#c56a4a', '#b15c6b', '#6e8b6a', '#c99433', '#6c8ba0', '#2ecc84'];
const PIECE_COUNT = 60;
const DURATION_MS = 2200;

function makePieces() {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.3,
    duration: 1.6 + Math.random() * 0.8,
    rotate: Math.round(Math.random() * 360),
    drift: Math.round((Math.random() - 0.5) * 160),
  }));
}

// Fires a one-off falling-confetti burst whenever `trigger` changes (0 = never fired,
// so the initial mount is a no-op). Mounted once near the app root.
function Confetti({ trigger }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    setPieces(makePieces());
    const timer = setTimeout(() => setPieces([]), DURATION_MS);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!pieces.length) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti__piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            '--confetti-drift': `${piece.drift}px`,
            '--confetti-rotate': `${piece.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
