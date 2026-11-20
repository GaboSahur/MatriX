import { useState } from "react";
import { API_URL, leerSesion } from "../lib/api.js";

// Quita el LaTeX que devuelve el modelo para que se lea como texto normal
function limpiarTexto(texto) {
  return texto
    .replace(/\$\$?([^$]+)\$\$?/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·")
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\\/g, "");
}

export default function Tutor() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const sesion = leerSesion();

  async function enviar(e) {
    e.preventDefault();
    const pregunta = texto.trim();
    if (!pregunta || pensando) return;
    setTexto("");
    setMensajes((m) => [...m, { tipo: "usuario", texto: pregunta }]);
    setPensando(true);
    try {
      const r = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sesion?.token}` },
        body: JSON.stringify({ pregunta }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No pude responder.");
      setMensajes((m) => [...m, { tipo: "bot", texto: limpiarTexto(d.respuesta) }]);
    } catch (err) {
      const msg = err.message.includes("fetch") ? "No hay conexión con el tutor. Probá de nuevo." : err.message;
      setMensajes((m) => [...m, { tipo: "bot", texto: msg }]);
    } finally {
      setPensando(false);
    }
  }

  return (
    <>
      <button type="button" className="tutor-flotante" aria-label="Abrir tutor" onClick={() => setAbierto((v) => !v)}>
        💬 Tutor
      </button>

      {abierto && (
        <section className="tutor-panel">
          <header className="tutor-cabecera">
            <strong>Tutor de matemática</strong>
            <button type="button" className="tutor-cerrar" aria-label="Cerrar" onClick={() => setAbierto(false)}>✕</button>
          </header>

          <div className="tutor-mensajes" aria-live="polite">
            {!sesion && <p className="tutor-burbuja bot">Para usar el tutor tenés que iniciar sesión.</p>}
            {sesion && mensajes.length === 0 && (
              <p className="tutor-burbuja bot">¡Hola! Preguntame lo que no entiendas. Te doy pistas para que llegues vos a la respuesta.</p>
            )}
            {mensajes.map((m, i) => (
              <p key={i} className={`tutor-burbuja ${m.tipo}`}>{m.texto}</p>
            ))}
            {pensando && <p className="tutor-burbuja bot">Pensando...</p>}
          </div>

          {sesion && (
            <form className="tutor-form" onSubmit={enviar}>
              <input
                type="text"
                maxLength={300}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Preguntá algo de matemática"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary" disabled={pensando}>Enviar</button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
