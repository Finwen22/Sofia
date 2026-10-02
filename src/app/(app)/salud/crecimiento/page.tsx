import Link from "next/link";
import { CurvaOMS, type Punto } from "@/components/CurvaOMS";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { edadParaCurva, INDICADORES, MAX_DIAS, puntajeZ, textoPercentil, type Indicador } from "@/lib/oms";
import { edad, fechaDia } from "@/lib/time";
import type { Growth } from "@/lib/types";

export const metadata = { title: "Crecimiento · Sofía" };

const ORDEN: Indicador[] = ["peso", "talla", "pc"];

function valorDe(m: Growth, ind: Indicador): number | null {
  if (ind === "peso") return m.weight_g ? m.weight_g / 1000 : null;
  if (ind === "talla") return m.length_cm !== null ? Number(m.length_cm) : null;
  return m.head_cm !== null ? Number(m.head_cm) : null;
}

const fmt = (v: number, ind: Indicador) => (ind === "peso" ? `${v.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg` : `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })} cm`);

export default async function Page({ searchParams }: PageProps<"/salud/crecimiento">) {
  const { supabase, baby } = await requireBaby();
  const { i } = await searchParams;
  const ind: Indicador = ORDEN.includes(i as Indicador) ? (i as Indicador) : "peso";
  const { data } = await supabase.from("growth_records").select("*").eq("baby_id", baby.id).order("measured_on").returns<Growth[]>();
  const medidas = data ?? [];

  // Sin sexo cargado se usan las curvas de nena, avisando.
  const sexo = baby.sex === "masculino" ? "m" : "f";
  const hoy = edadParaCurva(baby.birth_at, new Date(), baby.gestation_weeks);
  const filas = medidas
    .map((m) => {
      const valor = valorDe(m, ind);
      if (valor === null) return null;
      // Las columnas `date` se toman al mediodía para no correrse de día.
      const { dias } = edadParaCurva(baby.birth_at, `${m.measured_on}T12:00:00-03:00`, baby.gestation_weeks);
      const z = dias <= MAX_DIAS ? puntajeZ(ind, sexo, dias, valor) : null;
      return { m, valor, dias, z };
    })
    .filter((x) => x !== null);
  const puntos: Punto[] = filas
    .filter((f) => f.dias <= MAX_DIAS)
    .map((f) => ({ dias: f.dias, valor: f.valor, etiqueta: `${fechaDia(f.m.measured_on)}: ${fmt(f.valor, ind)}${f.z !== null ? ` (${textoPercentil(f.z)})` : ""}` }));
  const ultima = filas[filas.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Salud"
        title="Crecimiento"
        back="/salud"
        action={
          <Link href="/salud/crecimiento/nuevo" aria-label="Agregar medida" className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-accent text-on-accent">
            <Icon name="plus" size={22} stroke={2} />
          </Link>
        }
      />

      <div role="tablist" className="flex gap-1.5 rounded-[20px] bg-soft p-1">
        {ORDEN.map((k) => (
          <Link
            key={k}
            role="tab"
            aria-selected={k === ind}
            href={`/salud/crecimiento?i=${k}`}
            replace
            className={`flex h-11 flex-1 items-center justify-center rounded-2xl text-[14px] font-semibold ${k === ind ? "bg-surface text-ink shadow" : "text-soft-ink"}`}
          >
            {INDICADORES[k].corto}
          </Link>
        ))}
      </div>

      {!baby.sex && (
        <p className="rounded-2xl bg-soft px-4 py-3 text-[14px] text-soft-ink">
          No está cargado si es nena o varón; se usan las curvas de nena. <Link href="/ficha/editar" className="font-semibold underline">Completalo en la ficha</Link>.
        </p>
      )}

      {ultima && ultima.z !== null && (
        <div className="card flex items-baseline justify-between gap-3 p-4">
          <span className="flex flex-col gap-0.5">
            <span className="label">Última medida · {fechaDia(ultima.m.measured_on)}</span>
            <span className="display text-[28px] leading-tight">{fmt(ultima.valor, ind)}</span>
          </span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="display text-[28px] leading-tight text-accent">{textoPercentil(ultima.z)}</span>
            <span className="text-[12px] text-muted">percentil OMS</span>
          </span>
        </div>
      )}

      {puntos.length === 0 ? (
        <div className="card flex flex-col gap-3 p-5">
          <p className="text-[15px] text-muted">Todavía no hay medidas de {INDICADORES[ind].label.toLowerCase()}. Cargá las de cada control para ver la curva.</p>
          <Link href="/salud/crecimiento/nuevo" className="btn-primary h-12 text-[15px]">Agregar medida</Link>
        </div>
      ) : (
        <div className="card p-3">
          <CurvaOMS indicador={ind} sexo={sexo} puntos={puntos} hastaDias={Math.min(hoy.dias, MAX_DIAS)} nombre={baby.first_name} />
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-faint">
        Patrones de Crecimiento Infantil de la OMS, {sexo === "f" ? "nenas" : "varones"} de 0 a 24 meses.
        {hoy.corregida && " Como nació antes de las 37 semanas, se usa la edad corregida."} Lo importante es que siga su propia curva de forma
        pareja: un percentil aislado no dice mucho. Lo interpreta el pediatra.
      </p>

      {filas.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow mt-2">Medidas</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-2 py-2 font-semibold">Edad</th>
                  <th className="px-2 py-2 font-semibold">{INDICADORES[ind].corto}</th>
                  <th className="px-3 py-2 text-right font-semibold">Percentil</th>
                </tr>
              </thead>
              <tbody>
                {[...filas].reverse().map((f) => (
                  <tr key={f.m.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-semibold">{fechaDia(f.m.measured_on)}</td>
                    <td className="px-2 py-2 text-muted">{edad(baby.birth_at, new Date(`${f.m.measured_on}T12:00:00-03:00`))}</td>
                    <td className="px-2 py-2">{fmt(f.valor, ind)}</td>
                    <td className="px-3 py-2 text-right">{f.z !== null ? textoPercentil(f.z) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
