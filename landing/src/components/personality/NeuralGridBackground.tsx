import { useRef, useEffect, memo } from 'react';

const NeuralGridBackground = memo(function NeuralGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      t += 0.008;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.55;
      const cols = 40;
      const rows = 30;

      // Draw hexagonal/triangular grid mapped to sphere-like distortion
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const u = i / cols;
          const v = j / rows;

          // Spherical distortion
          const angleX = (u - 0.5) * Math.PI;
          const angleY = (v - 0.5) * Math.PI * 0.6;

          const distFromCenter = Math.sqrt(angleX * angleX + angleY * angleY);
          const bulge = Math.cos(distFromCenter * 0.8) * 0.15;

          const x = cx + angleX * radius * (1 + bulge);
          const y = cy + angleY * radius * (1 + bulge) + Math.sin(t + u * 3) * 8;

          // Fresnel-like glow: stronger at edges
          const fresnel = Math.min(1, distFromCenter / 1.2);
          const alpha = fresnel * 0.15 + 0.02;

          // Breathing pulse
          const pulse = 0.7 + Math.sin(t * 2 + distFromCenter * 3) * 0.3;
          const finalAlpha = alpha * pulse;

          // Grid lines
          if (i < cols) {
            const u2 = (i + 1) / cols;
            const angleX2 = (u2 - 0.5) * Math.PI;
            const dist2 = Math.sqrt(angleX2 * angleX2 + angleY * angleY);
            const bulge2 = Math.cos(dist2 * 0.8) * 0.15;
            const x2 = cx + angleX2 * radius * (1 + bulge2);
            const y2 = cy + angleY * radius * (1 + bulge2) + Math.sin(t + u2 * 3) * 8;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${finalAlpha * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          if (j < rows) {
            const v2 = (j + 1) / rows;
            const angleY2 = (v2 - 0.5) * Math.PI * 0.6;
            const dist2 = Math.sqrt(angleX * angleX + angleY2 * angleY2);
            const bulge2 = Math.cos(dist2 * 0.8) * 0.15;
            const x2 = cx + angleX * radius * (1 + bulge2);
            const y2 = cy + angleY2 * radius * (1 + bulge2) + Math.sin(t + u * 3) * 8;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${finalAlpha * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          // Glow points at intersections
          if (i % 3 === 0 && j % 3 === 0 && distFromCenter < 1.3) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${finalAlpha * 2})`;
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
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
        zIndex: 1,
        opacity: 0.6,
      }}
    />
  );
});

export default NeuralGridBackground;
