import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machine";
import Prediction from "./pages/Prediction"; // Add this import
import Report from "./pages/Report";
import SettingsPage from "./pages/SettingsPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Protected Routes - Require Login */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Machine Route */}
      <Route 
        path="/machines" 
        element={
          <ProtectedRoute>
            <Machines />
          </ProtectedRoute>
        } 
      />

      {/* Protected Predictions Route */}
      <Route 
        path="/predictions" 
        element={
          <ProtectedRoute>
            <Prediction />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Reports Route */}
      <Route 
        path="/Report" 
        element={
          <ProtectedRoute>
            <Report/>
          </ProtectedRoute>
        } 
      />
      {/* Protected Settings Route */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;