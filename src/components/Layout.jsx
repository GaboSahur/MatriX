import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Tutor from "./Tutor.jsx";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/niveles", label: "Niveles" },
  { to: "/ranking", label: "Ranking" },
  { to: "/contacto", label: "Contacto" },
  { to: "/admin", label: "Admin" },
];

const PAGINAS_CON_TUTOR = ["/", "/niveles", "/jugar"];

const CLAVE_UI = "numerax_ui";

function leerPrefsUI() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_UI) || "{}");
  } catch {
    return {};
  }
}

function guardarPrefsUI(cambios) {
  localStorage.setItem(CLAVE_UI, JSON.stringify({ ...leerPrefsUI(), ...cambios }));
}

export default function Layout({ children }) {
  const [abierto, setAbierto] = useState(false);
  const [oscuro, setOscuro] = useState(() => leerPrefsUI().tema === "oscuro");
  const [compacto, setCompacto] = useState(() => leerPrefsUI().menuCompacto === true);

  // Aplica el modo y el tamaño del menú a toda la página
  useEffect(() => {
    document.documentElement.dataset.tema = oscuro ? "oscuro" : "claro";
    guardarPrefsUI({ tema: oscuro ? "oscuro" : "claro" });
  }, [oscuro]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-compacto", compacto);
    guardarPrefsUI({ menuCompacto: compacto });
  }, [compacto]);
  const { pathname } = useLocation();

  // Con el menú abierto en celular, la página de atrás no se desplaza
  useEffect(() => {
    document.body.classList.toggle("menu-abierto", abierto);
    return () => document.body.classList.remove("menu-abierto");
  }, [abierto]);

  return (
    <>
      <header className="site-header">
        <div className="container nav">
          <NavLink to="/" className="brand" onClick={() => setAbierto(false)}>
            <h1 className="brand-name">MatriX</h1>
            <span className="brand-tag">Práctica de matemática</span>
          </NavLink>
          <button
            className="nav-toggle"
            aria-expanded={abierto}
            aria-controls="menu-principal"
            onClick={() => setAbierto((v) => !v)}
          >
            ☰ Menú
          </button>
          <ul className={`nav-links ${abierto ? "open" : ""}`} id="menu-principal">
            <li className="menu-cerrar-item">
              <button type="button" className="menu-cerrar" onClick={() => setAbierto(false)}>✕ Cerrar menú</button>
            </li>
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.to === "/"} onClick={() => setAbierto(false)}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="ui-controles">
            <button type="button" className="ui-toggle boton-tema" onClick={() => setOscuro((v) => !v)}>
              <span aria-hidden="true">{oscuro ? "☀" : "☾"}</span>
              <span className="texto">{oscuro ? "Modo claro" : "Modo oscuro"}</span>
            </button>
            <button type="button" className="ui-toggle boton-menu" onClick={() => setCompacto((v) => !v)}>
              <span aria-hidden="true">{compacto ? "⇥" : "⇤"}</span>
              <span className="texto">{compacto ? "Agrandar menú" : "Achicar menú"}</span>
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {PAGINAS_CON_TUTOR.includes(pathname) && <Tutor />}

      <footer className="site-footer">
        <div className="container">
          <span>© {new Date().getFullYear()} MatriX</span>
          <span>Proyecto final · Ruta avanzada · Jóvenes creaTIvos</span>
        </div>
      </footer>
    </>
  );
}
