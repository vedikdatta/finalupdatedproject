import { Link } from "react-router-dom";

function Home() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/logo.jpeg"
            alt="FactoryPULSE AI Logo"
            style={styles.logoImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/40x40?text=🏭";
            }}
          />
          <h2 style={styles.logo}>
            FactoryPULSE AI
          </h2>
        </div>

        <div style={styles.navLinks}>
          <Link to="/about" style={styles.link}>About</Link>
          <Link to="/contact" style={styles.link}>Contact</Link>
          
          {isLoggedIn ? (
            <>
              <span style={styles.userName}>👋 {userData.name?.split(' ')[0] || 'User'}</span>
              <Link to="/dashboard" style={styles.dashboardBtn}>
                Dashboard
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem("isLoggedIn");
                  localStorage.removeItem("currentUser");
                  window.location.href = "/";
                }} 
                style={styles.logoutBtn}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.loginBtn}>
                Login
              </Link>
              <Link to="/register" style={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          AI-Powered Manufacturing Analytics Platform
        </h1>
        <p style={styles.heroText}>
          Smart factory monitoring, predictive maintenance,
          production optimization, machine intelligence,
          and AI-driven operational insights.
        </p>
        
        {isLoggedIn ? (
          <Link to="/dashboard">
            <button style={styles.heroButton}>
              Go to Dashboard →
            </button>
          </Link>
        ) : (
          <Link to="/login">
            <button style={styles.heroButton}>
              Login to Dashboard
            </button>
          </Link>
        )}
      </section>

      {/* STATS SECTION */}
      <section style={styles.statsSection}>
        <div style={styles.statCard}>
          <h1 style={styles.statNumber}>500+</h1>
          <p style={styles.statText}>Machines Connected</p>
        </div>
        <div style={styles.statCard}>
          <h1 style={styles.statNumber}>95%</h1>
          <p style={styles.statText}>Efficiency Rate</p>
        </div>
        <div style={styles.statCard}>
          <h1 style={styles.statNumber}>24/7</h1>
          <p style={styles.statText}>AI Monitoring</p>
        </div>
        <div style={styles.statCard}>
          <h1 style={styles.statNumber}>100+</h1>
          <p style={styles.statText}>Factories Supported</p>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" style={styles.section}>
        <h2 style={styles.sectionTitle}>About FactoryPULSE AI</h2>
        <p style={styles.sectionText}>
          FactoryPULSE AI helps industries monitor machines,
          analyze production data, reduce downtime,
          optimize energy usage, and improve operational efficiency.
          Our platform leverages cutting-edge artificial intelligence
          to provide real-time insights and predictive analytics.
        </p>
      </section>

      {/* FEATURES SECTION */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Key Features</h2>
        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>⚠️</div>
            <h3 style={styles.cardTitle}>Predictive Alerts</h3>
            <p style={styles.cardText}>
              AI predicts machine failure risks
              and sends alerts instantly to prevent downtime.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>📈</div>
            <h3 style={styles.cardTitle}>Production Forecasting</h3>
            <p style={styles.cardText}>
              Forecast production trends using
              intelligent AI models and historical data.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>🔧</div>
            <h3 style={styles.cardTitle}>Maintenance Scheduling</h3>
            <p style={styles.cardText}>
              Optimize maintenance schedules based on
              machine usage and performance metrics.
            </p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardIcon}>📊</div>
            <h3 style={styles.cardTitle}>Real-time Analytics</h3>
            <p style={styles.cardText}>
              Monitor production metrics and KPIs
              in real-time with interactive dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Transform Your Factory?</h2>
        <p style={styles.ctaText}>
          Join hundreds of manufacturers already using FactoryPULSE AI
        </p>
        {!isLoggedIn && (
          <Link to="/register">
            <button style={styles.ctaButton}>Get Started Free →</button>
          </Link>
        )}
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>FactoryPULSE AI</h3>
            <p style={styles.footerText}>Smart Manufacturing Platform</p>
          </div>
          <div style={styles.footerSection}>
            <h4>Quick Links</h4>
            <Link to="/about" style={styles.footerLink}>About Us</Link>
            <Link to="/contact" style={styles.footerLink}>Contact</Link>
            <Link to="/login" style={styles.footerLink}>Login</Link>
          </div>
          <div style={styles.footerSection}>
            <h4>Contact</h4>
            <p>📧 roupyadeepghosal@gmail.com</p>
            <p>📧 souravdas5670@gmail.com</p>
            <p>📧 vedikadatta1611@gmail.com</p>
            <p>📧 sahasayantika51@gmail.com</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          © 2026 FactoryPULSE AI | Smart Manufacturing Platform | All Rights Reserved
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)",
    color: "white",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 60px",
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    flexWrap: "wrap",
    gap: "20px",
  },

  logoImage: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    objectFit: "cover",
  },

  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #60a5fa, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  navLinks: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  link: {
    color: "#e2e8f0",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "500",
    transition: "color 0.3s",
  },

  loginBtn: {
    padding: "8px 20px",
    background: "transparent",
    border: "1px solid #3b82f6",
    color: "#60a5fa",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s",
  },

  registerBtn: {
    padding: "8px 20px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    transition: "transform 0.3s",
  },

  dashboardBtn: {
    padding: "8px 20px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },

  logoutBtn: {
    padding: "8px 20px",
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid #ef4444",
    color: "#fca5a5",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s",
  },

  userName: {
    color: "#60a5fa",
    fontSize: "14px",
    fontWeight: "500",
  },

  hero: {
    minHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
    position: "relative",
  },

  heroTitle: {
    fontSize: "clamp(32px, 5vw, 65px)",
    maxWidth: "1000px",
    marginBottom: "20px",
    fontWeight: "bold",
    lineHeight: "1.2",
  },

  heroText: {
    fontSize: "clamp(16px, 2vw, 22px)",
    maxWidth: "750px",
    color: "#cbd5e1",
    lineHeight: "1.6",
  },

  heroButton: {
    marginTop: "30px",
    padding: "14px 32px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "transform 0.3s, box-shadow 0.3s",
  },

  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "25px",
    padding: "60px 40px",
    maxWidth: "1200px",
    margin: "auto",
  },

  statCard: {
    background: "rgba(255,255,255,0.05)",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "transform 0.3s",
  },

  statNumber: {
    fontSize: "48px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #60a5fa, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "10px",
  },

  statText: {
    color: "#94a3b8",
    fontSize: "16px",
  },

  section: {
    padding: "70px 40px",
    textAlign: "center",
    maxWidth: "1200px",
    margin: "auto",
  },

  sectionTitle: {
    fontSize: "clamp(28px, 4vw, 40px)",
    marginBottom: "20px",
    fontWeight: "bold",
  },

  sectionText: {
    fontSize: "18px",
    color: "#cbd5e1",
    maxWidth: "800px",
    margin: "auto",
    lineHeight: "1.8",
  },

  featuresSection: {
    padding: "70px 40px",
    background: "rgba(255,255,255,0.02)",
  },

  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
    maxWidth: "1200px",
    margin: "40px auto 0",
  },

  card: {
    background: "#1e293b",
    padding: "30px",
    borderRadius: "16px",
    textAlign: "center",
    transition: "transform 0.3s",
    border: "1px solid rgba(255,255,255,0.1)",
  },

  cardIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },

  cardTitle: {
    fontSize: "20px",
    marginBottom: "12px",
    color: "#60a5fa",
  },

  cardText: {
    color: "#94a3b8",
    lineHeight: "1.6",
  },

  ctaSection: {
    padding: "80px 40px",
    textAlign: "center",
    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
  },

  ctaTitle: {
    fontSize: "clamp(28px, 4vw, 42px)",
    marginBottom: "15px",
  },

  ctaText: {
    fontSize: "18px",
    color: "#cbd5e1",
    marginBottom: "30px",
  },

  ctaButton: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  footer: {
    background: "#0f172a",
    color: "#94a3b8",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },

  footerContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "40px",
    padding: "50px 60px 30px",
    maxWidth: "1200px",
    margin: "auto",
  },

  footerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  footerTitle: {
    color: "white",
    marginBottom: "10px",
  },

  footerText: {
    fontSize: "14px",
  },

  footerLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "14px",
    transition: "color 0.3s",
  },

  footerBottom: {
    textAlign: "center",
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    fontSize: "13px",
  },
};

// Add hover styles via style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  a:hover {
    color: #60a5fa !important;
  }
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  }
  .statCard:hover, .card:hover {
    transform: translateY(-5px);
  }
`;
document.head.appendChild(styleSheet);

export default Home;