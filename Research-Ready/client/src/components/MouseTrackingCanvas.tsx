import { useEffect, useRef } from 'react';
import type { MouseMetrics } from '@/hooks/useMouseTracking';

interface MouseTrackingCanvasProps {
  metrics: MouseMetrics;
}

export function MouseTrackingCanvas({ metrics }: MouseTrackingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = 'rgba(15, 15, 35, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scale ratio to map full screen coordinates down to the small canvas size
    const scaleX = canvas.width / window.innerWidth;
    const scaleY = canvas.height / window.innerHeight;

    const mapX = (x: number) => x * scaleX;
    const mapY = (y: number) => y * scaleY;

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw position history trail
    if (metrics.positions.length > 1) {
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mapX(metrics.positions[0].x), mapY(metrics.positions[0].y));
      for (let i = 1; i < metrics.positions.length; i++) {
        ctx.lineTo(mapX(metrics.positions[i].x), mapY(metrics.positions[i].y));
      }
      ctx.stroke();
    }

    // Draw current position
    ctx.fillStyle = 'rgb(0, 200, 255)';
    ctx.beginPath();
    ctx.arc(mapX(metrics.x), mapY(metrics.y), 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw velocity vector
    if (Math.abs(metrics.velocityX) > 0 || Math.abs(metrics.velocityY) > 0) {
      const vScale = 0.5;
      ctx.strokeStyle = 'rgba(150, 0, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mapX(metrics.x), mapY(metrics.y));
      ctx.lineTo(
        mapX(metrics.x + metrics.velocityX * vScale),
        mapY(metrics.y + metrics.velocityY * vScale)
      );
      ctx.stroke();
    }

  }, [metrics]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded border border-primary/20 bg-black/40"
    />
  );
}
