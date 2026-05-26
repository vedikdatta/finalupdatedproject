import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Bell,
  Palette,
  Bot,
  Shield,
  Moon,
  Sun,
  Monitor,
  Save,
  Lock,
  Globe,
  Volume2,
  VolumeX,
  Mail,
  Phone,
  Building,
  BadgeCheck,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Form states
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john.doe@factorypulse.com",
    company: "FactoryPulse AI Inc.",
    role: "Admin",
    phone: "+1 (555) 123-4567",
    language: "English"
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    machineFailures: true,
    energyAlerts: false,
    maintenanceReminders: true,
    weeklyReports: true,
    soundAlerts: true
  });

  const [aiPreferences, setAiPreferences] = useState({
    predictionSensitivity: 75,
    autoAnomaly: true,
    realTimeRecommendations: true,
    predictiveMaintenance: true,
    qualityPrediction: false
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User, color: "#6366f1" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "#f59e0b" },
    { id: "appearance", label: "Appearance", icon: Palette, color: "#8b5cf6" },
    { id: "ai", label: "AI Preferences", icon: Bot, color: "#06b6d4" },
    { id: "security", label: "Security", icon: Shield, color: "#ef4444" }
  ];

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: darkMode 
        ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" 
        : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Floating Save Notification */}
      {saved && (
        <div style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          background: "#10b981",
          color: "white",
          padding: "12px 24px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 1000,
          animation: "slideIn 0.3s ease",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)"
        }}>
          <Save size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .settings-card {
          animation: fadeIn 0.4s ease-out;
        }
        
        .section-link {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .section-link:hover {
          transform: translateX(4px);
        }
        
        input, select, textarea {
          transition: all 0.2s ease;
        }
        
        input:focus, select:focus {
          transform: scale(1.01);
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside style={{
          width: 280,
          background: darkMode 
            ? "rgba(15, 23, 42, 0.95)" 
            : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRight: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
          padding: "32px 20px",
          position: "fixed",
          height: "100vh",
          overflowY: "auto",
          zIndex: 10
        }}>
          {/* Logo */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12,
            marginBottom: 40,
            paddingBottom: 20,
            borderBottom: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`
          }}>
            <div style={{
              width: 45,
              height: 45,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22
            }}>🏭</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: darkMode ? "#fff" : "#0f172a" }}>FactoryPulse AI</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Settings & Preferences</div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="section-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: isActive 
                      ? `linear-gradient(90deg, ${section.color}20, transparent)` 
                      : "transparent",
                    border: isActive 
                      ? `1px solid ${section.color}40` 
                      : `1px solid transparent`,
                    color: isActive ? section.color : darkMode ? "#94a3b8" : "#64748b",
                    cursor: "pointer",
                    width: "100%",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 0.3s ease"
                  }}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                  {isActive && (
                    <div style={{ 
                      marginLeft: "auto", 
                      width: 4, 
                      height: 4, 
                      borderRadius: "50%", 
                      background: section.color 
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Back to Dashboard */}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              marginTop: 40,
              padding: "12px 16px",
              background: darkMode ? "#1e293b" : "#f1f5f9",
              border: "none",
              borderRadius: 12,
              color: darkMode ? "#fff" : "#0f172a",
              cursor: "pointer",
              width: "100%",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 0.3s ease"
            }}
          >
            ← Back to Dashboard
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          marginLeft: 280,
          padding: "40px 48px",
          overflowY: "auto"
        }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ 
              fontSize: 36, 
              fontWeight: 800, 
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8
            }}>
              Settings
            </h1>
            <p style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: 15 }}>
              Manage your dashboard preferences and factory configurations
            </p>
          </div>

          {/* Profile Settings */}
          {activeSection === "profile" && (
            <div className="settings-card" style={{
              background: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: 24,
              border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
              padding: "32px",
              marginBottom: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
                }}>
                  <User size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? "#fff" : "#0f172a" }}>Profile Settings</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Update your personal information</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Company Name</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Role</label>
                  <select
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  >
                    <option>Admin</option>
                    <option>Operator</option>
                    <option>Manager</option>
                    <option>Viewer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Chinese</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSave}
                style={{
                  marginTop: 28,
                  padding: "12px 28px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <Save size={16} /> Save Profile
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="settings-card" style={{
              background: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: 24,
              border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
              padding: "32px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Bell size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? "#fff" : "#0f172a" }}>Notification Settings</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Configure how you receive alerts</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: darkMode ? "#1e293b" : "#f8fafc",
                    borderRadius: 16,
                    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: darkMode ? "#fff" : "#0f172a", marginBottom: 4 }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Receive notifications about {key.toLowerCase().replace(/([A-Z])/g, ' $1')}
                      </div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: 50, height: 26 }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => setNotifications({ ...notifications, [key]: !value })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: value ? "#6366f1" : "#475569",
                        borderRadius: 26,
                        transition: "0.3s"
                      }}>
                        <span style={{
                          position: "absolute",
                          content: "",
                          height: 20,
                          width: 20,
          left: value ? 26 : 4,
                          bottom: 3,
                          background: "white",
                          borderRadius: "50%",
                          transition: "0.3s"
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <button onClick={handleSave} style={{
                marginTop: 28,
                padding: "12px 28px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer"
              }}>
                Save Preferences
              </button>
            </div>
          )}

          {/* Appearance */}
          {activeSection === "appearance" && (
            <div className="settings-card" style={{
              background: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: 24,
              border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
              padding: "32px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Palette size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? "#fff" : "#0f172a" }}>Appearance</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Customize your dashboard theme</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {[
                  { name: "Light Mode", icon: Sun, color: "#f59e0b", bg: "#ffffff" },
                  { name: "Dark Mode", icon: Moon, color: "#6366f1", bg: "#0f172a" },
                  { name: "System", icon: Monitor, color: "#10b981", bg: "#f8fafc" }
                ].map((mode) => (
                  <button
                    key={mode.name}
                    onClick={() => setDarkMode(mode.name === "Dark Mode")}
                    style={{
                      padding: "24px",
                      background: darkMode && mode.name === "Dark Mode" 
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)" 
                        : !darkMode && mode.name === "Light Mode"
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : darkMode ? "#1e293b" : "#f8fafc",
                      border: `2px solid ${
                        (darkMode && mode.name === "Dark Mode") || (!darkMode && mode.name === "Light Mode")
                          ? "#6366f1"
                          : darkMode ? "#334155" : "#e2e8f0"
                      }`,
                      borderRadius: 16,
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <mode.icon size={32} color={mode.color} style={{ marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, color: darkMode ? "#fff" : "#0f172a", marginBottom: 4 }}>{mode.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Modern {mode.name.toLowerCase()} theme</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Preferences */}
          {activeSection === "ai" && (
            <div className="settings-card" style={{
              background: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: 24,
              border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
              padding: "32px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #06b6d4, #22d3ee)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Bot size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? "#fff" : "#0f172a" }}>AI Preferences</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Configure AI behavior and predictions</p>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: "#64748b", marginBottom: 8, display: "block" }}>
                  Prediction Sensitivity: {aiPreferences.predictionSensitivity}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={aiPreferences.predictionSensitivity}
                  onChange={(e) => setAiPreferences({ ...aiPreferences, predictionSensitivity: parseInt(e.target.value) })}
                  style={{ width: "100%", height: 6, borderRadius: 3 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(aiPreferences).filter(([key]) => key !== "predictionSensitivity").map(([key, value]) => (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: darkMode ? "#1e293b" : "#f8fafc",
                    borderRadius: 16
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: darkMode ? "#fff" : "#0f172a" }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: 50, height: 26 }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => setAiPreferences({ ...aiPreferences, [key]: !value })}
                        style={{ opacity: 0 }}
                      />
                      <span style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: value ? "#6366f1" : "#475569",
                        borderRadius: 26
                      }}>
                        <span style={{
                          position: "absolute",
                          height: 20,
                          width: 20,
                          left: value ? 26 : 4,
                          bottom: 3,
                          background: "white",
                          borderRadius: "50%"
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <button onClick={handleSave} style={{
                marginTop: 28,
                padding: "12px 28px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer"
              }}>
                Save AI Settings
              </button>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="settings-card" style={{
              background: darkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: 24,
              border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
              padding: "32px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Shield size={24} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? "#fff" : "#0f172a" }}>Security</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Manage your account security</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>Current Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: darkMode ? "#1e293b" : "#f8fafc",
                        border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                        borderRadius: 12,
                        color: darkMode ? "#fff" : "#0f172a",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#64748b", marginBottom: 6, display: "block" }}>New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={security.newPassword}
                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: darkMode ? "#1e293b" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 12,
                      color: darkMode ? "#fff" : "#0f172a",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: darkMode ? "#1e293b" : "#f8fafc",
                borderRadius: 16,
                marginBottom: 24
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: darkMode ? "#fff" : "#0f172a" }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Add an extra layer of security</div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 50, height: 26 }}>
                  <input
                    type="checkbox"
                    checked={security.twoFactorAuth}
                    onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                    style={{ opacity: 0 }}
                  />
                  <span style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: security.twoFactorAuth ? "#6366f1" : "#475569",
                    borderRadius: 26
                  }}>
                    <span style={{
                      position: "absolute",
                      height: 20,
                      width: 20,
                      left: security.twoFactorAuth ? 26 : 4,
                      bottom: 3,
                      background: "white",
                      borderRadius: "50%"
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    padding: "12px 24px",
                    background: darkMode ? "#1e293b" : "#f8fafc",
                    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                    borderRadius: 12,
                    color: darkMode ? "#fff" : "#0f172a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPassword ? "Hide" : "Show"} Password
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: "12px 28px",
                    background: "linear-gradient(135deg, #ef4444, #f97316)",
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Update Password
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}