import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import CuentaBar from "./components/CuentaBar.jsx";
import Inicio from "./pages/Inicio.jsx";
import Niveles from "./pages/Niveles.jsx";
import Ranking from "./pages/Ranking.jsx";
import Contacto from "./pages/Contacto.jsx";
import Ingresar from "./pages/Ingresar.jsx";
import Registro from "./pages/Registro.jsx";
import Perfil from "./pages/Perfil.jsx";
import Admin from "./pages/Admin.jsx";
import Pendiente from "./pages/Pendiente.jsx";

export default function App() {
  return (
    <Layout>
      <CuentaBar />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/niveles" element={<Niveles />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/ingresar" element={<Ingresar />} />
        <Route path="/registro" element={<Registro />} />
        {/* Se pasan en las próximas etapas */}
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil/:usuario" element={<Perfil />} />
        <Route path="/jugar" element={<Pendiente nombre="Juego" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Pendiente nombre="Página no encontrada" />} />
      </Routes>
    </Layout>
  );
}
