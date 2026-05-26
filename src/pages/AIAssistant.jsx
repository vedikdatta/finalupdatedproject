import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, MessageCircle, Send, Bot, User, FileSpreadsheet,
  AlertTriangle, CheckCircle2, Activity, Cpu, Sparkles,
  ArrowLeft, Loader2, Trash2, ChevronDown
} from "lucide-react";

const API = "http://localhost:8000";

export default function AIAssistant() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Welcome to **FactoryPulse AI Assistant**!\n\nUpload a CSV file with your manufacturing data and I'll analyze it using our trained ML models. I can:\n\n• 🔍 Predict machine **failures**\n• 🔎 Detect **anomalies**\n• 📊 Provide **statistical insights**\n• 📈 Analyze **correlations**\n\nDrop your CSV above to get started!",
    },
  ]);
  const [chatMsg, setChatMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Upload CSV ──────────────────────────────────────
  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      setUploadResult(data);

      if (data.success) {
        let msg = `✅ **File "${data.filename}" uploaded successfully!**\n\n`;
        msg += `• **${data.rows}** rows × **${data.columns.length}** columns\n`;

        if (data.predictions) {
          const rate = ((data.predictions.failure_count / data.rows) * 100).toFixed(1);
          msg += `\n🔴 **Failure Predictions:**\n`;
          msg += `• 🟢 Normal: ${data.predictions.no_failure_count}\n`;
          msg += `• 🔴 Failures: ${data.predictions.failure_count} (${rate}%)\n`;
        }
        if (data.anomalies) {
          msg += `\n🔎 **Anomaly Detection:**\n`;
          msg += `• Anomalies found: ${data.anomalies.anomaly_count}\n`;
        }
        if (data.missing_features && data.missing_features.length > 0) {
          msg += `\n⚠️ Missing features for full prediction: ${data.missing_features.join(", ")}\n`;
        }
        msg += `\n💬 Ask me anything about your data!`;

        setMessages((prev) => [...prev, { role: "bot", text: msg }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ Upload failed: ${data.error}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `❌ Connection error: ${err.message}. Make sure the backend is running on port 8000.` },
      ]);
    }
    setUploading(false);
  };

  // ── Chat send ───────────────────────────────────────
  const handleSend = async () => {
    if (!chatMsg.trim() || sending) return;
    const userMsg = chatMsg.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatMsg("");
    setSending(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `❌ Connection error. Is the backend running?` },
      ]);
    }
    setSending(false);
  };

  // ── Drag & drop ─────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  // ── Quick question chips ────────────────────────────
  const quickQuestions = [
    "Give me a summary",
    "How many failures?",
    "Any anomalies?",
    "What's the system health?",
    "Show correlations",
    "What columns are available?",
  ];

  // ── Render markdown-lite ────────────────────────────
  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      let processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>');
      return (
        <span key={i} dangerouslySetInnerHTML={{ __html: processed }} style={{ display: "block", minHeight: line === "" ? 8 : "auto" }} />
      );
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#060b14; font-family:'Inter',system-ui,sans-serif; }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-track { background:#0d1117 }
        ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:5px }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes glow { 0%,100% { box-shadow:0 0 20px rgba(99,102,241,0.15) } 50% { box-shadow:0 0 40px rgba(99,102,241,0.3) } }
        .fade-up { animation: fadeUp 0.4s ease-out both }
        .chip:hover { background:rgba(99,102,241,0.25)!important; border-color:#6366f1!important; transform:translateY(-1px) }
      `}</style>

      <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#060b14 0%,#0d1117 100%)", color:"#f1f5f9", display:"flex", flexDirection:"column" }}>
        
        {/* ── Top Bar ──────────────────────────────────── */}
        <header style={{ padding:"14px 24px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", gap:14, background:"rgba(6,11,20,0.8)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:10 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background:"none", border:"1px solid #1e293b", borderRadius:10, padding:"7px 12px", color:"#94a3b8", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13, transition:"all 0.2s" }}>
            <ArrowLeft size={15} /> Dashboard
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(99,102,241,0.4)" }}>
              <Sparkles size={19} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize:18, fontWeight:800, letterSpacing:-0.3, background:"linear-gradient(90deg,#6366f1,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                AI Chat Assistant
              </h1>
              <p style={{ fontSize:11, color:"#475569" }}>Upload CSV · Ask questions · Get ML-powered answers</p>
            </div>
          </div>
          {uploadResult?.success && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span style={{ fontSize:12, color:"#10b981", fontWeight:600 }}>{fileName}</span>
            </div>
          )}
        </header>

        <div style={{ flex:1, display:"flex", flexDirection:"column", maxWidth:960, width:"100%", margin:"0 auto", padding:"0 16px" }}>

          {/* ── Upload Zone ────────────────────────────── */}
          <div className="fade-up"
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              margin:"20px 0 12px",
              background: dragActive ? "rgba(99,102,241,0.08)" : "rgba(13,17,23,0.6)",
              border: `2px dashed ${dragActive ? "#6366f1" : "#1e293b"}`,
              borderRadius:18, padding: uploading ? "20px" : "28px 24px",
              textAlign:"center", cursor:"pointer",
              transition:"all 0.3s",
              animation: dragActive ? "glow 1.5s ease-in-out infinite" : "none",
            }}
          >
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display:"none" }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />

            {uploading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <Loader2 size={20} color="#6366f1" style={{ animation:"spin 1s linear infinite" }} />
                <span style={{ fontSize:14, color:"#94a3b8" }}>Analyzing data with ML models...</span>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14 }}>
                <Upload size={24} color={dragActive ? "#6366f1" : "#475569"} />
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:15, fontWeight:700, color: dragActive ? "#a5b4fc" : "#e2e8f0" }}>
                    {fileName ? `📁 ${fileName} — Click to replace` : "Drop CSV file here or click to upload"}
                  </div>
                  <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>
                    Manufacturing sensor data, machine logs, telemetry records
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Stats Bar (after upload) ───────────────── */}
          {uploadResult?.success && (
            <div className="fade-up" style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
              {[
                { icon: <FileSpreadsheet size={14}/>, label:"Rows", value: uploadResult.rows, color:"#6366f1" },
                { icon: <Cpu size={14}/>, label:"Columns", value: uploadResult.columns.length, color:"#06b6d4" },
                uploadResult.predictions && { icon: <AlertTriangle size={14}/>, label:"Failures", value: uploadResult.predictions.failure_count, color:"#ef4444" },
                uploadResult.anomalies && { icon: <Activity size={14}/>, label:"Anomalies", value: uploadResult.anomalies.anomaly_count, color:"#f59e0b" },
              ].filter(Boolean).map((s, i) => (
                <div key={i} style={{ flex:"1 1 100px", background:"#0d1117", border:"1px solid #1e293b", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, borderLeft:`3px solid ${s.color}` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", fontWeight:700, letterSpacing:1 }}>{s.label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Chat Messages ──────────────────────────── */}
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, padding:"8px 0 16px", minHeight:300 }}>
            {messages.map((msg, i) => (
              <div key={i} className="fade-up" style={{ display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap:8, animationDelay:`${i*0.03}s` }}>
                {msg.role === "bot" && (
                  <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                    <Bot size={16} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth:"75%",
                  background: msg.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#0d1117",
                  border: msg.role === "bot" ? "1px solid #1e293b" : "none",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding:"12px 16px",
                  fontSize:13,
                  lineHeight:1.65,
                  color: msg.role === "user" ? "#fff" : "#cbd5e1",
                }}>
                  {renderText(msg.text)}
                </div>
                {msg.role === "user" && (
                  <div style={{ width:32, height:32, borderRadius:10, background:"#1e293b", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                    <User size={16} color="#94a3b8" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Bot size={16} color="#fff" />
                </div>
                <div style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:"16px 16px 16px 4px", padding:"12px 16px", display:"flex", gap:4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── Quick Questions ─────────────────────────── */}
          {uploadResult?.success && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingBottom:8 }}>
              {quickQuestions.map((q, i) => (
                <button key={i} className="chip"
                  onClick={() => { setChatMsg(q); setTimeout(() => { setChatMsg(""); setMessages(prev => [...prev, {role:"user", text:q}]); setSending(true); fetch(`${API}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})}).then(r=>r.json()).then(d=>setMessages(prev=>[...prev,{role:"bot",text:d.answer}])).catch(()=>setMessages(prev=>[...prev,{role:"bot",text:"❌ Connection error"}])).finally(()=>setSending(false)); }, 50); }}
                  style={{ background:"rgba(99,102,241,0.08)", border:"1px solid #1e293b", borderRadius:999, padding:"5px 12px", color:"#94a3b8", fontSize:11, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input Bar ──────────────────────────────── */}
          <div style={{ padding:"12px 0 20px", borderTop:"1px solid #1e293b" }}>
            <div style={{ display:"flex", gap:8, background:"#0d1117", border:"1px solid #1e293b", borderRadius:14, padding:"6px 6px 6px 16px", alignItems:"center" }}>
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={uploadResult?.success ? "Ask about your manufacturing data..." : "Upload a CSV file first..."}
                disabled={sending}
                style={{ flex:1, background:"none", border:"none", outline:"none", color:"#f1f5f9", fontSize:14, fontFamily:"'Inter',sans-serif" }}
              />
              <button onClick={handleSend} disabled={sending || !chatMsg.trim()}
                style={{
                  background: chatMsg.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e293b",
                  border:"none", borderRadius:10, padding:"9px 16px", cursor: chatMsg.trim() ? "pointer" : "default",
                  display:"flex", alignItems:"center", gap:6, color:"#fff", fontSize:13, fontWeight:600,
                  transition:"all 0.2s", opacity: chatMsg.trim() ? 1 : 0.5,
                }}
              >
                <Send size={14} /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
