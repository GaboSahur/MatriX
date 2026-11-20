import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../lib/api.js";
import { useSesion } from "../context/SesionContext.jsx";

export default function Ingresar() {
  const { iniciar } = useSesion();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const r = await fetch(`${API_URL}/api/ingresar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error || "No se pudo iniciar sesión.");
      iniciar(datos);
      navigate("/");
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
          <span className="eyebrow">Cuenta de jugador</span>
          <h2>Iniciá sesión</h2>
          <p>Para que tus puntajes cuenten en el ranking.</p>
        </div>
        <div className="form-card" style={{ maxWidth: 480, margin: "0 auto" }}>
          {error && <div className="alert alert-error show visible" role="alert">{error}</div>}
          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="usuario">Nombre de usuario</label>
              <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="clave">Contraseña</label>
              <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
              {enviando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
          <p style={{ marginTop: 18, textAlign: "center", fontSize: "0.9rem" }}>
            ¿Todavía no tenés cuenta? <Link to="/registro" style={{ color: "var(--accent)", fontWeight: 600 }}>Registrate</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
