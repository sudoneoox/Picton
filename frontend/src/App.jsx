import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar.jsx";
import Pages from "./Pages/imports.jsx";
import "./styles/output.css";

function App() {
  return (
    <div className="p-4">
      <Navbar />
      <Routes>
        <Route path="/" element={<Pages.Home />} />
        <Route path="/login" element={<Pages.Login />} />
        <Route path="/registration" element={<Pages.Registration />} />
        <Route path="/control-center" element={<Pages.ControlCenter />} />
      </Routes>
    </div>
  );
}

export default App;
