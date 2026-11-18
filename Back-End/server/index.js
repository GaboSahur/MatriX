import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors({ origin: "https://gabosahur.github.io" })); // tu dominio de GitHub Pages
app.use(express.json());

const cliente = new MongoClient(process.env.MONGO_URI);
await cliente.connect();
const db = cliente.db("numerax");

// Guardar una partida
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

// Ranking: mejor puntaje por jugador
app.get("/api/ranking", async (req, res) => {
  const top = await db
    .collection("partidas")
    .find({})
    .sort({ puntaje: -1 })
    .limit(10)
    .toArray();
  res.json(top);
});

// Mensajes del formulario de contacto
app.post("/api/contacto", async (req, res) => {
  const { nombre, email, mensaje } = req.body;
  await db.collection("mensajes").insertOne({ nombre, email, mensaje, fecha: new Date() });
  res.status(201).json({ ok: true });
});

app.get("/", (req, res) => res.send("API de NumeraX funcionando"));

app.listen(process.env.PORT, () => console.log(`Servidor en http://localhost:${process.env.PORT}`));