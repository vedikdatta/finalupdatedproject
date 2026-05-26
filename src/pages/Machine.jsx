import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  Upload,
  Cpu,
  AlertTriangle,
  Activity,
  CheckCircle2,
  TrendingUp,
  Sliders,
  FileSpreadsheet
} from "lucide-react";

export default function Machine() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fileName, setFileName] = useState("");
  const navigate = useNavigate();

  // ================= HANDLE CSV INPUT =================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    // Upload to backend so the Dashboard & AI Assistant get synced with this data
    const formData = new FormData();
    formData.append("file", file);
    try {
      await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
    } catch (err) {
      console.error("Failed to sync dataset with backend:", err);
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data;
        setCsvData(data);

        let detectedHeaders = [];
        if (data.length > 0) {
          detectedHeaders = Object.keys(data[0]);
          setHeaders(detectedHeaders);
        }

        generateSmartSummary(data, detectedHeaders);
      },
    });
  };

  // ================= DEEP ANALYTICS & RISK ENGINE =================
  const generateSmartSummary = (data, currentHeaders) => {
    if (!data || data.length === 0) return;

    const totalRows = data.length;

    let machineCol = currentHeaders.find(h => h.toLowerCase().includes("machine") || h.toLowerCase().includes("id") || h.toLowerCase().includes("name")) || currentHeaders[0];
    let statusCol = currentHeaders.find(h => h.toLowerCase().includes("status") || h.toLowerCase().includes("state"));
    let tempCol = currentHeaders.find(h => h.toLowerCase().includes("temp") || h.toLowerCase().includes("heat"));

    const totalMachines = new Set(data.map((row) => row[machineCol])).size;

    let activeCount = 0;
    let criticalCount = 0;
    let highRiskList = [];

    data.forEach((row, idx) => {
      const machineName = row[machineCol] || `Line Element #${idx + 1}`;
      let isRisk = false;
      let riskReason = [];

      if (statusCol && row[statusCol]) {
        const statusVal = row[statusCol].toLowerCase();
        if (["error", "fault", "critical", "warning", "maintenance", "stopped"].some(term => statusVal.includes(term))) {
          isRisk = true;
          riskReason.push(`Reported Status: "${row[statusCol]}"`);
        }
        if (["active", "running", "online", "normal"].some(term => statusVal.includes(term))) {
          activeCount++;
        }
      } else {
        const rowString = Object.values(row).join(" ").toLowerCase();
        if (["error", "fault", "critical"].some(term => rowString.includes(term))) {
          isRisk = true;
          riskReason.push("System Alert Flagged");
        }
        activeCount++;
      }

      if (tempCol && row[tempCol]) {
        const tempNum = parseFloat(row[tempCol]);
        if (!isNaN(tempNum) && tempNum > 85) {
          isRisk = true;
          riskReason.push(`Thermal Overheating (${tempNum}°C)`);
        }
      }

      if (isRisk) {
        criticalCount++;
        if (!highRiskList.some(item => item.name === machineName)) {
          highRiskList.push({
            name: machineName,
            issue: riskReason.join(" | ") || "Irregular Operations Detected",
          });
        }
      }
    });

    let criticalMetrics = [];
    currentHeaders.forEach((key) => {
      const isNumeric = data.slice(0, 10).every(row => row[key] !== "" && !isNaN(parseFloat(row[key])));
      
      if (isNumeric && key !== machineCol) {
        const values = data.map(row => Number(row[key])).filter(v => !isNaN(v));
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          criticalMetrics.push({
            metricName: key,
            averageValue: avg.toFixed(1),
            peakValue: Math.max(...values),
          });
        }
      }
    });

    const systemHealth = Math.max(0, Math.min(100, Math.round(((totalMachines - criticalCount) / totalMachines) * 100)));

    setSummary({
      totalRows,
      totalMachines,
      activeCount,
      criticalCount,
      highRiskList,
      criticalMetrics,
      systemHealth
    });
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        body {
          background: #0f172a;
          color: #f1f5f9;
        }

        .dashboard-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          padding: 40px 32px;
        }

        .app-container {
          max-width: 1750px;
          margin: 0 auto;
        }

        /* TYPOGRAPHY OVERHAUL */
        .main-header {
          margin-bottom: 40px;
          text-align: center;
        }

        .title-text {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
        }

        .subtitle-text {
          font-size: 18px;
          color: #94a3b8;
          font-weight: 400;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
        }

        /* PREMIUM FILE DROPZONE */
        .dropzone-box {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 2px dashed #6366f1;
          border-radius: 28px;
          padding: 70px 40px;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 50px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .dropzone-box:hover {
          border-color: #a855f7;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%);
          transform: translateY(-4px);
          box-shadow: 0 30px 60px -12px rgba(99, 102, 241, 0.3);
        }

        .dropzone-label {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .dropzone-headline {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dropzone-sub {
          font-size: 16px;
          color: #64748b;
        }

        .pill-filename {
          margin-top: 24px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          padding: 12px 28px;
          border-radius: 100px;
          color: #a5b4fc;
          font-weight: 600;
          font-size: 16px;
          backdrop-filter: blur(5px);
        }

        /* EXPANDED TELEMETRY METRIC CARDS */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .metric-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          border-color: #6366f1;
          box-shadow: 0 20px 40px -12px rgba(99, 102, 241, 0.2);
        }

        .metric-label {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .metric-value {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .icon-wrapper {
          padding: 16px;
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* INDUSTRIAL DUAL GRID SPLIT */
        .insights-layout-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 28px;
          margin-bottom: 40px;
        }

        @media (max-width: 1300px) {
          .insights-layout-grid { grid-template-columns: 1fr; }
        }

        .panel-widget {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.3s ease;
        }

        .panel-widget:hover {
          border-color: #6366f1;
          box-shadow: 0 20px 40px -12px rgba(99, 102, 241, 0.15);
        }

        .panel-headline {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: -0.3px;
        }

        /* TARGETED RISK ROW CRADLES */
        .risk-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .danger-item-row {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;
        }

        .danger-item-row:hover {
          transform: translateX(6px);
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }

        .risk-machine-name {
          font-size: 20px;
          font-weight: 700;
          color: #fca5a5;
          margin-bottom: 4px;
        }

        .risk-issue-desc {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .alert-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 16px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .no-risk-placeholder {
          text-align: center;
          padding: 50px 20px;
          color: #10b981;
          font-weight: 600;
          font-size: 18px;
          border: 2px dashed rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          background: rgba(16, 185, 129, 0.02);
        }

        /* OPERATIONAL VALUE STRIPS */
        .analytics-strip-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .strip-item {
          background: rgba(20, 30, 51, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 14px;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .strip-item:hover {
          background: rgba(20, 30, 51, 0.8);
          border-color: #6366f1;
          transform: translateX(4px);
        }

        .strip-title {
          font-size: 18px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .strip-data-group {
          display: flex;
          gap: 32px;
        }

        .strip-data-pill {
          text-align: right;
        }

        .pill-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .pill-num {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #06b6d4, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* HIGH-CAPACITY DIAGNOSTIC MATRIX FEED */
        .table-section-wrapper {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.3s ease;
        }

        .table-section-wrapper:hover {
          border-color: #6366f1;
          box-shadow: 0 20px 40px -12px rgba(99, 102, 241, 0.15);
        }

        .scrollable-table-box {
          overflow-x: auto;
          margin-top: 20px;
          border-radius: 14px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          background: rgba(20, 30, 51, 0.8);
          color: #a5b4fc;
          font-weight: 600;
          font-size: 14px;
          padding: 16px 20px;
          letter-spacing: 0.3px;
          border-bottom: 2px solid rgba(99, 102, 241, 0.3);
        }

        td {
          padding: 14px 20px;
          font-size: 14px;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
          font-weight: 400;
        }

        tr:last-child td { border: none; }
        tr:hover td { background: rgba(99, 102, 241, 0.05); }
      `}</style>

      <div className="dashboard-layout">
        <div className="app-container">
          
          {/* CONTROL HEADER */}
          <header className="main-header">
            <h1 className="title-text">AI Factory Diagnostics Terminal</h1>
            <p className="subtitle-text">
              Ingest telemetry records or machine run arrays to evaluate system thresholds and track hardware liabilities.
            </p>
          </header>

          {/* DROPZONE INPUT SECTION */}
          <section className="dropzone-box">
            <label className="dropzone-label">
              <Upload size={56} color="#6366f1" strokeWidth={1.5} />
              <div className="dropzone-headline">Import Operational CSV Matrix</div>
              <div className="dropzone-sub">Drop raw manufacturing structural files here</div>
              <input type="file" accept=".csv" onChange={handleFileUpload} />
            </label>
            {fileName && (
              <div className="pill-filename fade-up">
                <FileSpreadsheet size={18} />
                {fileName}
                <CheckCircle2 size={18} color="#4ade80" style={{ marginLeft: 8 }} />
              </div>
            )}
          </section>

          {/* NEW BUTTON TO NAVIGATE TO DASHBOARD AFTER UPLOAD */}
          {summary && (
            <div className="fade-up" style={{ textAlign: "center", marginTop: 24, marginBottom: 40 }}>
              <button 
                onClick={() => navigate('/dashboard')}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#fff",
                  border: "none",
                  padding: "14px 28px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.4)",
                  transition: "transform 0.2s"
                }}
                onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
              >
                View Dashboard Output 📊
              </button>
            </div>
          )}

          {summary && (
            <>
              {/* TELEMETRY STATS GRID */}
              <section className="stats-row">
                <div className="metric-card">
                  <div>
                    <div className="metric-label">Monitored Assets</div>
                    <div className="metric-value">{summary.totalMachines}</div>
                  </div>
                  <div className="icon-wrapper">
                    <Cpu size={36} color="#6366f1" />
                  </div>
                </div>

                <div className="metric-card">
                  <div>
                    <div className="metric-label">Online Nodes</div>
                    <div className="metric-value">{summary.activeCount}</div>
                  </div>
                  <div className="icon-wrapper">
                    <CheckCircle2 size={36} color="#10b981" />
                  </div>
                </div>

                <div className="metric-card">
                  <div>
                    <div className="metric-label">Assets At Risk</div>
                    <div className="metric-value" style={{ 
                      background: summary.criticalCount > 0 
                        ? "linear-gradient(135deg, #ef4444, #f87171)" 
                        : "linear-gradient(135deg, #fff, #c4b5fd)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text"
                    }}>
                      {summary.criticalCount}
                    </div>
                  </div>
                  <div className="icon-wrapper">
                    <AlertTriangle size={36} color={summary.criticalCount > 0 ? '#ef4444' : '#f59e0b'} />
                  </div>
                </div>

                <div className="metric-card">
                  <div>
                    <div className="metric-label">Total System Health</div>
                    <div className="metric-value">{summary.systemHealth}%</div>
                  </div>
                  <div className="icon-wrapper">
                    <Activity size={36} color="#a855f7" />
                  </div>
                </div>
              </section>

              {/* INDUSTRIAL INSIGHT DUAL VIEW */}
              <section className="insights-layout-grid">
                
                {/* COMPONENT: SPECIFIC MACHINE RISK EXPOSURE TRACKER */}
                <div className="panel-widget">
                  <h2 className="panel-headline" style={{ color: '#fca5a5' }}>
                    <AlertTriangle size={28} color="#ef4444" />
                    Critical Risk & Liability Logs
                  </h2>
                  <div className="risk-stack">
                    {summary.highRiskList.length > 0 ? (
                      summary.highRiskList.map((machine, i) => (
                        <div className="danger-item-row" key={i}>
                          <div>
                            <div className="risk-machine-name">{machine.name}</div>
                            <div className="risk-issue-desc">{machine.issue}</div>
                          </div>
                          <span className="alert-badge">Critical</span>
                        </div>
                      ))
                    ) : (
                      <div className="no-risk-placeholder">
                        ✓ All automated operational loops running within normal thresholds.
                      </div>
                    )}
                  </div>
                </div>

                {/* COMPONENT: NUMERICAL CALIBRATION VARIABLES */}
                <div className="panel-widget">
                  <h2 className="panel-headline">
                    <TrendingUp size={28} color="#06b6d4" />
                    Mean Telemetry Runs
                  </h2>
                  <div className="analytics-strip-list">
                    {summary.criticalMetrics.map((metric, index) => (
                      <div className="strip-item" key={index}>
                        <div className="strip-title">{metric.metricName}</div>
                        <div className="strip-data-group">
                          <div className="strip-data-pill">
                            <div className="pill-label">Mean Run</div>
                            <div className="pill-num">{metric.averageValue}</div>
                          </div>
                          <div className="strip-data-pill">
                            <div className="pill-label">Peak</div>
                            <div className="pill-num" style={{ 
                              background: "linear-gradient(135deg, #f43f5e, #fb7185)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text"
                            }}>{metric.peakValue}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </section>

              {/* CORE RAW DIAGNOSTICS DATAFEED */}
              <section className="table-section-wrapper">
                <h2 className="panel-headline">
                  <Sliders size={28} color="#818cf8" />
                  Raw Diagnostics Array Feed
                </h2>
                <div className="scrollable-table-box">
                  <table>
                    <thead>
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 15).map((row, index) => (
                        <tr key={index}>
                          {headers.map((header, i) => (
                            <td key={i}>{row[header]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

        </div>
      </div>
    </>
  );
}