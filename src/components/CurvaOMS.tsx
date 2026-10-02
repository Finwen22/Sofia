import { curva, INDICADORES, MAX_DIAS, PERCENTILES, type Indicador, type Sexo } from "@/lib/oms";

export type Punto = { dias: number; valor: number; etiqueta: string };

const W = 360;
const H = 260;
const M = { t: 12, r: 34, b: 30, l: 34 };
const DIAS_MES = 30.4375;

/**
 * Curva de la OMS (P3, P15, P50, P85, P97) con las mediciones de la bebé.
 * Bandas en un solo tono (de más claro afuera a más fuerte adentro), la
 * mediana en tinta y la bebé en el acento, con anillo del color de fondo.
 */
export function CurvaOMS({ indicador, sexo, puntos, hastaDias, nombre }: { indicador: Indicador; sexo: Sexo; puntos: Punto[]; hastaDias: number; nombre: string }) {
  const maxMes = Math.min(24, Math.max(3, Math.ceil(hastaDias / DIAS_MES) + 2));
  const maxDias = Math.min(MAX_DIAS, maxMes * DIAS_MES);
  const paso = maxDias <= 120 ? 2 : 7;
  const dias: number[] = [];
  for (let d = 0; d <= maxDias; d += paso) dias.push(d);
  if (dias[dias.length - 1] !== maxDias) dias.push(maxDias);

  const series = PERCENTILES.map((p) => dias.map((d) => curva(indicador, sexo, d, p.z)!));
  const visibles = puntos.filter((p) => p.dias <= maxDias);
  const valores = [...series.flat(), ...visibles.map((p) => p.valor)];
  const yMin = Math.floor(Math.min(...valores) * 0.97);
  const yMax = Math.ceil(Math.max(...valores) * 1.02);

  const x = (d: number) => M.l + (d / maxDias) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - ((v - yMin) / (yMax - yMin)) * (H - M.t - M.b);
  const linea = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(dias[i]).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const banda = (abajo: number[], arriba: number[]) =>
    `${linea(arriba)}${[...abajo].reverse().map((v, i) => `L${x(dias[dias.length - 1 - i]).toFixed(1)},${y(v).toFixed(1)}`).join("")}Z`;

  const pasoMes = maxMes <= 6 ? 1 : maxMes <= 12 ? 2 : 3;
  const meses = Array.from({ length: Math.floor(maxMes / pasoMes) + 1 }, (_, i) => i * pasoMes);
  const rango = yMax - yMin;
  const pasoY = rango <= 6 ? 1 : rango <= 15 ? 2 : rango <= 30 ? 5 : 10;
  const ticksY: number[] = [];
  for (let v = Math.ceil(yMin / pasoY) * pasoY; v <= yMax; v += pasoY) ticksY.push(v);

  const unidad = INDICADORES[indicador].unidad;
  const ordenados = [...visibles].sort((a, b) => a.dias - b.dias);

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${INDICADORES[indicador].label} según la edad, con las curvas de la OMS`} className="w-full">
        {/* Grilla recesiva */}
        {ticksY.map((v) => (
          <g key={`y${v}`}>
            <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={M.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--color-faint)">{v}</text>
          </g>
        ))}
        {meses.map((m) => (
          <text key={`x${m}`} x={x(m * DIAS_MES)} y={H - M.b + 16} textAnchor="middle" fontSize="10" fill="var(--color-faint)">
            {m}
          </text>
        ))}
        <text x={W - M.r} y={H - 4} textAnchor="end" fontSize="10" fill="var(--color-faint)">meses</text>
        <text x={M.l - 6} y={M.t - 2} textAnchor="end" fontSize="10" fill="var(--color-faint)">{unidad}</text>

        {/* Bandas: P3–P97 (más clara) y P15–P85 */}
        <path d={banda(series[0], series[4])} fill="var(--color-accent)" fillOpacity="0.10" />
        <path d={banda(series[1], series[3])} fill="var(--color-accent)" fillOpacity="0.14" />
        {[0, 4].map((i) => (
          <path key={i} d={linea(series[i])} fill="none" stroke="var(--color-accent)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        <path d={linea(series[2])} fill="none" stroke="var(--color-muted)" strokeWidth="1.5" />

        {/* Etiquetas directas de las curvas, al borde derecho */}
        {PERCENTILES.map((p, i) => (
          <text key={p.p} x={W - M.r + 4} y={y(series[i][series[i].length - 1]) + 3.5} fontSize="10" fill="var(--color-faint)">
            P{p.p}
          </text>
        ))}

        {/* La bebé */}
        {ordenados.length > 1 && (
          <path d={ordenados.map((p, i) => `${i ? "L" : "M"}${x(p.dias).toFixed(1)},${y(p.valor).toFixed(1)}`).join("")} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
        )}
        {ordenados.map((p, i) => (
          <g key={i}>
            <circle cx={x(p.dias)} cy={y(p.valor)} r="6" fill="var(--color-surface)" />
            <circle cx={x(p.dias)} cy={y(p.valor)} r="4" fill="var(--color-accent)">
              <title>{p.etiqueta}</title>
            </circle>
            {/* Área táctil más grande que el punto */}
            <circle cx={x(p.dias)} cy={y(p.valor)} r="12" fill="transparent">
              <title>{p.etiqueta}</title>
            </circle>
          </g>
        ))}
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" /> {nombre}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-muted" /> Mediana (P50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-accent/25" /> Rango habitual (P3 a P97)
        </span>
      </figcaption>
    </figure>
  );
}
