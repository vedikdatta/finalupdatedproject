import { Link } from "react-router-dom";

function About() {
  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>

        <h2 style={styles.logo}>
          FactoryPULSE AI
        </h2>

        <div style={styles.navLinks}>

          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/login" style={styles.link}>Login</Link>
          <Link to="/register" style={styles.link}>Register</Link>

        </div>
      </nav>

  
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>About FactoryPULSE AI</h1>

        <p style={styles.heroText}>
          A next-generation AI-powered platform designed for smart factories,
          predictive maintenance, automation, and industrial intelligence.
        </p>
      </section>

      <section style={styles.section}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🎯 Our Mission</h2>
          <p style={styles.text}>
            Our mission is to empower industries with AI systems that analyze machine data,
            predict failures, reduce downtime, and improve efficiency.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Where It Is Used</h2>

        <div style={styles.grid}>

          <div style={styles.box}>
            <h3>🏭 Manufacturing Plants</h3>
            <p>Monitor production lines and factory performance.</p>
          </div>

          <div style={styles.box}>
            <h3>⚙ Industrial Automation</h3>
            <p>Optimize automated systems and reduce failures.</p>
          </div>

          <div style={styles.box}>
            <h3>⚡ Energy Monitoring</h3>
            <p>Track and reduce energy consumption.</p>
          </div>

        </div>
      </section>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Key Features</h2>

        <div style={styles.grid}>

          <div style={styles.box}>
            <h3>📊 Real-time Analytics</h3>
            <p>Live production monitoring dashboards.</p>
          </div>

          <div style={styles.box}>
            <h3>🔮 Predictive Maintenance</h3>
            <p>Detect machine failures before breakdown.</p>
          </div>

          <div style={styles.box}>
            <h3>🤖 AI Assistant</h3>
            <p>Smart chatbot for factory insights.</p>
          </div>

          <div style={styles.box}>
            <h3>📈 Forecasting</h3>
            <p>Predict future production trends.</p>
          </div>

        </div>
      </section>
      <section style={styles.section}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Our Goal</h2>
          <p style={styles.text}>
            Build fully intelligent factories where machines self-monitor,
            self-predict issues, and optimize production automatically.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Why Choose Us</h2>

        <div style={styles.grid}>

          <div style={styles.box}>
            <h3>⚡ Fast Insights</h3>
            <p>Real-time AI decision making.</p>
          </div>

          <div style={styles.box}>
            <h3>🧠 Smart AI</h3>
            <p>Advanced machine learning models.</p>
          </div>

          <div style={styles.box}>
            <h3>📡 Live Monitoring</h3>
            <p>24/7 factory tracking system.</p>
          </div>

        </div>
      </section>


      <footer style={styles.footer}>
        © 2026 FactoryPULSE AI | Intelligent Manufacturing Platform
      </footer>

    </div>
  );
}

const styles = {

  container: {
    background: "linear-gradient(to bottom right, #0f172a, #312e81, #1e3a8a)",
    color: "white",
    minHeight: "100vh",
    fontFamily: "Arial",
  },


  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 60px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#60a5fa",
  },

  navLinks: {
    display: "flex",
    gap: "20px",
  },

  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
  },


  hero: {
    textAlign: "center",
    padding: "80px 20px",
  },

  heroTitle: {
    fontSize: "50px",
    marginBottom: "20px",
  },

  heroText: {
    fontSize: "20px",
    color: "#dbeafe",
    maxWidth: "800px",
    margin: "auto",
    lineHeight: "1.6",
  },

 
  section: {
    padding: "60px 40px",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: "36px",
    marginBottom: "25px",
  },

  text: {
    fontSize: "18px",
    color: "#dbeafe",
    lineHeight: "1.7",
  },


  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "30px",
    borderRadius: "15px",
    maxWidth: "800px",
    margin: "auto",
    backdropFilter: "blur(10px)",
  },

 
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  box: {
    background: "rgba(255,255,255,0.08)",
    padding: "25px",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },

  /* FOOTER */
  footer: {
    textAlign: "center",
    padding: "20px",
    background: "#111827",
    color: "#94a3b8",
    marginTop: "40px",
  },
};

export default About;