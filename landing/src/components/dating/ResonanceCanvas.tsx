import { useRef, useEffect, memo } from 'react';

const ResonanceCanvas = memo(function ResonanceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let proximity = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener('mousemove', onMouseMove);

    const draw = () => {
      t += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = 'rgba(5, 5, 8, 0.15)';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Orbit parameters
      const orbitRadiusX = w * 0.22;
      const orbitRadiusY = h * 0.12;

      // Left star (Cyan) — original orbit
      const baseAngle1 = t * 0.4;
      const ox1 = cx - orbitRadiusX * Math.cos(baseAngle1);
      const oy1 = cy + orbitRadiusY * Math.sin(baseAngle1);

      // Right star (Magenta) — opposite orbit
      const baseAngle2 = baseAngle1 + Math.PI;
      const ox2 = cx - orbitRadiusX * Math.cos(baseAngle2);
      const oy2 = cy + orbitRadiusY * Math.sin(baseAngle2);

      // Mouse gravity influence
      const mx = mouseX * w;
      const my = mouseY * h;
      const dist1 = Math.hypot(mx - ox1, my - oy1);
      const dist2 = Math.hypot(mx - ox2, my - oy2);
      const gravityStrength = Math.min(1, 150 / Math.min(dist1, dist2 + 1));

      const pull1 = gravityStrength * 0.3;
      const pull2 = gravityStrength * 0.3;

      const x1 = ox1 + (mx - ox1) * pull1;
      const y1 = oy1 + (my - oy1) * pull1;
      const x2 = ox2 + (mx - ox2) * pull2;
      const y2 = oy2 + (my - oy2) * pull2;

      // Calculate proximity
      const currentDist = Math.hypot(x2 - x1, y2 - y1);
      const maxDist = orbitRadiusX * 2;
      proximity = 1 - Math.min(1, currentDist / (maxDist * 0.25));

      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + proximity * 0.2})`;
      ctx.lineWidth = 1 + proximity * 2;
      ctx.stroke();

      // DNA helix when close
      if (proximity > 0.6) {
        const helixPoints = 40;
        for (let i = 0; i < helixPoints; i++) {
          const p = i / helixPoints;
          const hx = x1 + (x2 - x1) * p;
          const hy = y1 + (y2 - y1) * p;
          const amp = 15 * proximity;
          const phase = t * 6 + i * 0.5;
          const dy = Math.sin(phase) * amp;

          ctx.beginPath();
          ctx.arc(hx, hy + dy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#00f0ff';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(hx, hy - dy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff006e';
          ctx.fill();
        }
      }

      // Draw left star (Cyan)
      const r1 = 28 + proximity * 12;
      const glow1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1 * 4);
      glow1.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      glow1.addColorStop(0.5, 'rgba(0, 240, 255, 0.08)');
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(x1 - r1 * 4, y1 - r1 * 4, r1 * 8, r1 * 8);

      ctx.beginPath();
      ctx.arc(x1, y1, r1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${0.15 + proximity * 0.25})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + proximity * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Data flow texture on left star
      for (let i = 0; i < 6; i++) {
        const angle = t * 0.5 + (i / 6) * Math.PI * 2;
        const rx = x1 + Math.cos(angle) * (r1 * 0.6);
        const ry = y1 + Math.sin(angle) * (r1 * 0.6);
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.3 + Math.sin(t * 3 + i) * 0.2})`;
        ctx.fill();
      }

      // Draw right star (Magenta)
      const r2 = 28 + proximity * 12;
      const glow2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2 * 4);
      glow2.addColorStop(0, 'rgba(255, 0, 110, 0.25)');
      glow2.addColorStop(0.5, 'rgba(255, 0, 110, 0.08)');
      glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2;
      ctx.fillRect(x2 - r2 * 4, y2 - r2 * 4, r2 * 8, r2 * 8);

      ctx.beginPath();
      ctx.arc(x2, y2, r2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 110, ${0.15 + proximity * 0.25})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 0, 110, ${0.5 + proximity * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Energy texture on right star
      for (let i = 0; i < 6; i++) {
        const angle = -t * 0.7 + (i / 6) * Math.PI * 2;
        const rx = x2 + Math.cos(angle) * (r2 * 0.6);
        const ry = y2 + Math.sin(angle) * (r2 * 0.6);
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 110, ${0.3 + Math.sin(t * 3 + i) * 0.2})`;
        ctx.fill();
      }

      // Supernova burst when very close
      if (proximity > 0.85) {
        const burstCount = 60;
        for (let i = 0; i < burstCount; i++) {
          const angle = (i / burstCount) * Math.PI * 2 + t * 3;
          const speed = 2 + Math.random() * 3;
          const dist = ((t * 20) % 100) * speed;
          const bx = cx + Math.cos(angle) * dist;
          const by = cy + Math.sin(angle) * dist;
          if (dist < Math.min(w, h) * 0.5) {
            ctx.beginPath();
            ctx.arc(bx, by, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff006e';
            ctx.globalAlpha = Math.max(0, 1 - dist / (Math.min(w, h) * 0.4));
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Infinity symbol
        const infScale = Math.min(1, (t * 2) % 3);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(infScale, infScale);
        ctx.rotate(t * 0.3);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
          const x = Math.cos(a) * 40;
          const y = Math.sin(a * 2) * 20;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
});

export default ResonanceCanvas;
