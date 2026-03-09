import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, ZAxis
} from "recharts";
import {
  ShieldAlert, Activity, Users, Database, Fingerprint,
  Bell, CheckCircle2, AlertTriangle, LogOut
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

// Mock Data Generators
const generateTimeSeriesData = () => {
  return Array.from({ length: 20 }).map((_, i) => ({
    time: new Date(Date.now() - (20 - i) * 3000).toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
    risk: Math.max(5, Math.min(100, 15 + Math.sin(i * 0.5) * 10 + Math.random() * 15)),
    baseline: 15
  }));
};

const generateHeatmapData = () => {
  return Array.from({ length: 30 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 1000 + 200,
    risk: Math.random() > 0.8 ? 'high' : 'low'
  }));
};

const ALERTS = [
  { id: 'AL-902', user: 'op_smith', type: 'DURESS', score: 82, time: '2m ago' },
  { id: 'AL-901', user: 'op_jones', type: 'ANOMALY', score: 54, time: '14m ago' },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [timeSeries, setTimeSeries] = useState(generateTimeSeriesData());
  const [heatmapData, setHeatmapData] = useState(generateHeatmapData());
  const [currentRisk, setCurrentRisk] = useState(18);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSeries(prev => {
        const newData = [...prev.slice(1)];
        const newRisk = Math.max(5, Math.min(100, prev[prev.length - 1].risk + (Math.random() - 0.5) * 10));
        setCurrentRisk(newRisk);
        newData.push({
          time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
          risk: newRisk,
          baseline: 15
        });
        return newData;
      });

      if (Math.random() > 0.8) {
        setHeatmapData(generateHeatmapData());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (score: number) => {
    if (score > 70) return '#ef4444'; // destructive
    if (score > 40) return '#eab308'; // warning
    return '#06b6d4'; // primary
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
              <ShieldAlert className="w-4 h-4 text-primary" />
            </div>
            <div className="font-display font-bold tracking-wider">
              NEXUS<span className="text-primary">RISK</span> ENGINE
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">ML PIPELINE ACTIVE</span>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 font-mono text-xs"
              onClick={() => setLocation("/")}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              TERMINATE
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="data-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Active Sessions</p>
                <h3 className="text-3xl font-display font-bold mt-1">1,204</h3>
              </div>
              <Users className="w-5 h-5 text-primary/50" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="data-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Events Processed/sec</p>
                <h3 className="text-3xl font-display font-bold mt-1">45.2k</h3>
              </div>
              <Database className="w-5 h-5 text-primary/50" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="data-card p-5 border-l-4 border-l-yellow-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Elevated Risk</p>
                <h3 className="text-3xl font-display font-bold mt-1 text-yellow-500">24</h3>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-500/50" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="data-card p-5 border-l-4 border-l-destructive">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Active Interventions</p>
                <h3 className="text-3xl font-display font-bold mt-1 text-destructive">2</h3>
              </div>
              <ShieldAlert className="w-5 h-5 text-destructive/50" />
            </div>
          </motion.div>
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Continuous Authentication Stream */}
          <div className="lg:col-span-2 data-card p-6 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  TEMPORAL RISK DEVIATION
                </h3>
                <p className="text-xs font-mono text-muted-foreground">Late Fusion Weighted Risk Aggregation</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-primary rounded-full"></span> Score</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-white/20 rounded-full"></span> Baseline</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getRiskColor(currentRisk)} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={getRiskColor(currentRisk)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="baseline" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeDasharray="5 5" />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke={getRiskColor(currentRisk)}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-time Gauge / Current Status */}
          <div className="data-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-lg">SYSTEM POSTURE</h3>
              <p className="text-xs font-mono text-muted-foreground">Current Rolling Assessment</p>
            </div>

            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* SVG Gauge Implementation */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={getRiskColor(currentRisk)}
                    strokeWidth="8"
                    strokeDasharray={`${currentRisk * 2.82} 282`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-5xl font-display font-bold" style={{ color: getRiskColor(currentRisk) }}>
                    {Math.round(currentRisk)}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">RISK INDEX</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-black/40 rounded border border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">LSTM Confidence</span>
                <span className="text-sm font-mono text-primary">94.2%</span>
              </div>
              <div className="p-3 bg-black/40 rounded border border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">RF Spatial Match</span>
                <span className="text-sm font-mono text-primary">88.7%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Spatial Anomaly Heatmap */}
          <div className="data-card p-6 h-[300px] flex flex-col">
            <div className="mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" />
                BEHAVIORAL ANOMALY HEATMAP
              </h3>
              <p className="text-xs font-mono text-muted-foreground">Mouse dynamics spatial distribution</p>
            </div>

            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                  <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} />
                  <RechartsTooltip
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black/90 border border-primary/20 p-2 rounded text-xs font-mono shadow-xl relative z-50">
                            <div className="text-primary mb-1 font-bold">Anomaly Spatial Data</div>
                            <div>Zone XY: {Math.round(data.x)}, {Math.round(data.y)}</div>
                            <div>Intensity: {Math.round(data.z)}</div>
                            <div className={data.risk === 'high' ? 'text-destructive font-bold' : 'text-cyan-400'}>
                              Behavior: {data.risk.toUpperCase()} RISK
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    data={heatmapData}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || !payload) return <g></g>;

                      const risk = payload.risk;
                      // Calculate radius based on z-value (it's handled by recharts in props as node size, roughly mapping to the ZAxis range)
                      // z value range is roughly 50 to 400 area, so radius approx sqrt(z/pi) -> 4-11
                      return (
                        <circle
                          cx={cx} cy={cy} r={Math.max(5, (payload.z / 100))}
                          fill={risk === 'high' ? '#ef4444' : '#06b6d4'}
                          opacity={risk === 'high' ? 0.8 : 0.4}
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Alerts List */}
          <div className="data-card p-0 flex flex-col">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                SILENT ALERTS & INTERVENTIONS
              </h3>
            </div>

            <div className="p-2 space-y-2 flex-1 overflow-auto">
              {ALERTS.map((alert, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border border-white/5 flex items-center justify-between hover:bg-black/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${alert.type === 'DURESS' ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold flex items-center gap-2">
                        {alert.id}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-white/10 text-muted-foreground">{alert.type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">Session: {alert.user}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-white">{alert.score} <span className="text-xs text-muted-foreground font-mono font-normal">Risk</span></div>
                    <div className="text-xs text-muted-foreground font-mono">{alert.time}</div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-black/10 rounded border border-white/5 flex items-center gap-4 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-mono">No other anomalies detected in the last 24 hours.</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}