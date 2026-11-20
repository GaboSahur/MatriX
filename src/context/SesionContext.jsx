import { createContext, useContext, useEffect, useState } from "react";
import { API_URL, leerSesion, guardarSesion, borrarSesion, cabeceraAuth } from "../lib/api.js";

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion());

  // Si la sesión no tiene foto guardada, la pedimos una vez
  useEffect(() => {
    if (!sesion || sesion.foto !== undefined) return;
    fetch(`${API_URL}/api/perfil`, { headers: cabeceraAuth(sesion.token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => {
        if (!datos) return;
        const nueva = { ...sesion, foto: datos.foto || "" };
        guardarSesion(nueva);
        setSesion(nueva);
      })
      .catch(() => {});
  }, [sesion]);

  function iniciar(datos) {
    guardarSesion(datos);
    setSesion(datos);
  }

  function cerrar() {
    borrarSesion();
    setSesion(null);
  }

  return (
    <SesionContext.Provider value={{ sesion, iniciar, cerrar }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  return useContext(SesionContext);
}
