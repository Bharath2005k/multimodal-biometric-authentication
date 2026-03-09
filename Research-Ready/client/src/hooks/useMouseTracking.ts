import { useState, useEffect, useRef } from 'react';

export interface MouseMetrics {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  acceleration: number;
  jitterScore: number;
  directionChanges: number;
  totalMovements: number;
  averageSpeed: number;
  positions: Array<{ x: number; y: number; time: number }>;
}

const INITIAL_METRICS: MouseMetrics = {
  x: 0,
  y: 0,
  velocityX: 0,
  velocityY: 0,
  speed: 0,
  acceleration: 0,
  jitterScore: 0,
  directionChanges: 0,
  totalMovements: 0,
  averageSpeed: 0,
  positions: [],
};

export function useMouseTracking() {
  const [metrics, setMetrics] = useState<MouseMetrics>(INITIAL_METRICS);

  const lastPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const speedsRef = useRef<number[]>([]);
  const directionRef = useRef<number>(0);
  const positionsRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const currentPos = { x: e.clientX, y: e.clientY, time: now };

      if (lastPosRef.current.time === 0) {
        lastPosRef.current = currentPos;
        return;
      }

      const timeDelta = Math.max(1, now - lastPosRef.current.time);
      const dx = currentPos.x - lastPosRef.current.x;
      const dy = currentPos.y - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = distance / (timeDelta / 1000);

      speedsRef.current.push(speed);
      if (speedsRef.current.length > 100) speedsRef.current.shift();

      // Calculate velocity
      const velocityX = dx / (timeDelta / 1000);
      const velocityY = dy / (timeDelta / 1000);

      // Calculate acceleration
      const accelX = (velocityX - lastVelocityRef.current.x) / (timeDelta / 1000);
      const accelY = (velocityY - lastVelocityRef.current.y) / (timeDelta / 1000);
      const acceleration = Math.sqrt(accelX * accelX + accelY * accelY);

      // Calculate jitter (variance in acceleration)
      const jitterScore = Math.min(100, acceleration / 500);

      // Detect direction change
      let directionChanges = 0;
      const currentDirection = Math.atan2(dy, dx);
      if (lastPosRef.current.x !== 0 && lastPosRef.current.y !== 0) {
        const angleDiff = Math.abs(currentDirection - directionRef.current);
        if (angleDiff > 0.5 && angleDiff < Math.PI - 0.5) {
          directionChanges = 1;
        }
      }
      directionRef.current = currentDirection;

      // Store position for drawing
      positionsRef.current.push(currentPos);
      if (positionsRef.current.length > 500) positionsRef.current.shift();

      const avgSpeed = speedsRef.current.length > 0
        ? speedsRef.current.reduce((a, b) => a + b) / speedsRef.current.length
        : 0;

      setMetrics(prev => ({
        x: currentPos.x,
        y: currentPos.y,
        velocityX,
        velocityY,
        speed,
        acceleration,
        jitterScore,
        directionChanges: prev.directionChanges + directionChanges,
        totalMovements: prev.totalMovements + 1,
        averageSpeed: avgSpeed,
        positions: [...positionsRef.current],
      }));

      lastPosRef.current = currentPos;
      lastVelocityRef.current = { x: velocityX, y: velocityY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return metrics;
}
