// Dirección del servidor en Render y manejo de la sesión de jugador
export const API_URL = "https://matrix-fvd7.onrender.com";
const CLAVE_SESION = "numerax_sesion"; // misma clave que el sitio actual

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");
  } catch {
    return null;
  }
}

export function guardarSesion(datos) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

export function cabeceraAuth(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
