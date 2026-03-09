import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export interface FaceMetrics {
  isDetected: boolean;
  blinkRate: number;
  headMovement: number;
  faceOrientation: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  stressScore: number;
  faceConfidence: number;
  landmarks: Array<{ x: number; y: number; z?: number }>;
}

const INITIAL_METRICS: FaceMetrics = {
  isDetected: false,
  blinkRate: 0,
  headMovement: 0,
  faceOrientation: { yaw: 0, pitch: 0, roll: 0 },
  stressScore: 0,
  faceConfidence: 0,
  landmarks: [],
};

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [metrics, setMetrics] = useState<FaceMetrics>(INITIAL_METRICS);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const blinkCount = useRef(0);
  const lastBlink = useRef(Date.now());
  const prevNose = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults((results: any) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        setMetrics((m) => ({ ...m, isDetected: false }));
        return;
      }

      const landmarks = results.multiFaceLandmarks[0];

      // Example key landmarks
      const leftEyeTop = landmarks[159];
      const leftEyeBottom = landmarks[145];

      const nose = landmarks[1];

      // Blink detection using eye distance
      const eyeDistance = Math.abs(leftEyeTop.y - leftEyeBottom.y);

      if (eyeDistance < 0.01) {
        const now = Date.now();
        if (now - lastBlink.current > 300) {
          blinkCount.current += 1;
          lastBlink.current = now;
        }
      }

      const blinkRate = blinkCount.current;

      // Head movement detection
      let headMovement = 0;

      if (prevNose.current) {
        headMovement = Math.sqrt(
          Math.pow(nose.x - prevNose.current.x, 2) +
          Math.pow(nose.y - prevNose.current.y, 2)
        );
      }

      prevNose.current = { x: nose.x, y: nose.y };

      // Orientation approximation
      const leftFace = landmarks[234];
      const rightFace = landmarks[454];
      const forehead = landmarks[10];
      const chin = landmarks[152];

      const yaw = (rightFace.x - leftFace.x) * 100;
      const pitch = (forehead.y - chin.y) * 100;
      const roll = (leftEyeTop.y - landmarks[386].y) * 100;

      // Simple stress heuristic
      const stressScore = Math.min(100, blinkRate * 2 + headMovement * 500);

      setMetrics({
        isDetected: true,
        blinkRate,
        headMovement,
        faceOrientation: { yaw, pitch, roll },
        stressScore,
        faceConfidence: 0.98,
        landmarks: landmarks.map((p: any) => ({
          x: p.x,
          y: p.y,
          z: p.z,
        })),
      });
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, [videoRef]);

  return { metrics, hasPermission };
}