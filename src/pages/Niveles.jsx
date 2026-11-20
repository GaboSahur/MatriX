import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONTENT_LIBRARY } from "../lib/content-library.js";
import { API_URL, leerSesion, cabeceraAuth } from "../lib/api.js";

const OPERACIONES = ["suma", "resta", "multiplicacion", "division", "mixto"];

export default function Niveles() {
  const sesion = leerSesion();
  const [progreso, setProgreso] = useState(null);

  useEffect(() => {
    if (!sesion) return;
    fetch(`${API_URL}/api/progreso`, { headers: cabeceraAuth(sesion.token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setProgreso(d))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Invitados: solo práctica, sin niveles ni ranking
  if (!sesion) {
    return (
      <section>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Práctica</span>
            <h2>Elegí una operación para practicar</h2>
            <p>Practicá sin cuenta. Para avanzar por los 25 niveles y guardar tu puntaje en el ranking, <Link to="/ingresar" className="enlace">ingresá</Link> o <Link to="/registro" className="enlace">registrate</Link>.</p>
          </div>
          <div className="grid-3">
            {OPERACIONES.map((op) => (
              <div className="level-card" key={op}>
                <h3>{CONTENT_LIBRARY[op].titulo}</h3>
                <Link to={`/jugar?nivel=${op}`} className="btn btn-primary btn-block">Practicar</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Cuentas: progresión de 25 niveles
  return (
    <section>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Progresión</span>
          <h2>Tus 25 niveles</h2>
          {progreso && (
            <>
              <p>{progreso.completados} de {progreso.total} niveles completados.</p>
              <div className="progreso-barra" role="progressbar" aria-valuenow={progreso.completados} aria-valuemin={0} aria-valuemax={progreso.total}>
                <div className="progreso-relleno" style={{ width: `${(progreso.completados / progreso.total) * 100}%` }} />
              </div>
            </>
          )}
        </div>

        {!progreso && <p className="empty-state">Cargando niveles...</p>}

        {progreso && OPERACIONES.map((op) => (
          <div key={op} style={{ marginBottom: 32 }}>
            <h3>{CONTENT_LIBRARY[op].titulo}</h3>
            <div className="niveles-grilla">
              {progreso.niveles.filter((n) => n.operacion === op).map((n) => {
                const clases = `nivel-item ${n.completado ? "completado" : ""} ${n.desbloqueado ? "" : "bloqueado"}`;
                return n.desbloqueado ? (
                  <Link key={n.id} to={`/jugar?nivel=${n.id}`} className={clases}>
                    <span className="nivel-numero">{n.numero}</span>
                    <span className="nivel-estado">{n.completado ? "✓ Completado" : "Jugar"}</span>
                  </Link>
                ) : (
                  <div key={n.id} className={clases} aria-disabled="true">
                    <span className="nivel-numero">{n.numero}</span>
                    <span className="nivel-estado">🔒 Bloqueado</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
