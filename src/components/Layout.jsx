import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/niveles", label: "Niveles" },
  { to: "/ranking", label: "Ranking" },
  { to: "/contacto", label: "Contacto" },
  { to: "/admin", label: "Admin" },
];

export default function Layout({ children }) {
  const [abierto, setAbierto] = useState(false);

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

      <footer className="site-footer">
        <div className="container">
          <span>© {new Date().getFullYear()} MatriX</span>
          <span>Proyecto final · Ruta avanzada · Jóvenes creaTIvos</span>
        </div>
      </footer>
    </>
  );
}
