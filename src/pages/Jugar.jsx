import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CONTENT_LIBRARY } from "../lib/content-library.js";
import { API_URL, leerSesion, cabeceraAuth } from "../lib/api.js";

const DURACION = 60;
const OPERACIONES = ["suma", "resta", "multiplicacion", "division"];
const SIMBOLOS_VOZ = { "+": "más", "−": "menos", "-": "menos", "×": "por", "÷": "dividido" };
const DATOS_CURIOSOS = [
  "el cero empezó a usarse como número en la India, alrededor del siglo V.",
  "el 2 es el único número primo par: todos los demás pares son divisibles por 2.",
  "multiplicar cualquier número por 10 le agrega un cero al final: 36 × 10 = 360.",
  "el signo = fue propuesto por el matemático Robert Recorde en 1557.",
  "para dividir por 5 también podés multiplicar por 2 y dividir por 10.",
  "una circunferencia tiene 360 grados, un número con muchos divisores.",
  "los hexágonos del panal de abejas son la forma que mejor aprovecha el espacio.",
  "un número es primo si solo es divisible por 1 y por sí mismo.",
];

const aleatorioEntre = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Interpreta el parámetro: "suma" (práctica) o "suma-3" (nivel de progresión)
function interpretarNivel(pedido) {
  const coincide = /^(suma|resta|multiplicacion|division|mixto)-([1-5])$/.exec(pedido || "");
  if (coincide) return { base: coincide[1], numero: Number(coincide[2]), esNivel: true };
  const base = CONTENT_LIBRARY[pedido] ? pedido : "suma";
  return { base, numero: null, esNivel: false };
}

// Dificultad adaptativa: sube con 3 aciertos seguidos, baja con 2 errores seguidos
function crearMotor(inicio) {
  return { nivelDificultad: inicio, rachaAciertos: 0, rachaErrores: 0 };
}

function registrarResultado(motor, esCorrecto) {
  if (esCorrecto) {
    motor.rachaAciertos++;
    motor.rachaErrores = 0;
    if (motor.rachaAciertos >= 3) {
      motor.nivelDificultad = Math.min(5, motor.nivelDificultad + 1);
      motor.rachaAciertos = 0;
    }
  } else {
    motor.rachaErrores++;
    motor.rachaAciertos = 0;
    if (motor.rachaErrores >= 2) {
      motor.nivelDificultad = Math.max(1, motor.nivelDificultad - 1);
      motor.rachaErrores = 0;
    }
  }
}

function generarEjercicio(base, motor) {
  const operacion = base === "mixto" ? OPERACIONES[aleatorioEntre(0, 3)] : base;
  const config = CONTENT_LIBRARY[operacion];
  const factor = 1 + (motor.nivelDificultad - 1) * 0.6;
  const min = config.min;
  const max = Math.round(config.max * factor);

  let a = aleatorioEntre(min, max);
  let b = aleatorioEntre(min, max);
  let resultado;

  switch (operacion) {
    case "suma":
      resultado = a + b;
      break;
    case "resta":
      if (b > a) [a, b] = [b, a];
      resultado = a - b;
      break;
    case "multiplicacion":
      resultado = a * b;
      break;
    case "division":
      b = aleatorioEntre(min, Math.max(min + 1, Math.round(6 * factor)));
      resultado = aleatorioEntre(min, Math.round(10 * factor));
      a = b * resultado;
      break;
    default:
      resultado = a + b;
  }

  return { a, b, operacion, resultado, texto: `${a} ${config.simbolo} ${b}` };
}

function leerEnVoz(texto) {
  if (!("speechSynthesis" in window)) return;
  const frase = texto.replace(/[+\-−×÷]/g, (s) => ` ${SIMBOLOS_VOZ[s] || s} `);
  speechSynthesis.cancel();
  setTimeout(() => {
    const voz = new SpeechSynthesisUtterance(frase);
    const espanol = speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
    if (espanol) voz.voice = espanol;
    voz.lang = "es-ES";
    voz.rate = 0.9;
    speechSynthesis.speak(voz);
  }, 80);
}

