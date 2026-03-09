import { useState, useEffect, useRef } from 'react';

export interface KeyboardMetrics {
  keystrokeCount: number;
  averageDwellTime: number;
  averageFlightTime: number;
  typingSpeed: number;
  typingVariance: number;
  backspaceCount: number;
  lastDwellTime: number;
  lastFlightTime: number;
}

const INITIAL_METRICS: KeyboardMetrics = {
  keystrokeCount: 0,
  averageDwellTime: 0,
  averageFlightTime: 0,
  typingSpeed: 0,
  typingVariance: 0,
  backspaceCount: 0,
  lastDwellTime: 0,
  lastFlightTime: 0,
};

export function useKeyboardTracking() {
  const [metrics, setMetrics] = useState<KeyboardMetrics>(INITIAL_METRICS);
  
  const keystateRef = useRef<{ [key: string]: number }>({});
  const dwellTimesRef = useRef<number[]>([]);
  const flightTimesRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const key = e.key;

      if (!keystateRef.current[key]) {
        keystateRef.current[key] = now;
        
        // Calculate flight time (time since last key release)
        if (lastKeyTimeRef.current > 0) {
          const flightTime = now - lastKeyTimeRef.current;
          flightTimesRef.current.push(flightTime);
          if (flightTimesRef.current.length > 100) flightTimesRef.current.shift();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const now = Date.now();
      const key = e.key;
      const downTime = keystateRef.current[key];

      if (downTime) {
        const dwellTime = now - downTime;
        dwellTimesRef.current.push(dwellTime);
        if (dwellTimesRef.current.length > 100) dwellTimesRef.current.shift();
        
        delete keystateRef.current[key];
        lastKeyTimeRef.current = now;

        // Update metrics
        const backspaceCount = e.key === 'Backspace' ? 1 : 0;
        const avgDwell = dwellTimesRef.current.length > 0 
          ? dwellTimesRef.current.reduce((a, b) => a + b) / dwellTimesRef.current.length 
          : 0;
        const avgFlight = flightTimesRef.current.length > 0
          ? flightTimesRef.current.reduce((a, b) => a + b) / flightTimesRef.current.length
          : 0;

        // Calculate typing variance
        const variance = dwellTimesRef.current.length > 1
          ? Math.sqrt(
              dwellTimesRef.current.reduce((sum, val) => sum + Math.pow(val - avgDwell, 2), 0) /
              dwellTimesRef.current.length
            )
          : 0;

        setMetrics(prev => ({
          keystrokeCount: prev.keystrokeCount + 1,
          averageDwellTime: avgDwell,
          averageFlightTime: avgFlight,
          typingSpeed: dwellTimesRef.current.length / (Date.now() / 1000 + 1),
          typingVariance: variance,
          backspaceCount: prev.backspaceCount + backspaceCount,
          lastDwellTime: dwellTime,
          lastFlightTime: flightTimesRef.current[flightTimesRef.current.length - 1] || 0,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return metrics;
}
