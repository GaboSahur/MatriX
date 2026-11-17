/**
 * common.js
 * -----------------------------------------------------------
 * Lógica compartida por todas las páginas:
 *  - Inyecta el nombre de marca desde config.js
 *  - Controla el menú de navegación en mobile
 *  - Marca el link activo según la página actual
 *  - Escribe el año actual en el footer
 * -----------------------------------------------------------
 */
// Preferencias de interfaz (tema y ancho del menú), guardadas en este navegador
const CLAVE_UI = "numerax_ui";

function leerPreferenciasUI() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_UI) || "{}");
  } catch {
    return {};
  }
}

function guardarPreferenciasUI(cambios) {
  localStorage.setItem(CLAVE_UI, JSON.stringify({ ...leerPreferenciasUI(), ...cambios }));
}

function aplicarPreferenciasUI() {
  const prefs = leerPreferenciasUI();
  const html = document.documentElement;
  html.dataset.tema = prefs.tema || "claro";
  html.classList.toggle("menu-compacto", prefs.menuCompacto === true);
}

aplicarPreferenciasUI();

document.addEventListener("DOMContentLoaded", () => {
  aplicarMarca();
  crearControlesUI();
  marcarLinkActivo();
  activarMenuMobile();
  escribirAnioFooter();
});

function aplicarMarca() {
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = APP_CONFIG.BRAND_NAME;
  });
  document.querySelectorAll("[data-brand-tag]").forEach((el) => {
    el.textContent = APP_CONFIG.BRAND_TAG;
  });

  // Si la página definió un título base en data-title-suffix, lo combinamos
  const suffix = document.body.dataset.titleSuffix;
  if (suffix) {
    document.title = `${suffix} · ${APP_CONFIG.BRAND_NAME}`;
  }
}

function marcarLinkActivo() {
  const paginaActual = document.body.dataset.page;
  if (!paginaActual) return;

  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.dataset.page === paginaActual) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function activarMenuMobile() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const abierto = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(abierto));
  });
}

function escribirAnioFooter() {
  const el = document.querySelector("[data-current-year]");
  if (el) el.textContent = new Date().getFullYear();
}

function crearControlesUI() {
  const nav = document.querySelector(".site-header .container.nav");
  if (!nav || nav.querySelector(".ui-controles")) return;

  // Nombre corto para mostrar cuando el menú está compacto
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.dataset.corto = a.textContent.trim().charAt(0).toUpperCase();
  });

  const controles = document.createElement("div");
  controles.className = "ui-controles";

  const botonTema = document.createElement("button");
  botonTema.type = "button";
  botonTema.className = "ui-toggle boton-tema";
  botonTema.addEventListener("click", () => {
    const nuevo = document.documentElement.dataset.tema === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset.tema = nuevo;
    guardarPreferenciasUI({ tema: nuevo });
    pintarBotones();
  });

  const botonMenu = document.createElement("button");
  botonMenu.type = "button";
  botonMenu.className = "ui-toggle boton-menu";
  botonMenu.addEventListener("click", () => {
    const compacto = !document.documentElement.classList.contains("menu-compacto");
    document.documentElement.classList.toggle("menu-compacto", compacto);
    guardarPreferenciasUI({ menuCompacto: compacto });
    pintarBotones();
  });

  function pintarBotones() {
    const oscuro = document.documentElement.dataset.tema === "oscuro";
    const compacto = document.documentElement.classList.contains("menu-compacto");
    botonTema.innerHTML = `<span aria-hidden="true">${oscuro ? "☀" : "☾"}</span><span class="texto">${oscuro ? "Modo claro" : "Modo oscuro"}</span>`;
    botonMenu.innerHTML = `<span aria-hidden="true">${compacto ? "⇥" : "⇤"}</span><span class="texto">${compacto ? "Agrandar menú" : "Achicar menú"}</span>`;
    botonTema.title = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    botonMenu.title = compacto ? "Agrandar menú" : "Achicar menú";
  }

  controles.append(botonTema, botonMenu);
  nav.append(controles);
  pintarBotones();
}