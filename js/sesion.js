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

// Muestra "Ingresar / Registrarse" o "Hola, usuario · Cerrar sesión" arriba a la derecha
export function pintarCuenta() {
  document.querySelectorAll(".cuenta-barra").forEach((el) => el.remove());

  const barra = document.createElement("div");
  barra.className = "cuenta-barra";

  const sesion = obtenerSesion();
  if (sesion) {
    const saludo = document.createElement("a");
    saludo.className = "cuenta-usuario";
    saludo.href = "perfil.html";
    saludo.textContent = `Hola, ${sesion.usuario}`;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "cuenta-boton";
    boton.textContent = "Cerrar sesión";
    boton.addEventListener("click", async () => {
      await cerrarSesion();
      window.location.href = "index.html";
    });
    barra.append(saludo, boton);
  } else {
    barra.innerHTML =
      '<a class="cuenta-boton" href="ingresar.html">Ingresar</a>' +
      '<a class="cuenta-boton cuenta-boton-primario" href="registro.html">Registrarse</a>';
  }
  document.body.append(barra);
}

document.addEventListener("DOMContentLoaded", pintarCuenta);