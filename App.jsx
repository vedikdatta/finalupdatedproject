import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";   // ✅ ADD THIS
import About from "./pages/About";   // (if you created About page)
import Contact from "./pages/Contact";


function App() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/register" element={<Register />} />

      {/* ✅ ADD LOGIN ROUTE */}
      <Route path="/login" element={<Login />} />

      {/* OPTIONAL: About page */}
      <Route path="/about" element={<About />} />

      <Route path="/contact" element={<Contact />} />
      
    


    </Routes>
  );
}

export default App;