// Devuelve la respuesta del servidor (incluye si se completó un nivel) o null si falla
async function guardarPartida(datos) {
  try {
    const sesion = leerSesion();
    const r = await fetch(`${API_URL}/api/partidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabeceraAuth(sesion?.token) },
      body: JSON.stringify(datos),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export default function Jugar() {
  const [params] = useSearchParams();
  const pedido = params.get("nivel");
  const { base, numero, esNivel } = interpretarNivel(pedido);
  const logueado = Boolean(leerSesion());
  // Solo las cuentas juegan la progresión; los invitados practican
  const nivelId = esNivel && logueado ? pedido : null;
  const titulo = nivelId ? `${CONTENT_LIBRARY[base].titulo} ${numero}` : CONTENT_LIBRARY[base].titulo;
  const dificultadInicial = nivelId ? numero : 2;

  const [fase, setFase] = useState("jugando"); // jugando | fin
  const [tiempo, setTiempo] = useState(DURACION);
  const [stats, setStats] = useState({ puntaje: 0, correctas: 0, incorrectas: 0, racha: 0 });
  const [problema, setProblema] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [feedback, setFeedback] = useState({ texto: "", tipo: "" });
  const [dificultad, setDificultad] = useState(dificultadInicial);
  const [vozActivada, setVozActivada] = useState(false);
  const [datoCurioso, setDatoCurioso] = useState("");
  const [aviso, setAviso] = useState("");

  const motor = useRef(crearMotor(dificultadInicial));
  const partida = useRef(null);
  const intervalo = useRef(null);
  const siguiente = useRef(null);
  const vozRef = useRef(false);
  const inputRef = useRef(null);

  function nuevoProblema() {
    const ejercicio = generarEjercicio(partida.current.nivel, motor.current);
    partida.current.problema = ejercicio;
    setProblema(ejercicio);
    setRespuesta("");
    setFeedback({ texto: "", tipo: "" });
    if (vozRef.current) leerEnVoz(ejercicio.texto);
    inputRef.current?.focus();
  }

  async function finalizar() {
    const p = partida.current;
    if (!p || !p.jugando) return;
    p.jugando = false;
    clearInterval(intervalo.current);
    clearTimeout(siguiente.current);
    if ("speechSynthesis" in window) speechSynthesis.cancel();

    setFase("fin");
    const indice = Math.abs(Number(p.puntaje || p.correctas) || 0) % DATOS_CURIOSOS.length;
    setDatoCurioso(`Sabías que… ${DATOS_CURIOSOS[indice]}`);

    // Entran al ranking: los niveles de progresión y el desafío mixto (cuentas)
    const enRanking = logueado && (Boolean(nivelId) || pedido === "mixto");
    if (!enRanking) {
      setAviso(
        logueado
          ? "Práctica: esta partida no entra al ranking."
          : "Practicaste sin cuenta, así que tu partida no entra al ranking. Ingresá para jugar la progresión y guardar tus puntajes."
      );
      return;
    }

    // Una partida sin puntos no se guarda
    if (p.puntaje <= 0) {
      setAviso("No sumaste puntos en esta partida, así que no se guardó.");
      return;
    }

    const datos = { nivel: p.nivel, puntaje: p.puntaje, correctas: p.correctas, incorrectas: p.incorrectas };
    if (p.nivelId) datos.nivelId = p.nivelId;
    const resultado = await guardarPartida(datos);

    if (!resultado) {
      setAviso("No se pudo guardar la partida. Revisá tu conexión.");
    } else if (resultado.nivelCompletado) {
      setAviso(`¡Completaste ${titulo}! 🎉 Ya podés pasar al siguiente nivel.`);
    } else if (p.nivelId) {
      setAviso("Partida guardada. Para completar el nivel necesitás al menos 70% de aciertos y 5 respuestas.");
    }
  }

  function iniciar() {
    clearInterval(intervalo.current);
    clearTimeout(siguiente.current);
    motor.current = crearMotor(dificultadInicial);
    partida.current = { nivel: base, nivelId, puntaje: 0, correctas: 0, incorrectas: 0, racha: 0, tiempo: DURACION, jugando: true, problema: null };

    setFase("jugando");
    setTiempo(DURACION);
    setStats({ puntaje: 0, correctas: 0, incorrectas: 0, racha: 0 });
    setDificultad(motor.current.nivelDificultad);
    setDatoCurioso("");
    setAviso("");
    nuevoProblema();

    intervalo.current = setInterval(() => {
      const p = partida.current;
      if (!p || !p.jugando) return;
      p.tiempo -= 1;
      setTiempo(p.tiempo);
      if (p.tiempo <= 0) finalizar();
    }, 1000);
  }

  function manejarRespuesta(e) {
    e.preventDefault();
    const p = partida.current;
    if (!p || !p.jugando) return;

    if (respuesta.trim() === "" || Number.isNaN(Number(respuesta))) {
      setFeedback({ texto: "Escribí un número antes de responder.", tipo: "bad" });
      return;
    }

    const correcto = Number(respuesta) === p.problema.resultado;
    registrarResultado(motor.current, correcto);
    setDificultad(motor.current.nivelDificultad);

    if (correcto) {
      const puntos = 10 * motor.current.nivelDificultad;
      p.correctas++;
      p.racha++;
      p.puntaje += puntos;
      setFeedback({ texto: `¡Correcto! +${puntos} pts`, tipo: "ok" });
    } else {
      p.incorrectas++;
      p.racha = 0;
      setFeedback({ texto: `Casi. La respuesta era ${p.problema.resultado}.`, tipo: "bad" });
    }

    setStats({ puntaje: p.puntaje, correctas: p.correctas, incorrectas: p.incorrectas, racha: p.racha });

    clearTimeout(siguiente.current);
    siguiente.current = setTimeout(() => {
      if (partida.current?.jugando) nuevoProblema();
    }, correcto ? 500 : 1600);
  }

  function alternarVoz() {
    const nuevo = !vozRef.current;
    vozRef.current = nuevo;
    setVozActivada(nuevo);
    if (!nuevo && "speechSynthesis" in window) speechSynthesis.cancel();
  }

  // Empieza una partida nueva cada vez que cambia el nivel pedido
  useEffect(() => {
    iniciar();
  }, [pedido]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al salir de la página, se detiene todo
  useEffect(() => {
    return () => {
      clearInterval(intervalo.current);
      clearTimeout(siguiente.current);
      if (partida.current) partida.current.jugando = false;
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    };
  }, []);

  return (
    <section>
      <div className="container">
        <div className="section-head center" style={{ margin: "0 auto 28px", textAlign: "center" }}>
          <span className="eyebrow">{titulo}</span>
          <h2>¡A resolver!</h2>
          {!logueado && (
            <p style={{ color: "var(--ink-soft)" }}>
              Modo práctica · <Link to="/ingresar" className="enlace">ingresá</Link> para la progresión y el ranking.
            </p>
          )}
        </div>

        {fase === "jugando" ? (
          <div className="game-shell">
            <div className="game-topbar">
              <span className="pill timer">⏱ {tiempo}s</span>
              <span className="pill">⭐ {stats.puntaje} pts</span>
              <span className="pill streak">🔥 {stats.racha}</span>
              <span className="pill">Dificultad {dificultad}/5</span>
              <button type="button" className="pill" aria-pressed={vozActivada} onClick={alternarVoz}>
                {vozActivada ? "🔊 Voz" : "🔇 Voz"}
              </button>
            </div>

            <div className="problem">
              <p className="expression">{problema ? problema.texto : "? ? ?"}</p>
              <form className="answer-form" onSubmit={manejarRespuesta}>
                <label htmlFor="input-respuesta" className="visually-hidden">Tu respuesta</label>
                <input
                  ref={inputRef}
                  id="input-respuesta"
                  type="number"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Responder</button>
              </form>
            </div>

            <p className={`feedback-banner ${feedback.tipo}`} role="status">{feedback.texto}</p>
          </div>
        ) : (
          <div className="game-shell result-screen">
            <span className="eyebrow">Partida terminada</span>
            <p className="score-big">{stats.puntaje} pts</p>
            <p>{stats.correctas} correctas · {stats.incorrectas} incorrectas</p>
            {aviso && <p className="alert alert-success show visible" role="status" style={{ maxWidth: 520, margin: "16px auto" }}>{aviso}</p>}
            {datoCurioso && (
              <p className="dato-curioso" style={{ fontStyle: "italic", maxWidth: 520, margin: "16px auto" }}>
                {datoCurioso}
              </p>
            )}
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={iniciar}>Jugar de nuevo</button>
              <Link to="/niveles" className="btn btn-secondary">Elegir otro nivel</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
