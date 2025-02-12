import "./styles/output.css";
import { Routes, Route, Link } from "react-router-dom";
import Pages from "./Pages/imports.jsx";

function App() {
  return (
    <div className="p-4">
      <nav className="flex space-x-4">
        <Link to="/" className="text-blue-500">
          Home
        </Link>
        <Link to="/registration" className="text-blue-500">
          Register
        </Link>
        <Link to="/login" className="text-blue-500">
          Login
        </Link>
      </nav>
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
