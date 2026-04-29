import { useState, useRef, useCallback, memo } from 'react';

interface LiquidSliderProps {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}

const LiquidSlider = memo(function LiquidSlider({ label, color, value, onChange }: LiquidSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);

  const handleMove = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = 1 - (clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, pct));
      setDragValue(clamped);
      onChange(clamped);
    },
    [onChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleMove(e.clientY);
    },
    [handleMove]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      handleMove(e.clientY);
    },
    [isDragging, handleMove]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const fillPct = Math.round((isDragging ? dragValue : value) * 100);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Vertical slider */}
      <div
        ref={trackRef}
        className="relative h-48 w-3 cursor-pointer overflow-hidden rounded-full md:h-64"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Liquid fill with wave top */}
        <div
          className="absolute bottom-0 left-0 w-full transition-all duration-300 ease-out"
          style={{
            height: `${fillPct}%`,
            background: `linear-gradient(180deg, ${color}88 0%, ${color} 100%)`,
            boxShadow: `0 0 20px ${color}44, inset 0 0 10px ${color}22`,
            borderRadius: '999px',
          }}
        >
          {/* Liquid surface wave */}
          <svg
            className="absolute -top-2 left-0 w-full"
            viewBox="0 0 12 8"
            preserveAspectRatio="none"
            style={{ height: 8 }}
          >
            <path
              d="M0,4 Q3,0 6,4 T12,4 V8 H0 Z"
              fill={color}
              opacity={0.5}
            >
              <animate
                attributeName="d"
                dur="2s"
                repeatCount="indefinite"
                values="M0,4 Q3,0 6,4 T12,4 V8 H0 Z;M0,4 Q3,8 6,4 T12,4 V8 H0 Z;M0,4 Q3,0 6,4 T12,4 V8 H0 Z"
              />
            </path>
          </svg>
        </div>

        {/* Glow thumb indicator */}
        <div
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{
            top: `${100 - fillPct}%`,
            background: color,
            boxShadow: `0 0 12px ${color}, 0 0 24px ${color}66`,
          }}
        />
      </div>

      {/* Label */}
      <div
        className="font-display text-xs tracking-wider"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          color: color,
          textShadow: `0 0 10px ${color}44`,
        }}
      >
        {label}
      </div>
    </div>
  );
});

export default LiquidSlider;
