import { useState } from "react";
import { API_URL } from "../lib/api.js";

const VACIO = { nombre: "", email: "", mensaje: "" };

function validar({ nombre, email, mensaje }) {
  if (nombre.trim().length < 2) return "Ingresá al menos 2 caracteres en el nombre.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Ingresá un correo válido.";
  if (mensaje.trim().length < 10) return "Escribí al menos 10 caracteres en el mensaje.";
  return "";
}

export default function Contacto() {
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setOk("");
    const problema = validar(datos);
    if (problema) return setError(problema);

    setEnviando(true);
    try {
      const r = await fetch(`${API_URL}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          mensaje: datos.mensaje.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      setDatos(VACIO);
      setOk("¡Mensaje enviado! Te respondemos a la brevedad.");
    } catch {
      setError("No se pudo enviar el mensaje. Probá de nuevo en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 28px", maxWidth: 560 }}>
          <span className="eyebrow">Contacto</span>
          <h2>¿Dudas, ideas o encontraste un error?</h2>
          <p>Escribinos y te respondemos a la brevedad.</p>
        </div>
        <div className="form-card" style={{ maxWidth: 560, margin: "0 auto" }}>
          {error && <div className="alert alert-error show visible" role="alert">{error}</div>}
          {ok && <div className="alert alert-success show visible" role="status">{ok}</div>}
          <form onSubmit={enviar} noValidate>
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={datos.nombre} onChange={cambiar("nombre")} placeholder="¿Cómo te llamás?" />
            </div>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" type="email" value={datos.email} onChange={cambiar("email")} placeholder="tu@correo.com" />
            </div>
            <div className="field">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" value={datos.mensaje} onChange={cambiar("mensaje")} placeholder="Contanos qué necesitás..." />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
