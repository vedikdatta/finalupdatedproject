import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";

// ─── STEP CONSTANTS ─────────────────────────────────────────────────────────
const STEP = {
  LOGIN: "login",
  FORGOT_EMAIL: "forgot_email",
  VERIFY_OTP: "verify_otp",
  RESET_PASSWORD: "reset_password",
  SUCCESS: "success",
};

function Login() {
  const navigate = useNavigate();

  // ── Shared state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(STEP.LOGIN);
  const [authMethod, setAuthMethod] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ── Login form ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: "", phone: "", password: "" });

  // ── Forgot password flow ──────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ── Helpers ───────────────────────────────────────────────────────────────
  const startCooldown = (seconds = 60) => {
    setOtpCooldown(seconds);
    const iv = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const clearErrors = () => { setError(""); setSuccessMsg(""); };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearErrors();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);
    try {
      const identifier = authMethod === "email" ? formData.email : formData.phone;
      if (!identifier || !formData.password) {
        setError(`Please enter ${authMethod === "email" ? "email" : "phone number"} and password`);
        return;
      }
      const payload = { password: formData.password };
      if (authMethod === "email") payload.email = formData.email;
      else payload.phone = formData.phone;

      const res = await fetch(`${apiBase}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Authentication failed"); return; }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      alert("Login Successful! Redirecting to Dashboard...");
      navigate("/dashboard");
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── FORGOT PASSWORD – send OTP ────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!forgotEmail.trim()) { setError("Please enter your email address"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to send OTP"); return; }
      setSuccessMsg(`OTP sent to ${forgotEmail}`);
      startCooldown(60);
      setStep(STEP.VERIFY_OTP);
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── VERIFY OTP ────────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    clearErrors();
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearErrors();
    const otpString = otp.join("");
    if (otpString.length !== 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Invalid OTP"); return; }
      setResetToken(data.resetToken);
      setStep(STEP.RESET_PASSWORD);
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCooldown > 0) return;
    clearErrors();
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to resend OTP"); return; }
      setOtp(["", "", "", "", "", ""]);
      setSuccessMsg("New OTP sent successfully!");
      startCooldown(60);
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── RESET PASSWORD ────────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!newPassword || !confirmPassword) { setError("Please fill all fields"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to reset password"); return; }
      setStep(STEP.SUCCESS);
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── BACK TO LOGIN ─────────────────────────────────────────────────────────
  const goToLogin = () => {
    setStep(STEP.LOGIN);
    setForgotEmail("");
    setOtp(["", "", "", "", "", ""]);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    clearErrors();
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        html, body, #root { width: 100%; height: 100%; overflow: hidden; }

        :root {
          --bg-deep:   #020817;
          --bg-panel:  #030b1f;
          --bg-input:  #0f172a;
          --border:    #1e2d4a;
          --border-active: #3b82f6;
          --blue:      #3b82f6;
          --purple:    #9333ea;
          --text:      #f1f5f9;
          --muted:     #64748b;
          --success:   #22d3ee;
          --error-bg:  rgba(239,68,68,0.10);
          --error-border: #ef4444;
          --error-text:   #fca5a5;
          --success-bg:   rgba(34,211,238,0.10);
          --success-border: #22d3ee;
          --success-text:   #a5f3fc;
          --grad: linear-gradient(135deg, var(--blue), var(--purple));
          --font: 'Space Grotesk', system-ui, sans-serif;
          --mono: 'JetBrains Mono', monospace;
        }

        .container {
          width: 100vw; height: 100vh;
          display: flex; position: relative; overflow: hidden;
          background: var(--bg-deep); font-family: var(--font);
        }

        /* ── GLOWS ── */
        .glow1, .glow2 {
          position: absolute; border-radius: 50%;
          filter: blur(160px); pointer-events: none;
        }
        .glow1 { width: 42vw; height: 42vw; background: rgba(37,99,235,0.25); top:-15%; left:-10%; animation: pulse 8s ease-in-out infinite; }
        .glow2 { width: 42vw; height: 42vw; background: rgba(147,51,234,0.22); bottom:-15%; right:-10%; animation: pulse 8s ease-in-out infinite reverse; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.1);opacity:1} }

        /* ── LEFT PANEL ── */
        .left {
          flex: 1; position: relative; overflow: hidden;
          background: linear-gradient(135deg,#2563eb,#4338ca,#7e22ce);
          display: flex; align-items: center; justify-content: center; padding: 60px;
        }
        .left::before {
          content:''; position:absolute; width:200%; height:200%;
          background: radial-gradient(circle, rgba(255,255,255,.1) 1%, transparent 1%);
          background-size: 50px 50px; animation: moveDots 20s linear infinite;
        }
        @keyframes moveDots { from{transform:translate(0,0)} to{transform:translate(50px,50px)} }

        .left-content { max-width:520px; position:relative; z-index:1; }
        .logo {
          width:90px; height:90px; border-radius:50%;
          background:rgba(255,255,255,.12); backdrop-filter:blur(10px);
          display:flex; align-items:center; justify-content:center;
          margin-bottom:28px; animation:float 3s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

        .title {
          font-size:56px; font-weight:800; line-height:1.1;
          background:linear-gradient(135deg,#fff,#bfdbfe);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .description { margin-top:18px; font-size:17px; color:#dbeafe; line-height:1.6; }
        .features { margin-top:28px; }
        .feature { display:flex; gap:10px; margin-bottom:12px; align-items:center; color:#e0f2fe; font-size:15px; }
        .dot { width:8px; height:8px; background:#60a5fa; border-radius:50%; box-shadow:0 0 8px #60a5fa; flex-shrink:0; }

        /* ── RIGHT PANEL ── */
        .right {
          flex: 1; display:flex; align-items:center; justify-content:center;
          background:var(--bg-panel); position:relative;
        }
        .form-box {
          width:100%; max-width:440px; padding:24px;
          animation: fadeUp .5s ease-out;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        /* ── BACK BUTTON ── */
        .back-btn {
          display:inline-flex; align-items:center; gap:6px;
          background:none; border:none; color:var(--muted); cursor:pointer;
          font-size:13px; font-family:var(--font); margin-bottom:20px;
          transition:color .2s;
        }
        .back-btn:hover { color:var(--blue); }

        /* ── HEADINGS ── */
        .page-title {
          font-size:42px; font-weight:800;
          background:linear-gradient(135deg,#fff,#94a3b8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          line-height:1.1;
        }
        .page-subtitle { color:var(--muted); margin-bottom:24px; font-size:14px; margin-top:6px; }

        /* ── AUTH SWITCH ── */
        .switch { display:flex; gap:12px; margin:20px 0; }
        .switch button {
          flex:1; padding:11px; border:none; border-radius:10px;
          background:var(--bg-input); color:var(--muted); cursor:pointer;
          font-weight:600; font-size:14px; transition:all .25s; font-family:var(--font);
          border: 1px solid var(--border);
        }
        .switch button:hover { transform:translateY(-1px); }
        .switch .active {
          background:var(--grad); color:#fff; border-color:transparent;
          box-shadow:0 4px 18px rgba(59,130,246,.3);
        }

        /* ── INPUTS ── */
        .input-group { position:relative; margin-top:16px; }
        .input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
        input[type="email"], input[type="password"], input[type="tel"], input[type="text"] {
          width:100%; padding:13px 42px; border-radius:10px;
          border:1px solid var(--border); background:var(--bg-input);
          color:var(--text); font-size:14px; font-family:var(--font);
          transition:all .25s;
        }
        input:focus { outline:none; border-color:var(--border-active); box-shadow:0 0 0 3px rgba(59,130,246,.12); }
        input::placeholder { color:var(--muted); }
        .password-toggle {
          position:absolute; right:13px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:var(--muted); cursor:pointer;
          display:flex; align-items:center;
        }

        /* ── FORGOT LINK ── */
        .forgot-link {
          display:block; text-align:right; margin-top:8px;
          color:var(--blue); font-size:13px; font-weight:500;
          background:none; border:none; cursor:pointer; font-family:var(--font);
          transition:color .2s;
        }
        .forgot-link:hover { color:#93c5fd; }

        /* ── MESSAGES ── */
        .error-msg {
          background:var(--error-bg); border:1px solid var(--error-border);
          color:var(--error-text); padding:11px 14px; border-radius:10px;
          font-size:13px; margin-top:16px; text-align:center;
        }
        .success-msg {
          background:var(--success-bg); border:1px solid var(--success-border);
          color:var(--success-text); padding:11px 14px; border-radius:10px;
          font-size:13px; margin-top:16px; text-align:center;
        }

        /* ── PRIMARY BUTTON ── */
        .primary-btn {
          width:100%; margin-top:22px; padding:14px;
          border:none; border-radius:10px; background:var(--grad);
          color:#fff; font-weight:700; font-size:15px; font-family:var(--font);
          cursor:pointer; transition:all .25s; letter-spacing:.3px;
        }
        .primary-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 25px rgba(59,130,246,.3); }
        .primary-btn:disabled { opacity:.65; cursor:not-allowed; }

        /* ── OTP GRID ── */
        .otp-label { color:var(--muted); font-size:13px; margin-bottom:12px; margin-top:20px; }
        .otp-grid { display:flex; gap:10px; justify-content:center; }
        .otp-cell {
          width:46px; height:54px;
          border:1.5px solid var(--border); border-radius:10px;
          background:var(--bg-input); color:var(--text);
          font-size:22px; font-family:var(--mono); font-weight:600;
          text-align:center; transition:all .2s; padding:0;
        }
        .otp-cell:focus { outline:none; border-color:var(--border-active); box-shadow:0 0 0 3px rgba(59,130,246,.15); }
        .otp-cell.filled { border-color:var(--blue); color:var(--blue); }

        /* ── RESEND ── */
        .resend-row { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:16px; }
        .resend-btn {
          background:none; border:none; color:var(--blue); font-size:13px;
          font-weight:600; cursor:pointer; font-family:var(--font);
          display:inline-flex; align-items:center; gap:4px; transition:color .2s;
        }
        .resend-btn:disabled { color:var(--muted); cursor:not-allowed; }
        .resend-btn:not(:disabled):hover { color:#93c5fd; }
        .resend-timer { color:var(--muted); font-size:13px; font-family:var(--mono); }

        /* ── SUCCESS STATE ── */
        .success-icon {
          width:72px; height:72px; border-radius:50%;
          background:rgba(34,211,238,.12); border:2px solid #22d3ee;
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 24px; animation:popIn .4s ease-out;
        }
        @keyframes popIn { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }

        /* ── FOOTER ── */
        .footer { margin-top:22px; text-align:center; color:var(--muted); font-size:13px; }
        .footer a, .footer button.link {
          color:#60a5fa; text-decoration:none; font-weight:600;
          background:none; border:none; cursor:pointer; font-family:var(--font);
          font-size:13px; transition:color .2s;
        }
        .footer a:hover, .footer button.link:hover { color:#93c5fd; }

        /* ── STRENGTH BAR ── */
        .strength-row { display:flex; gap:4px; margin-top:8px; }
        .strength-seg { height:3px; flex:1; border-radius:2px; background:var(--border); transition:background .3s; }
        .strength-seg.weak { background:#ef4444; }
        .strength-seg.medium { background:#f59e0b; }
        .strength-seg.strong { background:#22d3ee; }

        /* ── RESPONSIVE ── */
        @media (max-width:968px) {
          .left { display:none; }
          .right { flex:1; }
          .page-title { font-size:34px; }
        }
      `}</style>

      <div className="container">
        <div className="glow1" />
        <div className="glow2" />

        {/* ── LEFT PANEL ── */}
        <div className="left">
          <div className="left-content">
            <div className="logo">
              <ShieldCheck size={48} color="#60a5fa" />
            </div>
            <h1 className="title">
              {step === STEP.LOGIN ? <>Welcome<br />Back</> :
               step === STEP.FORGOT_EMAIL ? <>Forgot<br />Password?</> :
               step === STEP.VERIFY_OTP ? <>Verify<br />Your OTP</> :
               step === STEP.RESET_PASSWORD ? <>New<br />Password</> :
               <>All<br />Done!</>}
            </h1>
            <p className="description">
              Secure login with professional dashboard access.<br />Monitor your factory operations in real-time.
            </p>
            <div className="features">
              {["Secure authentication", "OTP via email", "Easy password reset", "Real-time analytics"].map((item, i) => (
                <div className="feature" key={i}><div className="dot" /><span>{item}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right">
          <div className="form-box" key={step}>

            {/* ══════════════ LOGIN ══════════════ */}
            {step === STEP.LOGIN && (
              <>
                <h1 className="page-title">Login</h1>
                <p className="page-subtitle">Access your manufacturing dashboard</p>

                <div className="switch">
                  <button className={authMethod === "email" ? "active" : ""} onClick={() => { setAuthMethod("email"); clearErrors(); }}>
                    <Mail size={14} style={{ display:"inline", marginRight:6 }} />Email
                  </button>
                  <button className={authMethod === "phone" ? "active" : ""} onClick={() => { setAuthMethod("phone"); clearErrors(); }}>
                    <Phone size={14} style={{ display:"inline", marginRight:6 }} />Phone
                  </button>
                </div>

                <form onSubmit={handleLogin}>
                  {authMethod === "email" ? (
                    <div className="input-group">
                      <Mail className="input-icon" size={17} />
                      <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} />
                    </div>
                  ) : (
                    <div className="input-group">
                      <Phone className="input-icon" size={17} />
                      <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} />
                    </div>
                  )}

                  <div className="input-group">
                    <Lock className="input-icon" size={17} />
                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <button type="button" className="forgot-link" onClick={() => { clearErrors(); setStep(STEP.FORGOT_EMAIL); }}>
                    Forgot password?
                  </button>

                  {error && <div className="error-msg">{error}</div>}

                  <button type="submit" className="primary-btn" disabled={isLoading}>
                    {isLoading ? "Authenticating…" : "Login →"}
                  </button>

                  <div className="footer">
                    Don't have an account? <Link to="/register">Register here</Link>
                  </div>
                  <div className="footer" style={{ fontSize:11, marginTop:10, fontFamily:"var(--mono)" }}>
      
                  </div>
                </form>
              </>
            )}

            {/* ══════════════ FORGOT – ENTER EMAIL ══════════════ */}
            {step === STEP.FORGOT_EMAIL && (
              <>
                <button className="back-btn" onClick={goToLogin}><ArrowLeft size={14} /> Back to Login</button>
                <h1 className="page-title">Reset<br />Password</h1>
                <p className="page-subtitle">Enter your registered email to receive a 6-digit OTP</p>

                <form onSubmit={handleSendOtp}>
                  <div className="input-group">
                    <Mail className="input-icon" size={17} />
                    <input
                      type="email" placeholder="Registered Email Address"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); clearErrors(); }}
                    />
                  </div>

                  {error && <div className="error-msg">{error}</div>}

                  <button type="submit" className="primary-btn" disabled={isLoading}>
                    {isLoading ? "Sending OTP…" : "Send OTP →"}
                  </button>
                </form>

                <div className="footer" style={{ marginTop:18 }}>
                  Remembered it? <button className="link" onClick={goToLogin}>Sign in</button>
                </div>
              </>
            )}

            {/* ══════════════ VERIFY OTP ══════════════ */}
            {step === STEP.VERIFY_OTP && (
              <>
                <button className="back-btn" onClick={() => { setStep(STEP.FORGOT_EMAIL); clearErrors(); }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <h1 className="page-title">Enter<br />OTP</h1>
                <p className="page-subtitle">
                  We sent a 6-digit code to <strong style={{ color:"#60a5fa" }}>{forgotEmail}</strong>
                </p>

                {successMsg && <div className="success-msg">{successMsg}</div>}

                <form onSubmit={handleVerifyOtp}>
                  <p className="otp-label">Enter the 6-digit code below</p>
                  <div className="otp-grid" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        className={`otp-cell${digit ? " filled" : ""}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0}
                        style={{ padding: 0 }}
                      />
                    ))}
                  </div>

                  <div className="resend-row">
                    <button type="button" className="resend-btn" onClick={handleResendOtp} disabled={otpCooldown > 0 || isLoading}>
                      <RefreshCw size={13} /> Resend OTP
                    </button>
                    {otpCooldown > 0 && <span className="resend-timer">in {otpCooldown}s</span>}
                  </div>

                  {error && <div className="error-msg">{error}</div>}

                  <button type="submit" className="primary-btn" disabled={isLoading || otp.join("").length !== 6}>
                    {isLoading ? "Verifying…" : "Verify OTP →"}
                  </button>
                </form>
              </>
            )}

            {/* ══════════════ RESET PASSWORD ══════════════ */}
            {step === STEP.RESET_PASSWORD && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(34,211,238,.12)", border:"1.5px solid #22d3ee", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <KeyRound size={16} color="#22d3ee" />
                  </div>
                  <span style={{ color:"#22d3ee", fontSize:13, fontWeight:600 }}>OTP Verified Successfully</span>
                </div>

                <h1 className="page-title">New<br />Password</h1>
                <p className="page-subtitle">Choose a strong password for your account</p>

                <form onSubmit={handleResetPassword}>
                  <div className="input-group">
                    <Lock className="input-icon" size={17} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); clearErrors(); }}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {/* Strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="strength-row">
                      {[0,1,2].map((i) => {
                        const strength = newPassword.length >= 10 ? 3 : newPassword.length >= 6 ? 2 : 1;
                        const cls = strength > i ? (strength === 1 ? "weak" : strength === 2 ? "medium" : "strong") : "";
                        return <div key={i} className={`strength-seg ${cls}`} />;
                      })}
                    </div>
                  )}

                  <div className="input-group">
                    <Lock className="input-icon" size={17} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {error && <div className="error-msg">{error}</div>}

                  <button type="submit" className="primary-btn" disabled={isLoading}>
                    {isLoading ? "Updating Password…" : "Update Password →"}
                  </button>
                </form>
              </>
            )}

            {/* ══════════════ SUCCESS ══════════════ */}
            {step === STEP.SUCCESS && (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div className="success-icon">
                  <ShieldCheck size={34} color="#22d3ee" />
                </div>
                <h1 className="page-title" style={{ fontSize:36, textAlign:"center" }}>Password<br />Updated!</h1>
                <p style={{ color:"var(--muted)", fontSize:14, marginTop:12, lineHeight:1.6 }}>
                  Your password has been reset successfully.<br />Please log in with your new password.
                </p>
                <button className="primary-btn" style={{ marginTop:28 }} onClick={goToLogin}>
                  Back to Login →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default Login;