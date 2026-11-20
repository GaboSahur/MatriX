import { Link } from "react-router-dom";
import { useSesion } from "../context/SesionContext.jsx";

export default function CuentaBar() {
  const { sesion } = useSesion();

  if (!sesion) {
    return (
      <div className="cuenta-barra">
        <Link className="cuenta-boton" to="/ingresar">Ingresar</Link>
        <Link className="cuenta-boton cuenta-boton-primario" to="/registro">Registrarse</Link>
      </div>
    );
  }

  return (
    <div className="cuenta-barra">
      <Link className="cuenta-perfil" to="/perfil">
        {sesion.foto ? (
          <img className="cuenta-foto" src={sesion.foto} alt="" />
        ) : (
          <span className="cuenta-foto cuenta-foto-letra">{sesion.usuario.charAt(0).toUpperCase()}</span>
        )}
        <span>{sesion.usuario}</span>
      </Link>
    </div>
  );
}
