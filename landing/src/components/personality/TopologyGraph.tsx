import { useRef, useEffect, memo } from 'react';

interface Node {
  x: number;
  y: number;
  label: string;
  color: string;
  radius: number;
  targetX: number;
  targetY: number;
}

const TopologyGraph = memo(function TopologyGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes: Node[] = [
      { x: 0.3, y: 0.3, label: 'EXPLORATION', color: '#00f0ff', radius: 14, targetX: 0.3, targetY: 0.3 },
      { x: 0.6, y: 0.25, label: 'EMPATHY', color: '#ff006e', radius: 12, targetX: 0.6, targetY: 0.25 },
      { x: 0.2, y: 0.55, label: 'HUMOR', color: '#ffbe0b', radius: 11, targetX: 0.2, targetY: 0.55 },
      { x: 0.7, y: 0.5, label: 'LOGIC', color: '#00f0ff', radius: 13, targetX: 0.7, targetY: 0.5 },
      { x: 0.45, y: 0.7, label: 'CREATIVITY', color: '#ff006e', radius: 12, targetX: 0.45, targetY: 0.7 },
      { x: 0.35, y: 0.45, label: 'CURIOSITY', color: '#ffbe0b', radius: 10, targetX: 0.35, targetY: 0.45 },
      { x: 0.55, y: 0.65, label: 'DEFENSE', color: '#00f0ff', radius: 11, targetX: 0.55, targetY: 0.65 },
    ];

    const connections = [
      [0, 1], [0, 2], [0, 5], [1, 3], [1, 4],
      [2, 5], [2, 6], [3, 4], [4, 6], [5, 6],
    ];

    const draw = () => {
      t += 0.01;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      connections.forEach(([a, b]) => {
        const n1 = nodes[a];
        const n2 = nodes[b];
        const x1 = n1.x * w + Math.sin(t + a) * 3;
        const y1 = n1.y * h + Math.cos(t + a * 1.3) * 3;
        const x2 = n2.x * w + Math.sin(t + b) * 3;
        const y2 = n2.y * h + Math.cos(t + b * 1.3) * 3;

        // Bezier curve
        const cx1 = x1 + (x2 - x1) * 0.3 + Math.sin(t * 2 + a) * 20;
        const cy1 = y1 + (y2 - y1) * 0.3;
        const cx2 = x1 + (x2 - x1) * 0.7;
        const cy2 = y2 + (y1 - y2) * 0.3;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
        ctx.strokeStyle = `rgba(255,255,255,0.08)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Data packet flowing along line
        const packetT = (t * 0.5 + a * 0.3) % 1;
        const px = (1 - packetT) * (1 - packetT) * (1 - packetT) * x1 +
                   3 * (1 - packetT) * (1 - packetT) * packetT * cx1 +
                   3 * (1 - packetT) * packetT * packetT * cx2 +
                   packetT * packetT * packetT * x2;
        const py = (1 - packetT) * (1 - packetT) * (1 - packetT) * y1 +
                   3 * (1 - packetT) * (1 - packetT) * packetT * cy1 +
                   3 * (1 - packetT) * packetT * packetT * cy2 +
                   packetT * packetT * packetT * y2;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = n1.color;
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const x = node.x * w + Math.sin(t + i) * 3;
        const y = node.y * h + Math.cos(t + i * 1.3) * 3;

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, node.radius * 3);
        gradient.addColorStop(0, `${node.color}44`);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, node.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node body
        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}22`;
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = node.color;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + node.radius + 16);
      });

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
      }}
    />
  );
});

export default TopologyGraph;
