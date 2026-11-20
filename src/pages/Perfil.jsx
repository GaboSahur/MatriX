import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { API_URL, cabeceraAuth } from "../lib/api.js";
import { useSesion } from "../context/SesionContext.jsx";
import { CONTENT_LIBRARY } from "../lib/content-library.js";
import Calendario from "../components/Calendario.jsx";

const NOMBRE_NIVEL = (id) => CONTENT_LIBRARY[id]?.titulo || id;

// Achica la imagen a un cuadrado de 256 px en JPG chico
function achicarImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onerror = rechazar;
    lector.onload = () => {
      const img = new Image();
      img.onerror = rechazar;
      img.onload = () => {
        const lado = 256;
        const recorte = Math.min(img.width, img.height);
        const x = (img.width - recorte) / 2;
        const y = (img.height - recorte) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = lado;
        canvas.height = lado;
        canvas.getContext("2d").drawImage(img, x, y, recorte, recorte, 0, 0, lado, lado);
        resolver(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

function Partidas({ partidas }) {
  if (!partidas?.length) return <p className="empty-state">Todavía no hay partidas con esta cuenta.</p>;
  return (
    <div className="tabla-scroll">
      <table className="ranking">
        <thead><tr><th>Nivel</th><th>Puntaje</th><th>Fecha</th></tr></thead>
        <tbody>
          {partidas.map((p, i) => (
            <tr key={i}>
              <td>{NOMBRE_NIVEL(p.nivel)}</td>
              <td>{p.puntaje}</td>
              <td>{p.fecha ? new Date(p.fecha).toLocaleDateString("es-UY") : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Buscador() {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) {
      setResultados([]);
      setMensaje("");
      return;
    }
    const t = setTimeout(() => {
      fetch(`${API_URL}/api/usuarios?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((lista) => {
          setResultados(lista);
          setMensaje(lista.length ? "" : "No se encontraron jugadores.");
        })
        .catch(() => setMensaje("No se pudo buscar ahora."));
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);

  return (
    <div className="form-card" style={{ maxWidth: 520, margin: "0 auto 24px" }}>
      <label htmlFor="buscar" style={{ display: "block", marginBottom: 8, fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
        Buscar jugadores
      </label>
      <input id="buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí un nombre..." autoComplete="off" style={{ width: "100%" }} />
      {mensaje && <p style={{ color: "var(--ink-soft)", marginTop: 10 }}>{mensaje}</p>}
      {resultados.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
          {resultados.map((j) => (
            <li key={j.usuario}>
              <Link to={`/perfil/${encodeURIComponent(j.usuario)}`} style={{ display: "block", padding: "8px 4px", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>
                {j.usuario}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Perfil de otro jugador, solo lectura
function PerfilPublico({ usuario }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDatos(null);
    setError("");
    fetch(`${API_URL}/api/jugadores/${encodeURIComponent(usuario)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => (ok ? setDatos(d) : setError(d.error || "Jugador no encontrado.")))
      .catch(() => setError("No se pudo cargar el perfil."));
  }, [usuario]);

  return (
    <section>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 28px" }}>
          <span className="eyebrow">Perfil de jugador</span>
          <h2>{usuario}</h2>
        </div>
        <div className="form-card" style={{ maxWidth: 520, margin: "0 auto" }}>
          {error && <p>{error}</p>}
          {datos && (
            <>
              {datos.foto && <img src={datos.foto} alt="" style={{ width: 112, height: 112, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto 12px" }} />}
              <p>{datos.descripcion || "Este jugador todavía no escribió nada."}</p>
              <h3 style={{ marginTop: 24 }}>Mejores partidas</h3>
              <Partidas partidas={datos.partidas} />
            </>
          )}
          {!datos && !error && <p>Cargando perfil...</p>}
        </div>
        <Buscador />
      </div>
    </section>
  );
}

// Perfil propio: editar datos, foto y cerrar sesión
function PerfilPropio() {
  const { sesion, iniciar, cerrar } = useSesion();
  const navigate = useNavigate();
  const inputFoto = useRef(null);
  const [usuario, setUsuario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [foto, setFoto] = useState("");
  const [fotoNueva, setFotoNueva] = useState(undefined); // undefined no cambia; "" quitar; data URL nueva
  const [partidas, setPartidas] = useState([]);
  const [racha, setRacha] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/perfil`, { headers: cabeceraAuth(sesion.token) })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok: bien, d }) => {
        if (!bien) return setError(d.error || "No se pudo cargar tu perfil.");
        setUsuario(d.usuario);
        setDescripcion(d.descripcion);
        setFoto(d.foto || "");
      })
      .catch(() => setError("No se pudo cargar tu perfil."));

    fetch(`${API_URL}/api/jugadores/${encodeURIComponent(sesion.usuario)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPartidas(d.partidas))
      .catch(() => {});

    fetch(`${API_URL}/api/progreso`, { headers: cabeceraAuth(sesion.token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setProgreso(d))
      .catch(() => {});

    fetch(`${API_URL}/api/racha`, { headers: cabeceraAuth(sesion.token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRacha(d))
      .catch(() => {});
  }, [sesion]);

  async function elegirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      const nueva = await achicarImagen(archivo);
      setFotoNueva(nueva);
      setFoto(nueva);
    } catch {
      setError("No se pudo leer la imagen.");
    }
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setOk("");
    setGuardando(true);
    try {
      const cuerpo = { usuario: usuario.trim(), descripcion };
      if (fotoNueva !== undefined) cuerpo.foto = fotoNueva;
      const r = await fetch(`${API_URL}/api/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...cabeceraAuth(sesion.token) },
        body: JSON.stringify(cuerpo),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudieron guardar los cambios.");
      iniciar({ token: sesion.token, usuario: d.usuario, foto: d.foto || "" });
      setFoto(d.foto || "");
      setFotoNueva(undefined);
      setOk("Cambios guardados.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function salir() {
    cerrar();
    navigate("/");
  }

  return (
    <section>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 28px" }}>
          <span className="eyebrow">Mi perfil</span>
          <h2>{usuario || sesion.usuario}</h2>
          <button type="button" className="cuenta-boton" onClick={salir} style={{ marginTop: 8 }}>Cerrar sesión</button>
        </div>

        <Buscador />

        <div className="form-card" style={{ maxWidth: 520, margin: "0 auto" }}>
          {error && <div className="alert alert-error show visible" role="alert">{error}</div>}
          {ok && <div className="alert alert-success show visible" role="status">{ok}</div>}

          <form onSubmit={guardar}>
            <div className="field" style={{ textAlign: "center" }}>
              {foto ? (
                <img src={foto} alt="Foto de perfil" style={{ width: 112, height: 112, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto 12px", border: "1px solid var(--border)" }} />
              ) : (
                <span className="cuenta-foto cuenta-foto-letra" style={{ width: 112, height: 112, fontSize: "2.5rem", margin: "0 auto 12px" }}>
                  {(usuario || sesion.usuario).charAt(0).toUpperCase()}
                </span>
              )}
              <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={elegirFoto} />
              <button type="button" className="cuenta-boton" onClick={() => inputFoto.current.click()}>Cambiar foto</button>
              <button type="button" className="cuenta-boton" style={{ marginLeft: 8 }} onClick={() => { setFotoNueva(""); setFoto(""); }}>Quitar</button>
            </div>

            <div className="field">
              <label htmlFor="usuario-edit">Nombre de usuario</label>
              <input id="usuario-edit" value={usuario} onChange={(e) => setUsuario(e.target.value)} maxLength={20} autoComplete="username" />
            </div>
            <div className="field">
              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={200} placeholder="Ej: Me gusta resolver desafíos mixtos" />
              <span className="field-error" style={{ display: "block", opacity: 1 }}>{descripcion.length}/200</span>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>

          <h3 style={{ marginTop: 28 }}>Mi progreso</h3>
          {progreso && (
            <>
              <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>{progreso.completados} de {progreso.total} niveles completados</p>
              <div className="progreso-barra" role="progressbar" aria-valuenow={progreso.completados} aria-valuemin={0} aria-valuemax={progreso.total}>
                <div className="progreso-relleno" style={{ width: `${(progreso.completados / progreso.total) * 100}%` }} />
              </div>
            </>
          )}

          <h3 style={{ marginTop: 28 }}>Mi racha</h3>
          {racha && (
            <>
              <div className="racha-resumen">
                <div className="racha-numero"><strong>{racha.rachaActual}</strong><span>días seguidos</span></div>
                <div className="racha-numero"><strong>{racha.rachaMaxima}</strong><span>racha máxima</span></div>
              </div>
              <Calendario dias={racha.dias} />
            </>
          )}

          <h3 style={{ marginTop: 28 }}>Mis mejores partidas</h3>
          <Partidas partidas={partidas} />
        </div>
      </div>
    </section>
  );
}

export default function Perfil() {
  const { sesion } = useSesion();
  const { usuario } = useParams();

  if (usuario) return <PerfilPublico usuario={usuario} />;
  if (!sesion) return <Navigate to="/ingresar" replace />;
  return <PerfilPropio />;
}
