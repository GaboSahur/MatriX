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

// Foto (o inicial del nombre) + nombre de usuario, arriba a la derecha
function crearAvatar(foto, usuario) {
  if (foto) {
    const img = document.createElement("img");
    img.className = "cuenta-foto";
    img.alt = "";
    img.src = foto;
    return img;
  }
  const letra = document.createElement("span");
  letra.className = "cuenta-foto cuenta-foto-letra";
  letra.textContent = (usuario || "?").charAt(0).toUpperCase();
  return letra;
}

export async function pintarCuenta() {
  document.querySelectorAll(".cuenta-barra").forEach((el) => el.remove());

  const barra = document.createElement("div");
  barra.className = "cuenta-barra";

  const sesion = obtenerSesion();
  if (sesion) {
    const enlace = document.createElement("a");
    enlace.className = "cuenta-perfil";
    enlace.href = "perfil.html";
    const nombre = document.createElement("span");
    nombre.textContent = sesion.usuario;
    enlace.append(crearAvatar(sesion.foto, sesion.usuario), nombre);
    barra.append(enlace);
    document.body.append(barra);

    // Si todavía no tenemos la foto guardada, la pedimos una vez
    if (sesion.foto === undefined) {
      try {
        const respuesta = await fetch(`${API_URL}/api/perfil`, {
          headers: { Authorization: `Bearer ${sesion.token}` },
        });
        if (respuesta.ok) {
          const datos = await respuesta.json();
          guardarSesion({ ...sesion, foto: datos.foto || "" });
          enlace.replaceChild(crearAvatar(datos.foto, sesion.usuario), enlace.firstChild);
        }
      } catch {
        /* sin foto por ahora */
      }
    }
    return;
  }

  barra.innerHTML =
    '<a class="cuenta-boton" href="ingresar.html">Ingresar</a>' +
    '<a class="cuenta-boton cuenta-boton-primario" href="registro.html">Registrarse</a>';
  document.body.append(barra);
}

document.addEventListener("DOMContentLoaded", pintarCuenta);