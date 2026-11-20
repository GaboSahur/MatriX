import { Link } from "react-router-dom";

export default function Pendiente({ nombre }) {
  return (
    <section>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">En migración</span>
          <h2>{nombre}</h2>
          <p>Esta página todavía se está pasando a React.</p>
          <Link to="/" className="btn btn-secondary">Volver al inicio</Link>
        </div>
      </div>
    </section>
  );
}
