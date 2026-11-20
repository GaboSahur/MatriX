import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Niveles from "./pages/Niveles.jsx";
import Ranking from "./pages/Ranking.jsx";
import Contacto from "./pages/Contacto.jsx";
import Pendiente from "./pages/Pendiente.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/niveles" element={<Niveles />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/contacto" element={<Contacto />} />
        {/* Se pasan en las próximas etapas */}
        <Route path="/jugar" element={<Pendiente nombre="Juego" />} />
        <Route path="/perfil" element={<Pendiente nombre="Perfil" />} />
        <Route path="/ingresar" element={<Pendiente nombre="Ingresar" />} />
        <Route path="/registro" element={<Pendiente nombre="Registro" />} />
        <Route path="/admin" element={<Pendiente nombre="Admin" />} />
        <Route path="*" element={<Pendiente nombre="Página no encontrada" />} />
      </Routes>
    </Layout>
  );
}
