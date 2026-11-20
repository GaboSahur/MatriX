import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { API_URL } from "../lib/api.js";

const PERIODOS = [
  { id: "diario", label: "Diario" },
  { id: "semanal", label: "Semanal" },
  { id: "mensual", label: "Mensual" },
  { id: "historico", label: "Histórico" },
];

const NIVELES = [
  { id: "general", label: "Todos los niveles" },
  { id: "suma", label: "Sumas" },
  { id: "resta", label: "Restas" },
  { id: "multiplicacion", label: "Multiplicación" },
  { id: "division", label: "División" },
  { id: "mixto", label: "Desafío mixto" },
];

const NOMBRE_NIVEL = Object.fromEntries(NIVELES.map((n) => [n.id, n.label]));

// Recuadro con la foto y el perfil del jugador, al pasar el mouse sobre el nombre
function NombreConPerfil({ nombre }) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const [datos, setDatos] = useState(null);
  const cache = useRef(new Map());
  const ref = useRef(null);

  async function cargar() {
    if (cache.current.has(nombre)) return setDatos(cache.current.get(nombre));
    try {
      const r = await fetch(`${API_URL}/api/jugadores/${encodeURIComponent(nombre)}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      cache.current.set(nombre, d);
      setDatos(d);
    } catch {
      setDatos({ error: true });
    }
  }

  function abrir() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPosicion({ top: r.bottom + 8, left: r.left });
    setAbierto(true);
    cargar();
  }

  return (
    <span
      className="nombre-perfil"
      ref={ref}
      onMouseEnter={abrir}
      onMouseLeave={() => setAbierto(false)}
      onFocus={abrir}
      onBlur={() => setAbierto(false)}
    >
      <Link to={`/perfil/${encodeURIComponent(nombre)}`} className="nombre-enlace">{nombre}</Link>
      {abierto &&
        createPortal(
          <span className="perfil-popover" role="tooltip" style={{ top: posicion.top, left: posicion.left }}>
            {!datos && <span>Cargando...</span>}
            {datos?.error && <span>No se pudo cargar el perfil.</span>}
            {datos && !datos.error && (
              <>
                {datos.foto ? (
                  <img src={datos.foto} alt="" className="popover-foto" />
                ) : (
                  <span className="popover-foto popover-letra">{nombre.charAt(0).toUpperCase()}</span>
                )}
                <strong>{datos.usuario}</strong>
                <span className="popover-desc">{datos.descripcion || "Sin descripción todavía."}</span>
                <span className="popover-stat">{datos.partidas?.length || 0} partidas registradas</span>
              </>
            )}
          </span>,
          document.body
        )}
    </span>
  );
}

export default function Ranking() {
  const [periodo, setPeriodo] = useState("diario");
  const [nivel, setNivel] = useState("general");
  const [partidas, setPartidas] = useState([]);
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    let cancelado = false;
    setEstado("cargando");
    fetch(`${API_URL}/api/ranking?periodo=${periodo}&nivel=${nivel}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((datos) => {
        if (cancelado) return;
        setPartidas(datos);
        setEstado("ok");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });
    return () => {
      cancelado = true;
    };
  }, [periodo, nivel]);

  return (
    <section>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 28px" }}>
          <span className="eyebrow">Ranking global</span>
          <h2>¿Quién va ganando?</h2>
          <p>Mejor puntaje de cada jugador, hasta 50 jugadores.</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)} aria-label="Nivel" className="campo-select">
            {NIVELES.map((n) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>

        <div className="tabs" role="tablist" style={{ justifyContent: "center" }}>
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={periodo === p.id}
              className={`tab-btn ${periodo === p.id ? "active" : ""}`}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {estado === "cargando" && <p className="empty-state">Cargando ranking...</p>}
          {estado === "error" && (
            <p className="empty-state">No se pudo cargar el ranking. El servidor puede estar despertando; probá en un momento.</p>
          )}
          {estado === "ok" && partidas.length === 0 && (
            <p className="empty-state">Todavía no hay partidas registradas en este período.</p>
          )}
          {estado === "ok" && partidas.length > 0 && (
            <div className="tabla-scroll">
              <table className="ranking">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jugador</th>
                    <th>Nivel</th>
                    <th>Puntaje</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {partidas.map((p, i) => (
                    <tr key={p.nombre + i}>
                      <td>{i + 1}</td>
                      <td><NombreConPerfil nombre={p.nombre || "Anónimo"} /></td>
                      <td>{NOMBRE_NIVEL[p.nivel] || p.nivel}</td>
                      <td>{p.puntaje}</td>
                      <td>{p.fecha ? new Date(p.fecha).toLocaleDateString("es-UY") : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
