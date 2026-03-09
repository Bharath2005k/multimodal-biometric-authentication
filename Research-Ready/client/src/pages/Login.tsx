import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Fingerprint, Activity, Terminal, ArrowRight, AlertTriangle,
  Eye, EyeOff, Cpu, MousePointer, Video, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useKeyboardTracking } from '@/hooks/useKeyboardTracking';
import { useMouseTracking } from '@/hooks/useMouseTracking';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useRiskScoring } from '@/hooks/useRiskScoring';
import { MouseTrackingCanvas } from '@/components/MouseTrackingCanvas';

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const keyboardMetrics = useKeyboardTracking();
  const mouseMetrics = useMouseTracking();
  const { metrics: faceMetrics, hasPermission: facePermission } = useFaceDetection(videoRef);
  const riskScore = useRiskScoring(keyboardMetrics, mouseMetrics, faceMetrics);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsAuthenticating(true);

    try {
      // Start progress bar visual
      const interval = setInterval(() => {
        setAuthProgress(prev => {
          if (prev >= 90) return 90; // hold at 90% until backend responds 
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 200);

      // Make actual API call to backend
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          risk_score: riskScore.overall,
          classification: riskScore.classification,
          typing_score: riskScore.typing,
          mouse_score: riskScore.mouse,
          face_score: riskScore.facial,
          device_info: navigator.userAgent
        }),
      });

      const data = await response.json();

      clearInterval(interval);
      setAuthProgress(100);

      if (data.status === 'success') {
        setTimeout(() => setLocation('/dashboard'), 500);
      } else {
        setTimeout(() => {
          setIsAuthenticating(false);
          setAuthProgress(0);
          alert(`Authentication Error: ${data.message || 'Verification Failed'}`);
        }, 500);
      }
    } catch (error) {
      console.error('Authentication Error:', error);
      setIsAuthenticating(false);
      setAuthProgress(0);
      alert('Network error: Could not connect to backend server. Please verify the backend is running at http://localhost:8000');
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 85) return 'text-destructive';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-400';
    return 'text-green-500';
  };

  const getRiskBg = (score: number) => {
    if (score >= 85) return 'bg-destructive/10 border-destructive/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    if (score >= 30) return 'bg-orange-400/10 border-orange-400/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/5 bg-card/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="font-display font-bold tracking-wider">
              NEXUS<span className="text-primary">SECURE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>MULTIMODAL CAPTURE ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-y-auto">

        {/* Left Column: Login Form + Risk Score */}
        <div className="flex flex-col gap-6">
          {/* Panel 1: Banking Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="data-card p-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              SECURE LOGIN
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agent ID</Label>
                <Input
                  type="text"
                  placeholder="operator_id"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/50 border-primary/20 focus:border-primary h-10"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-primary/20 focus:border-primary h-10 pr-10"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 rounded border-primary/20 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs font-mono text-muted-foreground cursor-pointer">
                  Remember credentials
                </label>
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating || !username || !password || riskScore.overall >= 85}
                className="w-full h-10 bg-primary hover:bg-primary/80 text-primary-foreground font-display font-bold uppercase tracking-wider"
                data-testid="button-submit-login"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-pulse" />
                    AUTHENTICATING...
                  </div>
                ) : riskScore.overall >= 85 ? (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    DURESS DETECTED - LOGIN BLOCKED
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    LOGIN
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {isAuthenticating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-white/5"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-primary">AUTHENTICATION PROGRESS</span>
                    <span className="text-muted-foreground">{authProgress}%</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-primary"
                      animate={{ width: `${authProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                    <div className="text-primary mb-1">RUNNING BIOMETRIC MODELS:</div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${authProgress > 10 ? 'bg-green-500' : 'bg-primary animate-pulse'}`}></div>
                      LSTM Keystroke Dynamics Model {authProgress > 10 && '✓'}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${authProgress > 30 ? 'bg-green-500' : authProgress > 10 ? 'bg-primary animate-pulse' : 'bg-white/10'}`}></div>
                      XGBoost Mouse Trajectory Model {authProgress > 30 && '✓'}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${authProgress > 60 ? 'bg-green-500' : authProgress > 30 ? 'bg-primary animate-pulse' : 'bg-white/10'}`}></div>
                      TensorFlow Face Mesh Engine {authProgress > 60 && '✓'}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${authProgress > 85 ? 'bg-green-500' : authProgress > 60 ? 'bg-primary animate-pulse' : 'bg-white/10'}`}></div>
                      Late Fusion Risk Aggregation {authProgress > 85 && '✓'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Panel 2: Keyboard Behavior */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="data-card p-6"
          >
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              KEYBOARD DYNAMICS
            </h3>

            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div className="p-3 bg-black/30 rounded border border-white/5">
                <div className="text-xs text-muted-foreground">Keys Pressed</div>
                <div className="text-2xl font-bold text-primary mt-1">{keyboardMetrics.keystrokeCount}</div>
              </div>
              <div className="p-3 bg-black/30 rounded border border-white/5">
                <div className="text-xs text-muted-foreground">Avg Dwell (ms)</div>
                <div className="text-2xl font-bold text-primary mt-1">{keyboardMetrics.averageDwellTime.toFixed(0)}</div>
              </div>
              <div className="p-3 bg-black/30 rounded border border-white/5">
                <div className="text-xs text-muted-foreground">Avg Flight (ms)</div>
                <div className="text-2xl font-bold text-primary mt-1">{keyboardMetrics.averageFlightTime.toFixed(0)}</div>
              </div>
              <div className="p-3 bg-black/30 rounded border border-white/5">
                <div className="text-xs text-muted-foreground">Backspaces</div>
                <div className="text-2xl font-bold text-yellow-500 mt-1">{keyboardMetrics.backspaceCount}</div>
              </div>
              <div className="col-span-2 p-3 bg-black/30 rounded border border-white/5">
                <div className="text-xs text-muted-foreground mb-2">Typing Variance</div>
                <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, keyboardMetrics.typingVariance / 2)}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Mouse Tracking + Face Detection */}
        <div className="flex flex-col gap-6">
          {/* Panel 3: Mouse Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="data-card p-6 flex flex-col flex-1 min-h-[300px]"
          >
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-primary" />
              MOUSE TRACKING
            </h3>

            <div className="flex-1 min-h-[160px] mb-4 relative">
              <MouseTrackingCanvas metrics={mouseMetrics} />
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2 bg-black/30 rounded border border-white/5">
                <div className="text-muted-foreground">Speed</div>
                <div className="text-lg font-bold text-primary">{mouseMetrics.speed.toFixed(0)}px/s</div>
              </div>
              <div className="p-2 bg-black/30 rounded border border-white/5">
                <div className="text-muted-foreground">Jitter</div>
                <div className="text-lg font-bold text-yellow-500">{mouseMetrics.jitterScore.toFixed(1)}</div>
              </div>
              <div className="p-2 bg-black/30 rounded border border-white/5">
                <div className="text-muted-foreground">Acceleration</div>
                <div className="text-lg font-bold text-primary">{mouseMetrics.acceleration.toFixed(1)}</div>
              </div>
              <div className="p-2 bg-black/30 rounded border border-white/5">
                <div className="text-muted-foreground">Dir Changes</div>
                <div className="text-lg font-bold text-primary">{mouseMetrics.directionChanges}</div>
              </div>
            </div>
          </motion.div>

          {/* Panel 4: Face Detection + Risk Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="data-card p-6 flex flex-col flex-1 min-h-[300px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                FACIAL ANALYSIS
              </h3>
              {facePermission && faceMetrics.isDetected && (
                <div className="flex items-center gap-1 text-xs font-mono text-green-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  DETECTED
                </div>
              )}
            </div>

            <div className="flex-1 min-h-[160px] mb-4 overflow-hidden rounded border border-primary/20 bg-black relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover z-10 absolute inset-0 transition-opacity duration-300 ${facePermission ? 'opacity-100' : 'opacity-0'}`}
              />
              {!facePermission && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-muted-foreground text-xs text-center p-4 z-20">
                  Camera access required for face detection. Please allow browser popup.
                </div>
              )}
            </div>

            {faceMetrics.isDetected && (
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-2 bg-black/30 rounded border border-white/5">
                  <div className="text-muted-foreground">Blink Rate</div>
                  <div className="text-lg font-bold text-primary">{faceMetrics.blinkRate.toFixed(1)}</div>
                </div>
                <div className="p-2 bg-black/30 rounded border border-white/5">
                  <div className="text-muted-foreground">Head Motion</div>
                  <div className="text-lg font-bold text-primary">{faceMetrics.headMovement.toFixed(1)}</div>
                </div>
                <div className="col-span-2 p-2 bg-black/30 rounded border border-white/5">
                  <div className="text-muted-foreground">Stress Score</div>
                  <div className="text-lg font-bold text-yellow-500">{faceMetrics.stressScore.toFixed(1)}</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Bottom Risk Score Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-t border-white/5 ${getRiskBg(riskScore.overall)} shrink-0`}
      >
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-5 h-5 text-primary hidden sm:block" />
            <div className="text-center sm:text-left">
              <h3 className="font-display font-bold text-sm uppercase">Risk Assessment</h3>
              <p className="text-xs font-mono text-muted-foreground">{riskScore.classification}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-xs font-mono text-muted-foreground mb-1">Overall</div>
              <div className={`text-3xl font-display font-bold ${getRiskColor(riskScore.overall)}`}>
                {riskScore.overall.toFixed(1)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6 font-mono text-xs">
              <div className="text-center">
                <div className="text-muted-foreground mb-1">Typing</div>
                <div className="text-base sm:text-lg font-bold text-primary">{riskScore.typing.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground mb-1">Mouse</div>
                <div className="text-base sm:text-lg font-bold text-primary">{riskScore.mouse.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground mb-1">Facial</div>
                <div className="text-base sm:text-lg font-bold text-primary">{riskScore.facial.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
