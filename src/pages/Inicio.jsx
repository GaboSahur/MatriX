import { Link } from "react-router-dom";

const PRACTICAS = [
  { id: "suma", titulo: "Sumas", simbolo: "+" },
  { id: "resta", titulo: "Restas", simbolo: "−" },
  { id: "multiplicacion", titulo: "Multiplicación", simbolo: "×" },
  { id: "division", titulo: "División", simbolo: "÷" },
];

export default function Inicio() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Ruta avanzada · Proyecto final</span>
          <h1>Aprender matemática jugando también se puede</h1>
          <p className="lede">
            Elegí un nivel, resolvé ejercicios contra el reloj y sumá puntos en cada partida.
          </p>
          <div className="hero-actions">
            <Link to="/niveles" className="btn btn-primary">Ver niveles</Link>
            <Link to="/jugar?nivel=mixto" className="btn btn-secondary">Jugar ahora</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Práctica</span>
            <h2>Practicá sin presión</h2>
            <p>Estas partidas son solo para practicar y no entran al ranking.</p>
          </div>
          <div className="grid-2 practicas-grilla">
            {PRACTICAS.map((p) => (
              <div className="level-card" key={p.id}>
                <div className="icon mono">{p.simbolo}</div>
                <h3>{p.titulo}</h3>
                <Link to={`/jugar?nivel=${p.id}`} className="btn btn-primary btn-block">Practicar</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
