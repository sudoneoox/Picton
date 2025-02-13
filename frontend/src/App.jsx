import { Routes, Route } from "react-router-dom";
import Layout from "./Layout.jsx";
import Pages from "./Pages/imports.jsx";
import "./styles/output.css";

function App() {
  return (
    <Routes>
      {/* The Layout wraps all pages it acts as a container for css styles*/}
      <Route path="/" element={<Layout />}>
        <Route index element={<Pages.Home />} />
        <Route path="login" element={<Pages.Login />} />
        <Route path="registration" element={<Pages.Registrations />} />
        <Route path="control-center" element={<Pages.ControlCenter />} />
      </Route>
    </Routes>
  );
}

export default App;
