// Manejo de sesión de jugadores (token guardado en este navegador)
export const API_URL = "https://matrix-fvd7.onrender.com";
const CLAVE_SESION = "numerax_sesion";

export function guardarSesion(datos) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
}

export function obtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");
  } catch {
    return null;
  }
}

export function obtenerToken() {
  return obtenerSesion()?.token || null;
}

export async function cerrarSesion() {
  const token = obtenerToken();
  if (token) {
    await fetch(`${API_URL}/api/salir`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem(CLAVE_SESION);
}

// Agrega al menú "Ingresar / Registrarse" o "Hola, usuario · Salir"
export function pintarCuenta() {
  const nav = document.querySelector(".nav-links");
  if (!nav) return;
  nav.querySelectorAll(".item-cuenta").forEach((el) => el.remove());

  const sesion = obtenerSesion();
  const elementos = [];

  if (sesion) {
    const saludo = document.createElement("li");
    saludo.className = "item-cuenta";
    saludo.innerHTML = `<span class="cuenta-usuario">Hola, ${sesion.usuario}</span>`;

    const salir = document.createElement("li");
    salir.className = "item-cuenta";
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "ui-toggle";
    boton.textContent = "Cerrar sesión";
    boton.addEventListener("click", async () => {
      await cerrarSesion();
      window.location.href = "index.html";
    });
    salir.append(boton);
    elementos.push(saludo, salir);
  } else {
    elementos.push(
      Object.assign(document.createElement("li"), {
        className: "item-cuenta",
        innerHTML: '<a href="ingresar.html">Ingresar</a>',
      }),
      Object.assign(document.createElement("li"), {
        className: "item-cuenta",
        innerHTML: '<a href="registro.html">Registrarse</a>',
      })
    );
  }
  nav.append(...elementos);
}

document.addEventListener("DOMContentLoaded", pintarCuenta);