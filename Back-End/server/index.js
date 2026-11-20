import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

const app = express();
const ORIGEN_WEB = "https://gabosahur.github.io";
app.use(cors({ origin: [ORIGEN_WEB, "http://127.0.0.1:5500", "http://localhost:5500"] }));
app.use(express.json());

const cliente = new MongoClient(process.env.MONGO_URI);
await cliente.connect();
const db = cliente.db("numerax");

await db.collection("usuarios").createIndex({ usuario: 1 }, { unique: true });
await db.collection("sesiones").createIndex({ token: 1 }, { unique: true });

// ---------- Utilidades de contraseña y sesión (sin dependencias extra) ----------
function hashClave(clave) {
  const sal = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(clave, sal, 64).toString("hex");
  return `${sal}:${hash}`;
}

function claveCorrecta(clave, guardada) {
  const [sal, hash] = guardada.split(":");
  const comparar = crypto.scryptSync(clave, sal, 64);
  return crypto.timingSafeEqual(comparar, Buffer.from(hash, "hex"));
}

async function crearSesion(usuario, rol = "jugador") {
  const token = crypto.randomBytes(32).toString("hex");
  await db.collection("sesiones").insertOne({ token, usuario, rol, creada: new Date() });
  return token;
}

async function sesionDesdeRequest(req) {
  const cabecera = req.headers.authorization || "";
  const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : null;
  if (!token) return null;
  return db.collection("sesiones").findOne({ token });
}

// ---------- Ruta de prueba ----------
app.get("/", (req, res) => res.send("API de NumeraX funcionando"));

// ---------- Registro e ingreso de jugadores ----------
app.post("/api/registro", async (req, res) => {
  const usuario = String(req.body.usuario || "").trim();
  const clave = String(req.body.clave || "");

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(usuario))
    return res.status(400).json({ error: "El usuario debe tener entre 3 y 20 letras, números o guiones bajos." });
  if (clave.length < 6)
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });

  try {
    await db.collection("usuarios").insertOne({ usuario, clave: hashClave(clave), creado: new Date() });
    const token = await crearSesion(usuario);
    await registrarAcceso(usuario);
    res.status(201).json({ token, usuario });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "Ese nombre de usuario ya existe." });
    throw error;
  }
});

app.post("/api/ingresar", async (req, res) => {
  const usuario = String(req.body.usuario || "").trim();
  const clave = String(req.body.clave || "");

  const cuenta = await db.collection("usuarios").findOne({ usuario });
  if (!cuenta || !claveCorrecta(clave, cuenta.clave))
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });

  const token = await crearSesion(usuario);
  await registrarAcceso(usuario);
  res.json({ token, usuario });
});

app.post("/api/salir", async (req, res) => {
  const cabecera = req.headers.authorization || "";
  const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "";
  await db.collection("sesiones").deleteOne({ token });
  res.json({ ok: true });
});

app.get("/api/yo", async (req, res) => {
  const sesion = await sesionDesdeRequest(req);
  if (!sesion) return res.status(401).json({ error: "No hay sesión." });
  res.json({ usuario: sesion.usuario, rol: sesion.rol });
});

// ---------- Partidas y ranking ----------
// ---------- Progresión de niveles (25 = 5 por operación) ----------
const OPERACIONES_PROGRESO = ["suma", "resta", "multiplicacion", "division", "mixto"];
const TITULOS_OPERACION = { suma: "Sumas", resta: "Restas", multiplicacion: "Multiplicación", division: "División", mixto: "Desafío mixto" };
const PORCENTAJE_PARA_COMPLETAR = 70;
const RESPUESTAS_MINIMAS = 5;

function listaNiveles(completados) {
  const basicosCompletos = ["suma", "resta", "multiplicacion", "division"].every((op) =>
    completados.includes(`${op}-5`)
  );
  const lista = [];
  for (const op of OPERACIONES_PROGRESO) {
    for (let n = 1; n <= 5; n++) {
      const id = `${op}-${n}`;
      let desbloqueado;
      if (n > 1) desbloqueado = completados.includes(`${op}-${n - 1}`);
      else desbloqueado = op === "mixto" ? basicosCompletos : true;
      lista.push({
        id,
        operacion: op,
        numero: n,
        titulo: `${TITULOS_OPERACION[op]} ${n}`,
        desbloqueado,
        completado: completados.includes(id),
      });
    }
  }
  return lista;
}

