import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  Sun, Moon, RefreshCw, Activity, AlertTriangle, Thermometer,
  Wind, Gauge, Zap, TrendingUp, TrendingDown, Cpu, Factory,
  Calendar, Clock, Shield, CheckCircle, XCircle, AlertCircle, Wifi,
  Upload, Wand2
} from 'lucide-react';

// ─── Theme Context ────────────────────────────────────────────────────────────
const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });
const useTheme = () => useContext(ThemeContext);

// ─── Utility helpers ──────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round1 = v => Math.round(v * 10) / 10;
const round2 = v => Math.round(v * 100) / 100;

// ─── Confidence Calculation (Weighted Composite) ──────────────────────────────
const computeConfidenceFromPlantData = (d) => {
  let score = 0;

  // ── Efficiency score (weight 35%) ─────────────────────────────────────
  const eff = clamp(d.overallEfficiency, 0, 100);
  const effScore = eff / 100;
  score += effScore * 35;

  // ── Temperature score (weight 25%) ───────────────────────────────────
  // Ideal range: ≤75°C → full score; degrades above that
  let tempScore;
  if (d.avgTemp <= 75)       tempScore = 1.0;
  else if (d.avgTemp <= 85)  tempScore = 1.0 - ((d.avgTemp - 75) / 10) * 0.5;
  else if (d.avgTemp <= 95)  tempScore = 0.5 - ((d.avgTemp - 85) / 10) * 0.4;
  else                       tempScore = 0.1;
  score += tempScore * 25;

  // ── Vibration score (weight 20%) ──────────────────────────────────────
  // Ideal: ≤2 mm/s; degrades smoothly above
  let vibScore;
  if (d.maxVibration <= 2)       vibScore = 1.0;
  else if (d.maxVibration <= 4)  vibScore = 1.0 - ((d.maxVibration - 2) / 2) * 0.4;
  else if (d.maxVibration <= 7)  vibScore = 0.6 - ((d.maxVibration - 4) / 3) * 0.5;
  else                           vibScore = 0.1;
  score += vibScore * 20;

  // ── Pressure score (weight 10%) ───────────────────────────────────────
  // Ideal: 30–60 PSI; penalise deviations
  let pressScore;
  if (d.avgPressure >= 30 && d.avgPressure <= 60) pressScore = 1.0;
  else if (d.avgPressure < 30) pressScore = clamp(d.avgPressure / 30, 0.2, 1.0);
  else pressScore = clamp(1 - (d.avgPressure - 60) / 40, 0.2, 1.0);
  score += pressScore * 10;

  // ── Normalise to 0–1 ──────────────────────────────────────────────────
  let raw = score / 90; // total weights = 90

  // ── Flag penalties (multiplicative so they never hard-pin to 0) ───────
  if (d.errorState)   raw *= 0.55;
  if (d.warningState) raw *= 0.82;
  const maintPenalty = Math.min(d.maintenanceOverdueCount * 0.04, 0.20);
  raw = raw * (1 - maintPenalty);

  const confidence = clamp(raw, 0.02, 0.98);
  const classification = confidence < 0.40 ? 'LOW' : confidence < 0.68 ? 'MEDIUM' : 'HIGH';
  return { confidence, classification };
};

const generateExplanation = (d, confidence, classification) => {
  const pct = Math.round(confidence * 100);
  const issues = [];
  if (d.avgTemp > 85)            issues.push(`critical temperature (${round1(d.avgTemp)}°C)`);
  else if (d.avgTemp > 75)       issues.push(`elevated temperature (${round1(d.avgTemp)}°C)`);
  if (d.maxVibration > 6)        issues.push(`critical vibration (${round2(d.maxVibration)} mm/s)`);
  else if (d.maxVibration > 4)   issues.push(`elevated vibration (${round2(d.maxVibration)} mm/s)`);
  if (d.overallEfficiency < 60)  issues.push(`low efficiency (${round1(d.overallEfficiency)}%)`);
  else if (d.overallEfficiency < 75) issues.push(`moderate efficiency (${round1(d.overallEfficiency)}%)`);
  if (d.maintenanceOverdueCount > 0)
    issues.push(`${d.maintenanceOverdueCount} overdue maintenance task${d.maintenanceOverdueCount > 1 ? 's' : ''}`);
  if (d.errorState)   issues.push('active error state');
  if (d.warningState) issues.push('anomalies detected');

  let msg = `Confidence ${pct}% — ${classification} performance risk. `;
  if (issues.length) msg += `Factors: ${issues.join('; ')}. `;
  else               msg += 'All metrics within nominal operating range. ';
  if (confidence < 0.40)      msg += 'Immediate intervention required.';
  else if (confidence < 0.68) msg += 'Preventive maintenance recommended.';
  else                        msg += 'System operating stably.';
  return msg;
};

