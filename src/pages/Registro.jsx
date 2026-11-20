import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../lib/api.js";
import { useSesion } from "../context/SesionContext.jsx";

const REGEX_USUARIO = /^[a-zA-Z0-9_]{3,20}$/;

export default function Registro() {
  const { iniciar } = useSesion();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (!REGEX_USUARIO.test(usuario.trim())) {
      return setError("El usuario debe tener entre 3 y 20 letras, números o guion bajo.");
    }
    if (clave.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");

    setEnviando(true);
    try {
      const r = await fetch(`${API_URL}/api/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error || "No se pudo crear la cuenta.");
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
          <h2>Creá tu cuenta</h2>
          <p>Tu mejor puntaje va a aparecer con tu nombre en el ranking.</p>
        </div>
        <div className="form-card" style={{ maxWidth: 480, margin: "0 auto" }}>
          {error && <div className="alert alert-error show visible" role="alert">{error}</div>}
          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="usuario">Nombre de usuario</label>
              <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ej: gabi_mate" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="clave">Contraseña</label>
              <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
              {enviando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
          <p style={{ marginTop: 18, textAlign: "center", fontSize: "0.9rem" }}>
            ¿Ya tenés cuenta? <Link to="/ingresar" style={{ color: "var(--accent)", fontWeight: 600 }}>Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
