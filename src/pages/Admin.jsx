import { useEffect, useState } from "react";
import { API_URL } from "../lib/api.js";

const CLAVE_ADMIN = "numerax_admin"; // misma clave que el sitio actual

function leerAdmin() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ADMIN) || "null");
  } catch {
    return null;
  }
}

function IngresoAdmin({ alIngresar }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/ingresar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo ingresar.");
      localStorage.setItem(CLAVE_ADMIN, JSON.stringify({ token: d.token, usuario: d.usuario }));
      alIngresar({ token: d.token, usuario: d.usuario });
    } catch (err) {
      setError(err.message.includes("fetch") ? "No hay conexión con el servidor." : err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 28px", maxWidth: 480 }}>
          <span className="eyebrow">Panel privado</span>
          <h2>Ingreso de administrador</h2>
          <p>Acceso exclusivo para gestionar el ranking y los mensajes de contacto.</p>
        </div>
        <div className="form-card" style={{ maxWidth: 480, margin: "0 auto" }}>
          {error && <div className="alert alert-error show visible" role="alert">{error}</div>}
          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="admin-usuario">Usuario</label>
              <input id="admin-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="admin-clave">Contraseña</label>
              <input id="admin-clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
              {enviando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function PanelAdmin({ sesion, alSalir }) {
  const [partidas, setPartidas] = useState(null);
  const [mensajes, setMensajes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const pedir = (ruta) =>
      fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${sesion.token}` } }).then((r) => {
        if (r.status === 401 || r.status === 403) {
          alSalir();
          throw new Error("sesion");
        }
        if (!r.ok) throw new Error("No se pudo cargar.");
        return r.json();
      });

    pedir("/api/admin/partidas").then(setPartidas).catch((e) => e.message !== "sesion" && setError(e.message));
    pedir("/api/admin/mensajes").then(setMensajes).catch((e) => e.message !== "sesion" && setError(e.message));
  }, [sesion, alSalir]);

  const fecha = (iso) => (iso ? new Date(iso).toLocaleString("es-UY") : "");

  return (
    <section>
      <div className="container">
        <div className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <span className="eyebrow">Panel privado</span>
            <h2 style={{ marginBottom: 0 }}>Partidas y mensajes</h2>
          </div>
          <button className="btn btn-secondary" onClick={alSalir}>Cerrar sesión</button>
        </div>

        {error && <div className="alert alert-error show visible" role="alert">{error}</div>}

        <h3>Últimas partidas</h3>
        {!partidas && <p className="empty-state">Cargando partidas...</p>}
        {partidas?.length === 0 && <p className="empty-state">Todavía no hay partidas.</p>}
        {partidas?.length > 0 && (
          <div className="tabla-scroll" style={{ marginBottom: 40 }}>
            <table className="ranking">
              <thead><tr><th>Jugador</th><th>Nivel</th><th>Puntaje</th><th>Correctas</th><th>Fecha</th></tr></thead>
              <tbody>
                {partidas.map((p, i) => (
                  <tr key={i}>
                    <td>{p.usuario || "Anónimo"}</td>
                    <td>{p.nivel}</td>
                    <td>{p.puntaje}</td>
                    <td>{p.correctas}</td>
                    <td>{fecha(p.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3>Mensajes de contacto</h3>
        {!mensajes && <p className="empty-state">Cargando mensajes...</p>}
        {mensajes?.length === 0 && <p className="empty-state">Todavía no llegaron mensajes.</p>}
        {mensajes?.length > 0 && (
          <div className="tabla-scroll">
            <table className="ranking">
              <thead><tr><th>Nombre</th><th>Correo</th><th>Mensaje</th><th>Fecha</th></tr></thead>
              <tbody>
                {mensajes.map((m, i) => (
                  <tr key={i}>
                    <td>{m.nombre}</td>
                    <td>{m.email}</td>
                    <td>{m.mensaje}</td>
                    <td>{fecha(m.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Admin() {
  const [sesion, setSesion] = useState(() => leerAdmin());

  function salir() {
    localStorage.removeItem(CLAVE_ADMIN);
    setSesion(null);
  }

  if (!sesion) return <IngresoAdmin alIngresar={setSesion} />;
  return <PanelAdmin sesion={sesion} alSalir={salir} />;
}