// ─── Heatmap helpers ──────────────────────────────────────────────────────────
const HEATMAP_METRICS = [
  { name: 'Temperature (°C)', key: 'temp',  min: 50,  max: 95  },
  { name: 'Vibration (mm/s)', key: 'vib',   min: 0.5, max: 7   },
  { name: 'Pressure (PSI)',   key: 'press', min: 20,  max: 80  },
  { name: 'Efficiency (%)',   key: 'eff',   min: 45,  max: 100 },
];
const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

const generateHeatmapData = () =>
  WEEKS.map(() => ({
    temp:  55 + Math.random() * 35,
    vib:   1  + Math.random() * 5.5,
    press: 30 + Math.random() * 40,
    eff:   50 + Math.random() * 50,
  }));

const getHeatmapColor = (value, metric) => {
  const n = clamp((value - metric.min) / (metric.max - metric.min), 0, 1);
  const r = Math.round(220 * n + 30  * (1 - n));
  const g = Math.round(60  * n + 200 * (1 - n));
  const b = Math.round(60  * n + 80  * (1 - n));
  return `rgb(${r},${g},${b})`;
};

// ─── Demo data generator ──────────────────────────────────────────────────────
const generateDemoPlantData = () => ({
  avgTemp:              55 + Math.random() * 40,
  maxVibration:         0.5 + Math.random() * 6.5,
  avgPressure:          30  + Math.random() * 40,
  overallEfficiency:    50  + Math.random() * 50,
  maintenanceOverdueCount: Math.floor(Math.random() * 5),
  errorState:           Math.random() < 0.15,
  warningState:         Math.random() < 0.35,
  timestamp:            new Date().toISOString(),
});

