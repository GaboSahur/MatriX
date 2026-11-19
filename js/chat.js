// Widget del tutor con IA: botón flotante que abre una ventana de chat
import { API_URL, obtenerToken, obtenerSesion } from "./sesion.js";

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

function crearWidget() {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "tutor-flotante";
  boton.setAttribute("aria-label", "Abrir tutor");
  boton.textContent = "💬 Tutor";

  const panel = document.createElement("section");
  panel.className = "tutor-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <header class="tutor-cabecera">
      <strong>Tutor de matemática</strong>
      <button type="button" class="tutor-cerrar" aria-label="Cerrar">✕</button>
    </header>
    <div class="tutor-mensajes" aria-live="polite"></div>
    <form class="tutor-form">
      <input type="text" maxlength="300" placeholder="Preguntá algo de matemática" autocomplete="off" />
      <button type="submit" class="btn btn-primary">Enviar</button>
    </form>`;

  document.body.append(boton, panel);

  const mensajes = panel.querySelector(".tutor-mensajes");
  const form = panel.querySelector(".tutor-form");
  const input = form.querySelector("input");

  function agregar(texto, tipo) {
    const burbuja = document.createElement("p");
    burbuja.className = `tutor-burbuja ${tipo}`;
    burbuja.textContent = texto;
    mensajes.append(burbuja);
    mensajes.scrollTop = mensajes.scrollHeight;
    return burbuja;
  }

  function mostrarEstadoSesion() {
    mensajes.innerHTML = "";
    if (obtenerSesion()) {
      agregar("¡Hola! Preguntame lo que no entiendas. Te doy pistas para que llegues vos a la respuesta.", "bot");
      form.hidden = false;
    } else {
      agregar("Para usar el tutor tenés que iniciar sesión.", "bot");
      form.hidden = true;
    }
  }

  boton.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      mostrarEstadoSesion();
      input.focus();
    }
  });
  panel.querySelector(".tutor-cerrar").addEventListener("click", () => (panel.hidden = true));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pregunta = input.value.trim();
    if (!pregunta) return;
    input.value = "";
    agregar(pregunta, "usuario");
    const pensando = agregar("Pensando...", "bot");

    try {
      const respuesta = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obtenerToken()}`,
        },
        body: JSON.stringify({ pregunta }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || "No pude responder.");
      pensando.textContent = limpiarTexto(datos.respuesta);
    } catch (error) {
      pensando.textContent = error.message.includes("fetch")
        ? "No hay conexión con el tutor. Probá de nuevo en un momento."
        : error.message;
    }
  });
}

document.addEventListener("DOMContentLoaded", crearWidget);