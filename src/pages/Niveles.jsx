import { Link } from "react-router-dom";
import { CONTENT_LIBRARY } from "../lib/content-library.js";

const CLAVES = ["suma", "resta", "multiplicacion", "division", "mixto"];

export default function Niveles() {
  return (
    <section>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Catálogo</span>
          <h2>Elegí un nivel para practicar</h2>
        </div>
        <div className="grid-3">
          {CLAVES.map((clave) => {
            const nivel = CONTENT_LIBRARY[clave];
            return (
              <div className="level-card" key={clave}>
                <div className="icon mono">{nivel?.simbolo ?? "?"}</div>
                <h3>{nivel?.titulo ?? clave}</h3>
                <Link to={`/jugar?nivel=${clave}`} className="btn btn-primary btn-block">Jugar</Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