// ─── CSV parser ───────────────────────────────────────────────────────────────
const parseCSV = (text, filename) => {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return null;

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));

  const rows = lines.slice(1).map(l => {
    const vals = l.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = parseFloat(vals[i]); });
    return obj;
  }).filter(r => Object.values(r).some(v => !isNaN(v)));

  if (!rows.length) return null;

  const find = (...keys) => {
    for (const k of keys) {
      const match = headers.find(h => h.includes(k));
      if (match) return match;
    }
    return null;
  };

  const tempKey  = find('temp', 'air_temperature', 'temperature');
  const vibKey   = find('vib', 'torque', 'rotation', 'vibration');
  const pressKey = find('press', 'psi', 'pressure');
  const effKey   = find('eff', 'quality', 'efficiency');
  const failKey  = find('fail', 'error', 'machine_failure', 'failure');
  const warnKey  = find('warn', 'twf', 'hdf', 'pwf', 'osf', 'warning');
  const maintKey = find('maint', 'overdue', 'rnf', 'maintenance');

  const avgOf = key => {
    if (!key) return null;
    const vs = rows.map(r => r[key]).filter(v => !isNaN(v));
    return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
  };
  const maxOf = key => {
    if (!key) return null;
    const vs = rows.map(r => r[key]).filter(v => !isNaN(v));
    return vs.length ? Math.max(...vs) : null;
  };
  const sumOf = key => {
    if (!key) return 0;
    return rows.reduce((a, r) => a + (isNaN(r[key]) ? 0 : r[key]), 0);
  };

  // Convert Kelvin → Celsius if needed
  let avgTemp = avgOf(tempKey);
  if (avgTemp && avgTemp > 200) avgTemp -= 273.15;

  // Convert Torque (Nm) → vibration proxy (÷10)
  let maxVib = maxOf(vibKey);
  if (maxVib && vibKey && vibKey.includes('torque')) maxVib = maxVib / 10;

  // Efficiency: if fraction (0–1), scale to percent
  let rawEff = avgOf(effKey);
  if (rawEff != null && rawEff <= 1) rawEff = rawEff * 100;

  const plant = {
    avgTemp:              avgTemp ?? 72,
    maxVibration:         maxVib  ?? 3,
    avgPressure:          avgOf(pressKey) ?? 48,
    overallEfficiency:    rawEff != null ? clamp(rawEff, 0, 100) : 75,
    maintenanceOverdueCount: Math.round(sumOf(maintKey)),
    errorState:           sumOf(failKey) > 0,
    warningState:         sumOf(warnKey) > rows.length * 0.1,
    timestamp:            new Date().toISOString(),
  };

  // Chunk rows into 4 weekly buckets
  const chunkSize = Math.max(1, Math.floor(rows.length / 4));
  const heatmapData = [0, 1, 2, 3].map(i => {
    const chunk = rows.slice(i * chunkSize, (i + 1) * chunkSize);
    if (!chunk.length) return { temp: plant.avgTemp, vib: plant.maxVibration, press: plant.avgPressure, eff: plant.overallEfficiency };
    const ca = key => {
      if (!key) return null;
      const vs = chunk.map(r => r[key]).filter(v => !isNaN(v));
      return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
    };
    let t = ca(tempKey); if (t && t > 200) t -= 273.15;
    let v = ca(vibKey);  if (v && vibKey && vibKey.includes('torque')) v = v / 10;
    let e = ca(effKey);  if (e != null && e <= 1) e = e * 100;
    return {
      temp:  t  ?? plant.avgTemp,
      vib:   v  ?? plant.maxVibration,
      press: ca(pressKey) ?? plant.avgPressure,
      eff:   e  != null ? clamp(e, 0, 100) : plant.overallEfficiency,
    };
  });

  return { plant, heatmapData, filename: filename || 'Uploaded CSV' };
};

// ─── Static fallback data (neutral — no flags set) ────────────────────────────
const NEUTRAL_PLANT = {
  avgTemp: 70, maxVibration: 2.5, avgPressure: 48,
  overallEfficiency: 80, maintenanceOverdueCount: 0,
  errorState: false, warningState: false,
  timestamp: new Date().toISOString(),
};

const FALLBACK_HEATMAP = generateHeatmapData();

const FALLBACK_EFF = WEEKS.map((_, i) => ({
  name: `W${i + 1}`, efficiency: 70 + Math.round(Math.random() * 20), target: 80,
}));

const FALLBACK_SENSOR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(() => ({
  temp:     68 + Math.random() * 10,
  vib:      2  + Math.random() * 2,
  pressure: 44 + Math.random() * 10,
}));

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const tokens = isDark => ({
  bg:        isDark ? '#060b14' : '#f0f4ff',
  surface:   isDark ? '#0d1117' : '#ffffff',
  surface2:  isDark ? '#0f172a' : '#f8fafc',
  border:    isDark ? '#1e293b' : '#e2e8f0',
  text:      isDark ? '#f1f5f9' : '#0f172a',
  textSub:   isDark ? '#94a3b8' : '#64748b',
  textMuted: isDark ? '#475569' : '#94a3b8',
  grid:      isDark ? '#1e293b' : '#f1f5f9',
  axis:      isDark ? '#475569' : '#94a3b8',
});

// ─── Sub-components ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.18)', fontSize: 12, fontFamily: "'DM Mono',monospace" }}>
      <p style={{ color: t.textSub, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const Card = ({ children, t, style = {} }) => (
  <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.surface === '#ffffff' ? '0 2px 16px rgba(0,0,0,.06)' : '0 4px 24px rgba(0,0,0,.4)', ...style }}>
    {children}
  </div>
);

