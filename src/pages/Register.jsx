import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    factoryName: "",
    role: "",
    contact: "",
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!user.name.trim()) newErrors.name = "Full name is required";
    if (!user.email.trim()) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(user.email)) newErrors.email = "Email is invalid";
    if (!user.password) newErrors.password = "Password is required";
    if (user.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (user.password !== user.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!user.factoryName.trim()) newErrors.factoryName = "Factory name is required";
    if (!user.role) newErrors.role = "Please select a role";
    if (!user.contact.trim()) newErrors.contact = "Contact number is required";
    if (!/^\d{10}$/.test(user.contact.replace(/\D/g, ''))) newErrors.contact = "Please enter a valid 10-digit phone number";
    
    return newErrors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: user.name,
        email: user.email,
        password: user.password,
        factoryName: user.factoryName,
        role: user.role,
        contact: user.contact,
      };

      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data && data.message ? data.message : "Registration failed";
        setErrors({ general: msg });
        setIsLoading(false);
        return;
      }

      alert("Registration Successful! Please login to continue.");
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrors({ general: "Server error. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field) => ({
    padding: "14px",
    borderRadius: "10px",
    border: errors[field] ? "1px solid #ef4444" : "1px solid #374151",
    background: "#111827",
    color: "white",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
  });

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <h1 style={styles.logo}>FactoryPULSE AI</h1>
        <h2 style={styles.heading}>AI Manufacturing Analytics</h2>
        <p style={styles.text}>
          Smart monitoring, predictive maintenance, machine analytics, 
          production insights, and intelligent factory management.
        </p>
        
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(96,165,250,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>📊</div>
            <div><strong>Real-time Analytics</strong><br /><span style={{ fontSize: "13px", color: "#94a3b8" }}>Live production monitoring</span></div>
          </div>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(96,165,250,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>🔧</div>
            <div><strong>Predictive Maintenance</strong><br /><span style={{ fontSize: "13px", color: "#94a3b8" }}>Prevent machine failures</span></div>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(96,165,250,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
            <div><strong>AI Assistant</strong><br /><span style={{ fontSize: "13px", color: "#94a3b8" }}>24/7 smart support</span></div>
          </div>
        </div>
      </div>

      <div style={styles.rightSection}>
        <form style={styles.form} onSubmit={handleRegister}>
          <h2 style={styles.formTitle}>Create Account</h2>
          <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: "20px", fontSize: "13px" }}>
            Join the future of factory management
          </p>

          <input
            type="text"
            placeholder="Full Name"
            style={inputStyle("name")}
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
          {errors.name && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.name}</span>}

          <input
            type="email"
            placeholder="Email Address"
            style={inputStyle("email")}
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
          {errors.email && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.email}</span>}

          <input
            type="password"
            placeholder="Password (min 6 characters)"
            style={inputStyle("password")}
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
          {errors.password && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.password}</span>}

          <input
            type="password"
            placeholder="Re-enter Password"
            style={inputStyle("confirmPassword")}
            value={user.confirmPassword}
            onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
          />
          {errors.confirmPassword && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.confirmPassword}</span>}

          <input
            type="text"
            placeholder="Factory Name"
            style={inputStyle("factoryName")}
            value={user.factoryName}
            onChange={(e) => setUser({ ...user, factoryName: e.target.value })}
          />
          {errors.factoryName && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.factoryName}</span>}

          <select
            style={inputStyle("role")}
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
          >
            <option value="">Select Role</option>
            <option>Factory Manager</option>
            <option>Supervisor</option>
            <option>Machine Operator</option>
            <option>Worker</option>
            <option>Quality Inspector</option>
            <option>Maintenance Engineer</option>
          </select>
          {errors.role && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.role}</span>}

          <input
            type="tel"
            placeholder="Contact Number (10 digits)"
            style={inputStyle("contact")}
            value={user.contact}
            onChange={(e) => setUser({ ...user, contact: e.target.value })}
          />
          {errors.contact && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "-10px" }}>{errors.contact}</span>}

          {errors.general && <div style={{ color: "#ef4444", fontSize: "13px", textAlign: "center" }}>{errors.general}</div>}

          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register →"}
          </button>

          <p style={styles.loginText}>
            Already have an account?
            <Link to="/" style={styles.link}>
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  leftSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    color: "white",
    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
    position: "relative",
    overflow: "hidden",
  },
  logo: {
    fontSize: "42px",
    color: "#60a5fa",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  heading: {
    fontSize: "32px",
    marginBottom: "20px",
  },
  text: {
    fontSize: "16px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    maxWidth: "500px",
  },
  rightSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  form: {
    width: "420px",
    background: "#1f2937",
    padding: "40px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
  },
  formTitle: {
    color: "white",
    textAlign: "center",
    marginBottom: "5px",
    fontSize: "28px",
  },
  button: {
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  loginText: {
    color: "#cbd5e1",
    textAlign: "center",
  },
  link: {
    color: "#60a5fa",
    marginLeft: "5px",
    textDecoration: "none",
  },
};

export default Register;