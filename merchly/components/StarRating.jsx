'use client';

import { useState } from 'react';

function Star({ filled, half, size = 16, onClick, onEnter }) {
  return (
    <button
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      onMouseEnter={onEnter}
      disabled={!onClick}
      className={onClick ? 'cursor-pointer' : 'cursor-default'}
      aria-label="star"
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <linearGradient id={`half-${size}`}>
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
          </linearGradient>
        </defs>
        <path
          d="m12 2 2.9 6.26 6.1.5-4.6 4 1.4 6.74L12 16.9 6.2 19.5l1.4-6.74-4.6-4 6.1-.5z"
          fill={filled ? '#F59E0B' : half ? `url(#half-${size})` : 'rgba(255,255,255,0.18)'}
        />
      </svg>
    </button>
  );
}

// Read-only display: <StarRating value={4.5} count={12} />
// Interactive input: <StarRating value={v} onChange={setV} />
export default function StarRating({ value = 0, count, size = 16, onChange, showCount = true }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            filled={onChange ? n <= active : n <= Math.floor(value)}
            half={!onChange && n === Math.ceil(value) && value % 1 >= 0.3 && value % 1 < 0.8}
            onClick={onChange ? () => onChange(n) : undefined}
            onEnter={onChange ? () => setHover(n) : undefined}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-white/50">
          {value > 0 ? value.toFixed(1) : 'No reviews'}
          {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
}
