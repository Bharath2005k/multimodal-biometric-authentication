import { useMemo } from 'react';
import type { KeyboardMetrics } from './useKeyboardTracking';
import type { MouseMetrics } from './useMouseTracking';
import type { FaceMetrics } from './useFaceDetection';

export interface RiskScore {
  overall: number;
  typing: number;
  mouse: number;
  facial: number;
  classification: 'NORMAL' | 'SUSPICIOUS' | 'HIGH_RISK' | 'DURESS_DETECTED';
}

export function useRiskScoring(
  keyboard: KeyboardMetrics,
  mouse: MouseMetrics,
  face: FaceMetrics
): RiskScore {
  return useMemo(() => {
    // Typing risk: high variance + many backspaces = suspicious
    const typingAnomaly = Math.min(
      100,
      (keyboard.typingVariance / 50 + keyboard.backspaceCount * 0.5) * 5
    );

    // Mouse risk: high jitter + erratic movement = suspicious
    const mouseAnomaly = Math.min(
      100,
      mouse.jitterScore * 1.5 + (mouse.directionChanges / Math.max(1, mouse.totalMovements / 15)) * 15 + (mouse.speed > 1500 ? 10 : 0)
    );

    // Facial risk: high stress score = suspicious
    const facialStress = Math.min(100, face.stressScore * 0.8 + face.headMovement * 1.0);

    // Overall risk using weighted average
    const overall = Math.min(
      100,
      (typingAnomaly * 0.3) + (mouseAnomaly * 0.3) + (facialStress * 0.4)
    );

    // Classification (Maintained exact strings matching the backend endpoint alerts)
    let classification: RiskScore['classification'] = 'NORMAL';
    if (overall >= 85) classification = 'CONFIRMED DURESS ATTACK' as any; // Cast for now, normally you'd want enum
    else if (overall >= 60) classification = 'SUSPICIOUS BEHAVIOR' as any;
    else if (overall >= 30) classification = 'HIGH RISK AUTHENTICATION' as any;

    return {
      overall: Math.round(overall * 10) / 10,
      typing: Math.round(typingAnomaly * 10) / 10,
      mouse: Math.round(mouseAnomaly * 10) / 10,
      facial: Math.round(facialStress * 10) / 10,
      classification,
    };
  }, [keyboard, mouse, face]);
}