async function completadosDe(usuario) {
  const cuenta = await db.collection("usuarios").findOne({ usuario }, { projection: { _id: 0, progreso: 1 } });
  return cuenta?.progreso || [];
}

// Progreso del jugador: solo para cuentas
app.get("/api/progreso", async (req, res) => {
  const sesion = await jugadorDesdeRequest(req);
  if (!sesion) return res.status(401).json({ error: "Iniciá sesión para ver tu progreso." });
  const completados = await completadosDe(sesion.usuario);
  const niveles = listaNiveles(completados);
  res.json({ niveles, completados: completados.length, total: niveles.length });
});

// Guardar una partida. Solo las cuentas pueden guardar; los invitados no entran al ranking.
app.post("/api/partidas", async (req, res) => {
  const { nivel, nivelId, puntaje, correctas, incorrectas } = req.body;
  if (typeof puntaje !== "number") return res.status(400).json({ error: "Puntaje inválido" });

  const sesion = await jugadorDesdeRequest(req);
  if (!sesion)
    return res.status(401).json({ error: "Iniciá sesión para guardar tu partida en el ranking." });

  const usuario = sesion.usuario;
  await db.collection("partidas").insertOne({
    usuario,
    nombre: usuario,
    nivel,
    nivelId: nivelId || null,
    puntaje,
    correctas,
    incorrectas,
    fecha: new Date(),
  });

  // Completar un nivel de progresión, si corresponde
  let nivelCompletado = null;
  if (nivelId) {
    const completados = await completadosDe(usuario);
    const lvl = listaNiveles(completados).find((l) => l.id === nivelId);
    const respondidas = Number(correctas || 0) + Number(incorrectas || 0);
    const porcentaje = respondidas > 0 ? (Number(correctas || 0) / respondidas) * 100 : 0;
    if (lvl && lvl.desbloqueado && !lvl.completado && respondidas >= RESPUESTAS_MINIMAS && porcentaje >= PORCENTAJE_PARA_COMPLETAR) {
      await db.collection("usuarios").updateOne({ usuario }, { $addToSet: { progreso: nivelId } });
      nivelCompletado = nivelId;
    }
  }

  res.status(201).json({ ok: true, guardadaComo: usuario, nivelCompletado });
});

// Inicio del período según la hora de Uruguay (UTC-3)
function inicioPeriodo(periodo) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => Number(partes.find((p) => p.type === t).value);
  const y = get("year"), m = get("month"), d = get("day");
  const medianocheUY = Date.UTC(y, m - 1, d) + 3 * 60 * 60 * 1000;

  if (periodo === "diario") return new Date(medianocheUY);
  if (periodo === "semanal") {
    const diaSemana = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
    return new Date(medianocheUY - diaSemana * 24 * 60 * 60 * 1000);
  }
  if (periodo === "mensual") return new Date(Date.UTC(y, m - 1, 1) + 3 * 60 * 60 * 1000);
  return null;
}

// Ranking: mejor puntaje de cada jugador registrado, hasta 50
app.get("/api/ranking", async (req, res) => {
  const periodo = String(req.query.periodo || "historico");
  const inicio = inicioPeriodo(periodo);
  const filtro = { usuario: { $ne: null } };
  if (inicio) filtro.fecha = { $gte: inicio };
  const niveles = ["suma", "resta", "multiplicacion", "division", "mixto"];
  const nivel = String(req.query.nivel || "general");
  if (niveles.includes(nivel)) filtro.nivel = nivel;

  const top = await db
    .collection("partidas")
    .aggregate([
      { $match: filtro },
      { $sort: { puntaje: -1 } },
      {
        $group: {
          _id: "$usuario",
          nombre: { $first: "$usuario" },
          nivel: { $first: "$nivel" },
          puntaje: { $first: "$puntaje" },
          correctas: { $first: "$correctas" },
          incorrectas: { $first: "$incorrectas" },
          fecha: { $first: "$fecha" },
        },
      },
      { $sort: { puntaje: -1 } },
      { $limit: 50 },
      { $project: { _id: 0 } },
    ])
    .toArray();

  res.json(top);
});

// ---------- Contacto ----------
app.post("/api/contacto", async (req, res) => {
  const { nombre, email, mensaje } = req.body;
  await db.collection("mensajes").insertOne({ nombre, email, mensaje, fecha: new Date() });
  res.status(201).json({ ok: true });
});

