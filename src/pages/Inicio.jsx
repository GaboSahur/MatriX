import { Link } from "react-router-dom";

export default function Inicio() {
  return (
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
  );
}
