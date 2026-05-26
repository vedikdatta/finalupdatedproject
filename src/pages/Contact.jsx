import { Link } from "react-router-dom";

function Contact() {
  return (
    <div style={styles.container}>

      <nav style={styles.navbar}>

        <h2 style={styles.logo}>FactoryPULSE AI</h2>

        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/about" style={styles.link}>About</Link>
          <Link to="/login" style={styles.loginBtn}>Login</Link>
        </div>

      </nav>

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Contact Us</h1>
        <p style={styles.heroText}>
          Get in touch with the team behind FactoryPULSE AI
        </p>
      </section>
      <section style={styles.section}>

        <div style={styles.card}>

          <h2 style={styles.title}>👤 Owner Details</h2>

          <p style={styles.text}><strong>Name:</strong> Your Name Here</p>
          <p style={styles.text}><strong>Role:</strong> Founder & Developer</p>

        </div>

        <div style={styles.card}>

          <h2 style={styles.title}>📞 Contact Information</h2>

          <p style={styles.text}>📧 Email: your@email.com</p>
          <p style={styles.text}>📱 Phone: +91 9876543210</p>
          <p style={styles.text}>📍 Location: India</p>

        </div>

        <div style={styles.card}>

          <h2 style={styles.title}>💡 About Support</h2>

          <p style={styles.text}>
            For any queries, technical support, or collaboration,
            feel free to reach out via email. We usually respond within 24 hours.
          </p>

        </div>

      </section>

      <footer style={styles.footer}>
        © 2026 FactoryPULSE AI | Contact Page
      </footer>

    </div>
  );
}

const styles = {

  container: {
    background:
      "linear-gradient(to bottom right, #0f172a, #312e81, #1e3a8a)",
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
  },

  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    background:
      "linear-gradient(to right, #60a5fa, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  navLinks: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },

  link: {
    color: "white",
    textDecoration: "none",
  },

  loginBtn: {
    padding: "8px 16px",
    background:
      "linear-gradient(to right, #3b82f6, #8b5cf6)",
    borderRadius: "8px",
    color: "white",
    textDecoration: "none",
  },

  hero: {
    textAlign: "center",
    padding: "60px 20px",
  },

  heroTitle: {
    fontSize: "50px",
    marginBottom: "10px",
  },

  heroText: {
    fontSize: "18px",
    color: "#dbeafe",
  },

  section: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "25px",
    padding: "40px",
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "30px",
    borderRadius: "15px",
  },

  title: {
    fontSize: "22px",
    marginBottom: "15px",
  },

  text: {
    color: "#dbeafe",
    marginBottom: "10px",
  },

  footer: {
    textAlign: "center",
    padding: "20px",
    background: "#111827",
    color: "#94a3b8",
  },
};

export default Contact;