// ---------- Administración (protegida) ----------
app.post("/api/admin/ingresar", async (req, res) => {
  const usuario = String(req.body.usuario || "");
  const clave = String(req.body.clave || "");
  if (usuario !== process.env.ADMIN_USUARIO || clave !== process.env.ADMIN_CLAVE)
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });

  const token = await crearSesion(usuario, "admin");
  res.json({ token, usuario });
});

async function exigirAdmin(req, res, siguiente) {
  const sesion = await sesionDesdeRequest(req);
  if (!sesion || sesion.rol !== "admin") return res.status(403).json({ error: "Acceso restringido." });
  siguiente();
}

app.get("/api/admin/mensajes", exigirAdmin, async (req, res) => {
  const mensajes = await db.collection("mensajes").find({}).sort({ fecha: -1 }).toArray();
  res.json(mensajes);
});

app.get("/api/admin/partidas", exigirAdmin, async (req, res) => {
  const partidas = await db.collection("partidas").find({}).sort({ fecha: -1 }).limit(200).toArray();
  res.json(partidas);
});


// ---------- Perfil del jugador ----------
const REGEX_USUARIO = /^[a-zA-Z0-9_]{3,20}$/;

async function jugadorDesdeRequest(req) {
  const sesion = await sesionDesdeRequest(req);
  return sesion && sesion.rol === "jugador" ? sesion : null;
}

app.get("/api/perfil", async (req, res) => {
  const sesion = await jugadorDesdeRequest(req);
  if (!sesion) return res.status(401).json({ error: "Iniciá sesión para ver tu perfil." });

  const cuenta = await db.collection("usuarios").findOne({ usuario: sesion.usuario });
  if (!cuenta) return res.status(404).json({ error: "Cuenta no encontrada." });

  res.json({ usuario: cuenta.usuario, descripcion: cuenta.descripcion || "", foto: cuenta.foto || "", creado: cuenta.creado });
});

app.put("/api/perfil", async (req, res) => {
  const sesion = await jugadorDesdeRequest(req);
  if (!sesion) return res.status(401).json({ error: "Iniciá sesión para editar tu perfil." });

  const anterior = sesion.usuario;
  const nuevo = String(req.body.usuario ?? anterior).trim();
  const descripcion = String(req.body.descripcion ?? "").trim().slice(0, 200);

  if (!REGEX_USUARIO.test(nuevo))
    return res.status(400).json({ error: "El usuario debe tener entre 3 y 20 letras, números o guion bajo." });

  const campos = { descripcion };
  if (req.body.foto !== undefined) {
    const foto = String(req.body.foto || "");
    if (foto !== "" && (!/^data:image\/(jpeg|png|webp);base64,/.test(foto) || foto.length > 200000))
      return res.status(400).json({ error: "La foto tiene que ser una imagen chica (JPG, PNG o WebP)." });
    campos.foto = foto;
  }

  try {
    if (nuevo !== anterior) {
      campos.usuario = nuevo;
      await db.collection("usuarios").updateOne({ usuario: anterior }, { $set: campos });
      // Mantener el mismo nombre en partidas y sesiones abiertas
      await db.collection("partidas").updateMany({ usuario: anterior }, { $set: { usuario: nuevo, nombre: nuevo } });
      await db.collection("sesiones").updateMany({ usuario: anterior }, { $set: { usuario: nuevo } });
    } else {
      await db.collection("usuarios").updateOne({ usuario: anterior }, { $set: campos });
    }
    const cuenta = await db.collection("usuarios").findOne({ usuario: nuevo });
    res.json({ usuario: nuevo, descripcion, foto: cuenta.foto || "" });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "Ese nombre de usuario ya existe." });
    throw error;
  }
});

// Buscar jugadores por nombre (mínimo 2 letras)
app.get("/api/usuarios", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  const escapado = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const coincidencias = await db
    .collection("usuarios")
    .find({ usuario: { $regex: escapado, $options: "i" } }, { projection: { _id: 0, usuario: 1, foto: 1 } })
    .limit(10)
    .toArray();
  res.json(coincidencias);
});

