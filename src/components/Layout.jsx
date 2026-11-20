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

export default function Layout({ children }) {
  const [abierto, setAbierto] = useState(false);
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
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.to === "/"} onClick={() => setAbierto(false)}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
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
