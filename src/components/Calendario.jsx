import { useState } from "react";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const NOMBRES_MES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Calendario del mes con los días en que la cuenta ingresó
export default function Calendario({ dias = [], mesesAtras = 3 }) {
  const [offset, setOffset] = useState(0);
  const hoy = new Date();
  const ref = new Date(hoy.getFullYear(), hoy.getMonth() - offset, 1);
  const anio = ref.getFullYear();
  const mes = ref.getMonth();

  const cantidadDias = new Date(anio, mes + 1, 0).getDate();
  const primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const celdas = [...Array(primerDia).fill(null), ...Array.from({ length: cantidadDias }, (_, i) => i + 1)];

  const conjunto = new Set(dias);
  const claveDia = (d) => `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  return (
    <div className="calendario">
      <div className="calendario-cabecera">
        <button type="button" className="cuenta-boton" onClick={() => setOffset((o) => Math.min(o + 1, mesesAtras))} disabled={offset >= mesesAtras} aria-label="Mes anterior">‹</button>
        <strong>{NOMBRES_MES[mes]} {anio}</strong>
        <button type="button" className="cuenta-boton" onClick={() => setOffset((o) => Math.max(o - 1, 0))} disabled={offset === 0} aria-label="Mes siguiente">›</button>
      </div>
      <div className="calendario-grilla">
        {DIAS_SEMANA.map((d, i) => (
          <span key={"s" + i} className="calendario-semana">{d}</span>
        ))}
        {celdas.map((d, i) => {
          if (d === null) return <span key={"v" + i} />;
          const clave = claveDia(d);
          const activo = conjunto.has(clave);
          const esHoy = clave === hoyTexto;
          return (
            <span
              key={clave}
              className={`calendario-dia ${activo ? "activo" : ""} ${esHoy ? "hoy" : ""}`}
              title={activo ? "Ingresaste ese día" : ""}
            >
              {d}
            </span>
          );
        })}
      </div>
    </div>
  );
}
