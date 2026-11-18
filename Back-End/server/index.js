import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors({ origin: "https://gabosahur.github.io" }));
app.use(express.json());

const cliente = new MongoClient(process.env.MONGO_URI);
await cliente.connect();
const db = cliente.db("numerax");

app.get("/", (req, res) => res.send("API de NumeraX funcionando"));

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
    const diaSemana = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // lunes = 0
    return new Date(medianocheUY - diaSemana * 24 * 60 * 60 * 1000);
  }
  if (periodo === "mensual") return new Date(Date.UTC(y, m - 1, 1) + 3 * 60 * 60 * 1000);
  return null; // histórico
}

// Ranking: mejor puntaje de cada jugador, hasta 50, por período
app.get("/api/ranking", async (req, res) => {
  const periodo = String(req.query.periodo || "historico");
  const inicio = inicioPeriodo(periodo);
  const filtro = inicio ? { fecha: { $gte: inicio } } : {};

  const top = await db
    .collection("partidas")
    .aggregate([
      { $match: filtro },
      { $sort: { puntaje: -1 } },
      {
        $group: {
          _id: "$nombre",
          nombre: { $first: "$nombre" },
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

app.post("/api/partidas", async (req, res) => {
  const { nombre, nivel, puntaje, correctas, incorrectas } = req.body;
  if (typeof puntaje !== "number") return res.status(400).json({ error: "Puntaje inválido" });

  await db.collection("partidas").insertOne({
    nombre: String(nombre || "Anónimo").slice(0, 30),
    nivel,
    puntaje,
    correctas,
    incorrectas,
    fecha: new Date(),
  });
  res.status(201).json({ ok: true });
});

app.post("/api/contacto", async (req, res) => {
  const { nombre, email, mensaje } = req.body;
  await db.collection("mensajes").insertOne({ nombre, email, mensaje, fecha: new Date() });
  res.status(201).json({ ok: true });
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Servidor en http://localhost:${process.env.PORT || 3000}`)
);