// Perfil público: lo ven otros jugadores
app.get("/api/jugadores/:usuario", async (req, res) => {
  const cuenta = await db.collection("usuarios").findOne({ usuario: req.params.usuario });
  if (!cuenta) return res.status(404).json({ error: "Jugador no encontrado." });

  const partidas = await db
    .collection("partidas")
    .find({ usuario: cuenta.usuario }, { projection: { _id: 0, nivel: 1, puntaje: 1, fecha: 1 } })
    .sort({ puntaje: -1 })
    .limit(10)
    .toArray();

  res.json({
    usuario: cuenta.usuario,
    descripcion: cuenta.descripcion || "",
    foto: cuenta.foto || "",
    creado: cuenta.creado,
    partidas,
  });
});

// ---------- Racha de días (inicios de sesión) ----------
await db.collection("accesos").createIndex({ usuario: 1, dia: 1 }, { unique: true });

// Día del calendario en Uruguay, formato AAAA-MM-DD
function diaUY(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(fecha);
}

function diaAnterior(dia) {
  const t = new Date(dia + "T00:00:00Z").getTime() - 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

function diaSiguiente(dia) {
  const t = new Date(dia + "T00:00:00Z").getTime() + 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

async function registrarAcceso(usuario) {
  const dia = diaUY();
  try {
    await db.collection("accesos").updateOne({ usuario, dia }, { $set: { usuario, dia } }, { upsert: true });
  } catch {
    /* si ya estaba guardado, no pasa nada */
  }
}

app.get("/api/racha", async (req, res) => {
  const sesion = await jugadorDesdeRequest(req);
  if (!sesion) return res.status(401).json({ error: "Iniciá sesión para ver tu racha." });

  const desde = diaUY(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000));
  const docs = await db
    .collection("accesos")
    .find({ usuario: sesion.usuario, dia: { $gte: desde } }, { projection: { _id: 0, dia: 1 } })
    .toArray();
  const dias = docs.map((d) => d.dia).sort();
  const conjunto = new Set(dias);

  // Racha actual: días seguidos hasta hoy; si hoy todavía no ingresó, cuenta desde ayer
  const hoy = diaUY();
  let cursor = conjunto.has(hoy) ? hoy : diaAnterior(hoy);
  let rachaActual = 0;
  while (conjunto.has(cursor)) {
    rachaActual++;
    cursor = diaAnterior(cursor);
  }

  // Racha máxima dentro de los días guardados
  let rachaMaxima = 0;
  let corrida = 0;
  let anterior = null;
  for (const dia of dias) {
    corrida = anterior && diaSiguiente(anterior) === dia ? corrida + 1 : 1;
    rachaMaxima = Math.max(rachaMaxima, corrida);
    anterior = dia;
  }

  res.json({ dias, rachaActual, rachaMaxima, hoy });
});

// ---------- Tutor con IA (Gemini) ----------
const INSTRUCCIONES_TUTOR = `Sos un tutor de matemática para chicos de secundaria, en español rioplatense (usá "vos").
Explicá conceptos con claridad y paso a paso, con ejemplos simples.
Cuando te pidan resolver un ejercicio, NO des la respuesta final: dá pistas, preguntas guía y el primer paso.
Si el tema no es matemática, decí amablemente que solo podés ayudar con matemática.
Respuestas breves, de no más de 6 o 7 líneas.`;

app.post("/api/chat", async (req, res) => {
  const sesion = await sesionDesdeRequest(req);
  if (!sesion || sesion.rol !== "jugador")
    return res.status(401).json({ error: "Iniciá sesión para usar el tutor." });

  const pregunta = String(req.body.pregunta || "").trim().slice(0, 300);
  if (!pregunta) return res.status(400).json({ error: "Escribí una pregunta." });

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 20000);
  let respuesta;
  try {
    respuesta = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      signal: controlador.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCCIONES_TUTOR }] },
        contents: [{ role: "user", parts: [{ text: pregunta }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
      }),
    }
    );
  } catch (error) {
    clearTimeout(limite);
    console.error("Gemini no respondió a tiempo:", error.message);
    return res.status(504).json({ error: "El tutor tardó demasiado. Probá de nuevo." });
  }
  clearTimeout(limite);

  if (!respuesta.ok) {
    console.error("Error de Gemini:", respuesta.status, await respuesta.text());
    return res.status(502).json({ error: "El tutor no está disponible en este momento." });
  }

  const datos = await respuesta.json();
  const texto = datos.candidates?.[0]?.content?.parts?.[0]?.text || "No pude responder, probá de nuevo.";
  res.json({ respuesta: texto });
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Servidor en http://localhost:${process.env.PORT || 3000}`)
);