const CardTitle = ({ icon, title, sub, t }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#3b82f6' }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: 0.3 }}>{title}</span>
    </div>
    {sub && <span style={{ fontSize: 11, color: t.textMuted }}>{sub}</span>}
  </div>
);

const MetricTile = ({ icon, label, value, unit, accent, t, trend }) => (
  <div
    style={{ background: t.surface2, border: `1px solid ${t.border}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'transform .15s', cursor: 'default' }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: accent }}>{icon}</span>
      <span style={{ fontSize: 10, letterSpacing: 1.5, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color: t.text, fontFamily: "'DM Mono',monospace" }}>{value}</span>
      <span style={{ fontSize: 12, color: t.textMuted }}>{unit}</span>
      {trend != null && (
        <span style={{ marginLeft: 'auto', color: trend > 0 ? '#10b981' : '#ef4444', display: 'flex' }}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </span>
      )}
    </div>
  </div>
);

const ConfidenceRing = ({ confidence, classification, t }) => {
  const circ  = 2 * Math.PI * 68;
  const color = classification === 'HIGH' ? '#10b981' : classification === 'MEDIUM' ? '#f59e0b' : '#ef4444';
  const pct   = Math.round(clamp(confidence * 100, 0, 100));
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="100" cy="100" r="68" fill="none" stroke={t.border} strokeWidth="14" />
        <circle cx="100" cy="100" r="68" fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: t.text, fontFamily: "'DM Mono',monospace" }}>
          {pct}<span style={{ fontSize: 20, fontWeight: 500 }}>%</span>
        </span>
        <span style={{ fontSize: 11, color: t.textMuted, marginTop: 4, letterSpacing: 1 }}>CONFIDENCE</span>
        <span style={{ fontSize: 10, color, fontWeight: 700, marginTop: 2, letterSpacing: 0.8 }}>{classification} RISK</span>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { isDark, toggleTheme } = useTheme();
  const t = tokens(isDark);
  const fileRef = useRef();

  const [plantData,     setPlantData]     = useState(NEUTRAL_PLANT);
  const [prediction,    setPrediction]    = useState(() => {
    const p = computeConfidenceFromPlantData(NEUTRAL_PLANT);
    return { ...p, explanation: generateExplanation(NEUTRAL_PLANT, p.confidence, p.classification) };
  });
  const [heatmapData,   setHeatmapData]   = useState(FALLBACK_HEATMAP);
  const [dynEfficiency, setDynEfficiency] = useState(FALLBACK_EFF);
  const [dynSensor,     setDynSensor]     = useState(FALLBACK_SENSOR);
  const [dynRiskData,   setDynRiskData]   = useState([
    { name: 'LOW', value: 1, color: '#ef4444' },
    { name: 'MEDIUM', value: 2, color: '#f59e0b' },
    { name: 'HIGH', value: 3, color: '#10b981' },
  ]);
  const [datasetName,   setDatasetName]   = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());
  const [pulse,         setPulse]         = useState(false);

  // ── Recompute prediction whenever plantData changes ────────────────────────
  useEffect(() => {
    const p = computeConfidenceFromPlantData(plantData);
    setPrediction({ ...p, explanation: generateExplanation(plantData, p.confidence, p.classification) });
  }, [plantData]);

  // ── Apply a full parsed dataset (from CSV or backend) ─────────────────────
  const applyDataset = useCallback(({ plant, heatmapData: hd, filename }) => {
    setPlantData(plant);
    setDatasetName(filename);
    setHeatmapData(hd);

    const lowCnt  = hd.filter(w => w.eff < 60).length;
    const medCnt  = hd.filter(w => w.eff >= 60 && w.eff < 80).length;
    const highCnt = hd.filter(w => w.eff >= 80).length;
    setDynRiskData([
      { name: 'LOW',    value: Math.max(lowCnt, 1),  color: '#ef4444' },
      { name: 'MEDIUM', value: Math.max(medCnt, 1),  color: '#f59e0b' },
      { name: 'HIGH',   value: Math.max(highCnt, 1), color: '#10b981' },
    ]);

    setDynEfficiency(hd.map((w, i) => ({
      name: `W${i + 1}`,
      efficiency: Math.round(w.eff),
      target: 80,
    })));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    setDynSensor(hd.slice(0, 7).map((w, i) => ({
      name:     days[i] || `D${i + 1}`,
      temp:     parseFloat(round1(w.temp)),
      vib:      parseFloat(round2(w.vib)),
      pressure: parseFloat(round1(w.press)),
    })));
  }, []);

  // ── Fetch from backend ─────────────────────────────────────────────────────
  const fetchFromBackend = useCallback(async () => {
    try {
      const res  = await fetch('http://localhost:8000/prediction-data', { cache: 'no-store' });
      const data = await res.json();
      setBackendOnline(true);
      if (!data.has_data) return false;
      applyDataset({ plant: data.plantData, heatmapData: data.heatmapData, filename: data.filename || 'Backend dataset' });
      return true;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, [applyDataset]);

  useEffect(() => { fetchFromBackend(); }, [fetchFromBackend]);

  // ── CSV upload ─────────────────────────────────────────────────────────────
  const handleCSV = useCallback(e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result, file.name);
      if (parsed) {
        applyDataset(parsed);
        setBackendOnline(null); // neither on nor off, just CSV
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [applyDataset]);

  // ── Demo data ──────────────────────────────────────────────────────────────
  const loadDemo = useCallback(() => {
    const plant = generateDemoPlantData();
    const heatmapData = generateHeatmapData();
    applyDataset({ plant, heatmapData, filename: 'Demo dataset' });
  }, [applyDataset]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setLastRefresh(new Date());
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    const ok = await fetchFromBackend();
    if (!ok && !datasetName) loadDemo();
  }, [fetchFromBackend, loadDemo, datasetName]);

  const riskColor = prediction.classification === 'HIGH' ? '#10b981'
                  : prediction.classification === 'MEDIUM' ? '#f59e0b' : '#ef4444';
  const riskBg    = prediction.classification === 'HIGH' ? 'rgba(16,185,129,.10)'
                  : prediction.classification === 'MEDIUM' ? 'rgba(245,158,11,.10)' : 'rgba(239,68,68,.10)';
  const axisStyle  = { fill: t.axis, fontSize: 11, fontFamily: "'DM Mono',monospace" };
  const legendStyle = { color: t.textSub, fontSize: 11, fontFamily: "'DM Mono',monospace" };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, padding: 24, fontFamily: "'DM Sans','Inter',sans-serif", transition: 'background .3s,color .3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spinOnce{to{transform:rotate(360deg)}}
        @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.3)}50%{box-shadow:0 0 0 8px rgba(59,130,246,0)}}
        .spin-hover:hover svg{animation:spinOnce .5s ease-in-out}
        .fade1{animation:fadeIn .5s ease-out both}
        .fade2{animation:fadeIn .5s .07s ease-out both}
        .fade3{animation:fadeIn .5s .14s ease-out both}
        .fade4{animation:fadeIn .5s .21s ease-out both}
        .fade5{animation:fadeIn .5s .28s ease-out both}
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <div className="fade1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59,130,246,.4)' }}>
              <Factory size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5, background: 'linear-gradient(90deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Manufacturing Intelligence
              </h1>
              <p style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>Real-time ML prediction & anomaly detection</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textMuted, fontFamily: "'DM Mono',monospace" }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: backendOnline === null ? '#94a3b8' : backendOnline ? '#10b981' : '#ef4444' }} />
              <span>{backendOnline === null ? (datasetName || 'Offline — demo or upload CSV') : backendOnline ? (datasetName || 'Backend live') : 'Offline'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.textMuted, fontFamily: "'DM Mono',monospace" }}>
              <Wifi size={12} color={backendOnline ? '#10b981' : '#ef4444'} />
              <Clock size={11} />
              <span>{lastRefresh.toLocaleTimeString()}</span>
            </div>

            {/* CSV Upload */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`, color: t.textSub, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <Upload size={14} /> Upload CSV
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            </label>

            {/* Demo */}
            <button onClick={loadDemo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`, color: t.textSub, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <Wand2 size={14} /> Demo
            </button>

            <button className="spin-hover" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`, color: t.textSub, cursor: 'pointer', fontSize: 12, fontWeight: 600, animation: pulse ? 'pulseRing .6s ease-out' : 'none', transition: 'background .3s,border .3s,color .3s' }}>
              <RefreshCw size={14} /> Refresh
            </button>

            <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#1e293b' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: isDark ? '#f59e0b' : '#475569', transition: 'background .3s,border .3s,color .3s' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* ── Confidence Ring + Metric Tiles + ML Analysis ── */}
        <div className="fade2" style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: 16 }}>

          {/* Ring */}
          <Card t={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ConfidenceRing confidence={prediction.confidence} classification={prediction.classification} t={t} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: riskBg, border: `1px solid ${riskColor}44` }}>
              {prediction.classification === 'HIGH'   ? <Shield size={14} color={riskColor} /> :
               prediction.classification === 'MEDIUM' ? <AlertCircle size={14} color={riskColor} /> :
                                                        <XCircle size={14} color={riskColor} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: riskColor, letterSpacing: 1 }}>{prediction.classification} RISK</span>
            </div>
          </Card>

          {/* Metric tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MetricTile icon={<Thermometer size={14} />} label="Temperature" value={round1(plantData.avgTemp)}          unit="°C"   accent="#ef4444" t={t} />
            <MetricTile icon={<Wind size={14} />}        label="Vibration"   value={round2(plantData.maxVibration)}     unit="mm/s" accent="#f97316" t={t} />
            <MetricTile icon={<Gauge size={14} />}       label="Pressure"    value={Math.round(plantData.avgPressure)}  unit="PSI"  accent="#3b82f6" t={t} />
            <MetricTile icon={<Zap size={14} />}         label="Efficiency"  value={round1(plantData.overallEfficiency)} unit="%"   accent="#10b981" t={t} trend={plantData.overallEfficiency - 75} />
          </div>

          {/* ML Analysis */}
          <Card t={t}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={16} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>ML Analysis</p>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: t.textSub }}>{prediction.explanation}</p>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plantData.errorState              && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)',  color: '#ef4444', fontWeight: 700 }}>● ERROR</span>}
                  {plantData.warningState            && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,.12)', color: '#f59e0b', fontWeight: 700 }}>● WARNING</span>}
                  {plantData.maintenanceOverdueCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#ef4444', fontWeight: 700 }}>{plantData.maintenanceOverdueCount} OVERDUE</span>}
                  {!plantData.errorState && !plantData.warningState && plantData.maintenanceOverdueCount === 0 &&
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#10b981', fontWeight: 700 }}>● NOMINAL</span>}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Charts row ── */}
        <div className="fade3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Card t={t}>
            <CardTitle icon={<AlertTriangle size={15} />} title="Risk Distribution" sub={datasetName || 'All time'} t={t} />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dynRiskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} innerRadius={42} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: t.border, strokeWidth: 1 }}>
                  {dynRiskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip t={t} />} />
                <Legend wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card t={t}>
            <CardTitle icon={<Activity size={15} />} title="Efficiency vs Target" sub={datasetName ? `From ${datasetName}` : 'Last 4 weeks'} t={t} />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dynEfficiency} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="efficiency" name="Actual" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={28} />
                <Bar dataKey="target"     name="Target" fill="#10b981" radius={[5, 5, 0, 0]} barSize={28} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card t={t}>
            <CardTitle icon={<TrendingUp size={15} />} title="Sensor Trends" sub={datasetName ? `From ${datasetName}` : '7-day view'} t={t} />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dynSensor}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left"  tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Legend wrapperStyle={legendStyle} />
                <Line yAxisId="left"  type="monotone" dataKey="temp"     name="Temp (°C)"        stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="vib"      name="Vibration (mm/s)" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line yAxisId="left"  type="monotone" dataKey="pressure" name="Pressure (PSI)"   stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Pressure area ── */}
        <Card t={t}>
          <CardTitle icon={<Gauge size={15} />} title="Pressure Area Trend" sub="Weekly readings" t={t} />
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={dynSensor}>
              <defs>
                <linearGradient id="pressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Area type="monotone" dataKey="pressure" name="Pressure (PSI)" stroke="#3b82f6" strokeWidth={2} fill="url(#pressGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* ── Heatmap ── */}
        <Card t={t}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#3b82f6' }}><Activity size={15} /></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Sensor Intensity Heatmap</span>
              {datasetName && <span style={{ fontSize: 11, color: t.textMuted }}>— {datasetName}</span>}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: t.textMuted }}>
              {[['#dc4040', 'High risk'], ['#22c870', 'Nominal']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Metric</th>
                  {WEEKS.map(w => (
                    <th key={w} style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEATMAP_METRICS.map(metric => (
                  <tr key={metric.key}>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: t.textSub, whiteSpace: 'nowrap' }}>{metric.name}</td>
                    {heatmapData.map((wd, idx) => {
                      const val = wd[metric.key] ?? 0;
                      return (
                        <td key={idx} style={{ padding: '10px 16px', textAlign: 'center', borderRadius: 8, background: getHeatmapColor(val, metric), color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'DM Mono',monospace", textShadow: '0 1px 3px rgba(0,0,0,.4)', cursor: 'default', transition: 'transform .15s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                          {round1(val)}{metric.key === 'eff' ? '%' : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Status footer ── */}
        <div className="fade5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card t={t}>
            <CardTitle icon={<Calendar size={15} />} title="Maintenance Overview" t={t} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Overdue tasks</span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', fontFamily: "'DM Mono',monospace" }}>{plantData.maintenanceOverdueCount}</span>
            </div>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 10, lineHeight: 1.5 }}>
              {plantData.maintenanceOverdueCount > 0
                ? <>Completing overdue tasks could improve confidence by up to <strong style={{ color: t.text }}>+{plantData.maintenanceOverdueCount * 8}%</strong>.</>
                : 'No overdue tasks. Maintenance schedule is up to date.'}
            </p>
          </Card>

          <Card t={t}>
            <CardTitle icon={<AlertCircle size={15} />} title="System Status" t={t} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  label: 'Plant state',
                  value: plantData.errorState ? 'Error' : plantData.warningState ? 'Warning' : 'Normal',
                  color: plantData.errorState ? '#ef4444' : plantData.warningState ? '#f59e0b' : '#10b981',
                  icon:  plantData.errorState ? <XCircle size={13} /> : plantData.warningState ? <AlertCircle size={13} /> : <CheckCircle size={13} />,
                },
                {
                  label: 'Performance trend',
                  value: plantData.overallEfficiency > 75 ? 'Improving' : 'Declining',
                  color: plantData.overallEfficiency > 75 ? '#10b981' : '#ef4444',
                  icon:  plantData.overallEfficiency > 75 ? <TrendingUp size={13} /> : <TrendingDown size={13} />,
                },
                {
                  label: 'ML Confidence',
                  value: `${Math.round(prediction.confidence * 100)}% (${prediction.classification})`,
                  color: riskColor,
                  icon:  <Shield size={13} />,
                },
                {
                  label: 'Sensor network',
                  value: 'Connected',
                  color: '#10b981',
                  icon:  <Wifi size={13} />,
                },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: t.surface2, border: `1px solid ${t.border}` }}>
                  <span style={{ fontSize: 12, color: t.textSub }}>{row.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: row.color }}>{row.icon} {row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, fontFamily: "'DM Mono',monospace", paddingBottom: 8 }}>
          Confidence = weighted composite · Efficiency 35% · Temperature 25% · Vibration 20% · Pressure 10% · Flag multipliers applied
        </p>
      </div>
    </div>
  );
};

// ─── App wrapper ──────────────────────────────────────────────────────────────
const App = () => {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark' ||
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);
  const toggleTheme = useCallback(() => setIsDark(p => !p), []);
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <Dashboard />
    </ThemeContext.Provider>
  );
};

export default App;