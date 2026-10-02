import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { describirPauta } from "@/lib/medicamentos";
import { color, COLORES } from "@/lib/panal";
import { estadoVacunas } from "@/lib/resumen";
import { resumirPeriodo } from "@/lib/resumen-pediatra";
import { duracion, edad, fechaCorta, fechaDia, fechaLarga, hhmm, startOfTodayAR, toDateInput } from "@/lib/time";
import type { Appointment, Diaper, Feeding, Growth, HealthLog, Medication, MedicationDose, Note, Sleep, VaccineDose } from "@/lib/types";
import { etiquetaSintoma, formatoTemp } from "@/lib/sintomas";
import { edadParaCurva, MAX_DIAS, puntajeZ, textoPercentil } from "@/lib/oms";
import { resolverPregunta } from "../actions";
import { Imprimir } from "./Imprimir";

export const metadata = { title: "Resumen para el pediatra · Sofía" };

const PERIODOS = [
  { p: "control", label: "Desde el último control" },
  { p: "3", label: "3 días" },
  { p: "7", label: "7 días" },
  { p: "14", label: "14 días" },
  { p: "30", label: "30 días" },
];

const num = (n: number, dec = 1) => n.toLocaleString("es-AR", { maximumFractionDigits: dec });

function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="card flex flex-col gap-0.5 p-3.5">
      <span className="label">{titulo}</span>
      <span className="display text-[24px] leading-tight">{valor}</span>
      {detalle && <span className="text-[12px] leading-snug text-muted">{detalle}</span>}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="eyebrow mt-3">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function Page({ searchParams }: PageProps<"/salud/resumen">) {
  const { supabase, baby } = await requireBaby();
  const { p } = await searchParams;
  const now = new Date();

  const { data: ultimoControl } = await supabase
    .from("appointments").select("*").eq("baby_id", baby.id).eq("done", true).lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: false }).limit(1).maybeSingle<Appointment>();

  // Por defecto: desde el último control si fue hace menos de 30 días; si no, 7 días.
  const elegido = typeof p === "string" && PERIODOS.some((x) => x.p === p) ? p : ultimoControl && now.getTime() - new Date(ultimoControl.scheduled_at).getTime() < 30 * 86400_000 ? "control" : "7";
  const periodo = elegido === "control" && !ultimoControl ? "7" : elegido;
  const desde =
    periodo === "control"
      ? new Date(ultimoControl!.scheduled_at)
      : new Date(startOfTodayAR(now).getTime() - (Number(periodo) - 1) * 86400_000);
  const nacio = new Date(baby.birth_at);
  const desdeReal = desde < nacio ? nacio : desde;
  const iso = desdeReal.toISOString();
  const margen = new Date(desdeReal.getTime() - 3600_000).toISOString(); // para unir sesiones de toma que cruzan el inicio

  const [f, d, s, notas, preguntas, medidas, vacunas, meds, dosis, salud] = await Promise.all([
    supabase.from("feedings").select("*").eq("baby_id", baby.id).gte("started_at", margen).order("started_at").returns<Feeding[]>(),
    supabase.from("diapers").select("*").eq("baby_id", baby.id).gte("changed_at", iso).order("changed_at").returns<Diaper[]>(),
    supabase.from("sleeps").select("*").eq("baby_id", baby.id).or(`ended_at.is.null,ended_at.gte.${iso}`).returns<Sleep[]>(),
    supabase.from("notes").select("*").eq("baby_id", baby.id).eq("for_doctor", false).gte("created_at", iso).order("created_at").returns<Note[]>(),
    supabase.from("notes").select("*").eq("baby_id", baby.id).eq("for_doctor", true).eq("resolved", false).order("created_at").returns<Note[]>(),
    supabase.from("growth_records").select("*").eq("baby_id", baby.id).order("measured_on", { ascending: false }).limit(6).returns<Growth[]>(),
    supabase.from("vaccine_doses").select("*").eq("baby_id", baby.id).returns<VaccineDose[]>(),
    supabase.from("medications").select("*").eq("baby_id", baby.id).returns<Medication[]>(),
    supabase.from("medication_doses").select("*").eq("baby_id", baby.id).gte("given_at", iso).returns<MedicationDose[]>(),
    supabase.from("health_logs").select("*").eq("baby_id", baby.id).gte("observed_at", iso).order("observed_at").returns<HealthLog[]>(),
  ]);
  const temps = (salud.data ?? []).filter((x) => x.temperature_c !== null);
  const maxTemp = temps.length ? temps.reduce((a, b) => (b.temperature_c! > a.temperature_c! ? b : a)) : null;

  const r = resumirPeriodo({ desde: desdeReal, hasta: now, birthAt: baby.birth_at, feedings: f.data ?? [], diapers: d.data ?? [], sleeps: s.data ?? [] });
  const hayPecho = r.promedio.minPecho > 0;
  const hayMamadera = r.promedio.ml > 0;

  // Fotos: primero las de colores llamativos.
  const conFoto = [...r.llamativos, ...(d.data ?? []).filter((x) => !r.llamativos.includes(x))].filter((x) => x.photo_path).slice(0, 8);
  const firmadas = conFoto.length ? (await supabase.storage.from("fotos").createSignedUrls(conFoto.map((x) => x.photo_path!), 3600)).data ?? [] : [];
  const fotos = conFoto.flatMap((x) => {
    const url = firmadas.find((y) => y.path === x.photo_path)?.signedUrl;
    return url ? [{ p: x, url }] : [];
  });

  const hoy = toDateInput(now);
  const medsPeriodo = (meds.data ?? []).filter((m) => (m.active || (dosis.data ?? []).some((x) => x.medication_id === m.id)) && (!m.ends_on || m.ends_on >= toDateInput(desdeReal)));
  const vac = estadoVacunas(baby.birth_at, vacunas.data ?? [], now);
  const vacPeriodo = vac.filter((v) => v.aplicada && v.aplicada.applied_on >= toDateInput(desdeReal));
  const vacPendientes = vac.filter((v) => v.estado === "atrasada" || v.estado === "proxima");
  const pesoNacer = baby.birth_weight_g;
  // Percentil OMS del peso de cada medida (0-24 meses).
  const sexo = baby.sex === "masculino" ? "m" : "f";
  const pct = (m: Growth) => {
    if (!m.weight_g) return null;
    const { dias } = edadParaCurva(baby.birth_at, `${m.measured_on}T12:00:00-03:00`, baby.gestation_weeks);
    const z = dias <= MAX_DIAS ? puntajeZ("peso", sexo, dias, m.weight_g / 1000) : null;
    return z === null ? null : `peso ${textoPercentil(z)}`;
  };
  const ultimoPeso = (medidas.data ?? []).find((m) => m.weight_g);

  return (
    <>
      <div className="print:hidden">
        <PageHeader eyebrow="Salud" title="Resumen para el pediatra" back="/salud" />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 print:hidden">
        {PERIODOS.filter((x) => x.p !== "control" || ultimoControl).map((x) => (
          <Link
            key={x.p}
            href={`/salud/resumen?p=${x.p}`}
            aria-current={periodo === x.p ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full px-3.5 text-[14px] font-semibold ${periodo === x.p ? "bg-accent text-on-accent" : "border border-line text-muted"}`}
          >
            {x.label}
          </Link>
        ))}
      </div>
      <Imprimir />

      {/* Encabezado (también en el PDF) */}
      <section className="card flex flex-col gap-1.5 p-4">
        <span className="eyebrow">Resumen de {fechaCorta(desdeReal)} a {fechaCorta(now)}</span>
        <h1 className="display text-[28px] leading-tight">{[baby.first_name, baby.last_name].filter(Boolean).join(" ")}</h1>
        <p className="text-[14px] leading-relaxed text-muted">
          {edad(baby.birth_at, now)} · nació el {fechaDia(baby.birth_at)}
          {pesoNacer ? ` con ${pesoNacer.toLocaleString("es-AR")} g` : ""}
          {baby.gestation_weeks ? ` (${baby.gestation_weeks} semanas)` : ""}
          {baby.feeding_mode ? ` · alimentación ${({ pecho: "a pecho", mixta: "mixta", formula: "con mamadera" } as const)[baby.feeding_mode]}` : ""}
          {baby.blood_type ? ` · grupo ${baby.blood_type}` : ""}
        </p>
        {baby.allergies && <p className="text-[14px]">Alergias / observaciones: {baby.allergies}</p>}
        {periodo === "control" && ultimoControl && (
          <p className="text-[13px] text-faint">Desde el control del {fechaDia(ultimoControl.scheduled_at)} ({ultimoControl.kind}).</p>
        )}
      </section>

      {r.diasConDatos === 0 ? (
        <p className="py-6 text-center text-[15px] text-muted">No hay registros en este período.</p>
      ) : (
        <>
          <Seccion titulo="En números (promedio por día)">
            <div className="grid grid-cols-2 gap-2">
              <Dato titulo="Tomas por día" valor={num(r.promedio.tomas)} detalle={r.intervaloMin ? `Cada ${duracion(r.intervaloMin)} en promedio` : undefined} />
              <Dato
                titulo="Mayor pausa sin comer"
                valor={r.mayorPausa ? duracion(r.mayorPausa.min) : "—"}
                detalle={r.mayorPausa ? `${fechaCorta(r.mayorPausa.desde)} desde las ${hhmm(r.mayorPausa.desde)}` : undefined}
              />
              {hayPecho && <Dato titulo="Pecho por día" valor={duracion(r.promedio.minPecho)} />}
              {hayMamadera && <Dato titulo="Mamadera por día" valor={`${Math.round(r.promedio.ml)} ml`} />}
              <Dato titulo="Pañales por día" valor={`${num(r.promedio.pis)} pis`} detalle={`${num(r.promedio.caca)} con caca`} />
              <Dato titulo="Sueño por día" valor={duracion(r.promedio.suenoMin)} detalle={r.siestaMasLarga ? `Siesta más larga: ${duracion(r.siestaMasLarga)}` : undefined} />
            </div>
            <p className="text-[12px] text-faint">Promedio sobre {r.diasConDatos} {r.diasConDatos === 1 ? "día" : "días"} con registros. Los dos pechos seguidos cuentan como una toma.</p>
          </Seccion>

          {Object.keys(r.colores).length > 0 && (
            <Seccion titulo="Color de las deposiciones">
              <div className="card flex flex-wrap gap-2 p-3.5">
                {COLORES.filter((c) => r.colores[c.code]).map((c) => (
                  <span key={c.code} className="flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 text-[13px] font-semibold text-soft-ink">
                    <span className="size-3.5 rounded-full border border-black/20" style={{ background: c.hex }} />
                    {c.label} · {r.colores[c.code]}
                  </span>
                ))}
              </div>
              {r.llamativos.length > 0 && (
                <p className="flex items-start gap-2 rounded-2xl bg-alert-bg px-4 py-3 text-[14px] text-alert">
                  <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
                  {r.llamativos.length === 1 ? "1 deposición" : `${r.llamativos.length} deposiciones`} de color para comentar:{" "}
                  {r.llamativos.map((x) => `${color(x.poop_color)?.label.toLowerCase()} (${fechaCorta(x.changed_at)} ${hhmm(x.changed_at)})`).join(", ")}.
                </p>
              )}
            </Seccion>
          )}

          <Seccion titulo="Día por día">
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="px-3 py-2 font-semibold">Día</th>
                    <th className="px-2 py-2 font-semibold">Tomas</th>
                    {hayPecho && <th className="px-2 py-2 font-semibold">Pecho</th>}
                    {hayMamadera && <th className="px-2 py-2 font-semibold">ml</th>}
                    <th className="px-2 py-2 font-semibold">Pis</th>
                    <th className="px-2 py-2 font-semibold">Caca</th>
                    <th className="px-3 py-2 font-semibold">Sueño</th>
                  </tr>
                </thead>
                <tbody>
                  {r.dias.map((x) => (
                    <tr key={x.dia} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 font-semibold">{x.dia === hoy ? "Hoy" : fechaCorta(`${x.dia}T12:00:00-03:00`)}</td>
                      <td className="px-2 py-2">{x.tomas || "—"}</td>
                      {hayPecho && <td className="px-2 py-2">{x.minPecho ? duracion(x.minPecho) : "—"}</td>}
                      {hayMamadera && <td className="px-2 py-2">{x.ml || "—"}</td>}
                      <td className="px-2 py-2">{x.pis || "—"}</td>
                      <td className="px-2 py-2">{x.caca || "—"}</td>
                      <td className="px-3 py-2">{x.suenoMin ? duracion(x.suenoMin) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        </>
      )}

      {(salud.data ?? []).length > 0 && (
        <Seccion titulo="Temperatura y síntomas">
          {maxTemp && (
            <p className="text-[14px]">
              Máxima: <strong>{formatoTemp(maxTemp.temperature_c!)}</strong> ({fechaCorta(maxTemp.observed_at)} {hhmm(maxTemp.observed_at)}
              {maxTemp.method ? `, ${maxTemp.method}` : ""}) · {temps.filter((x) => x.temperature_c! >= 38).length} mediciones de 38 °C o más.
            </p>
          )}
          <ul className="card px-4">
            {(salud.data ?? []).map((x) => (
              <li key={x.id} className="flex flex-col gap-0.5 border-b border-line py-2 last:border-0">
                <span className="text-[14px] font-semibold">
                  {fechaCorta(x.observed_at)} {hhmm(x.observed_at)}
                  {x.temperature_c !== null ? ` · ${formatoTemp(x.temperature_c)}${x.method ? ` (${x.method})` : ""}` : ""}
                </span>
                {(x.symptoms.length > 0 || x.notes) && (
                  <span className="text-[13px] text-muted">{[x.symptoms.map(etiquetaSintoma).join(", "), x.notes].filter(Boolean).join(" · ")}</span>
                )}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="Peso y medidas">
        {(medidas.data ?? []).length === 0 ? (
          <p className="text-[14px] text-muted">Sin medidas cargadas{pesoNacer ? ` (al nacer: ${pesoNacer.toLocaleString("es-AR")} g)` : ""}.</p>
        ) : (
          <ul className="card px-4">
            {(medidas.data ?? []).map((m, i, arr) => {
              const prev = arr.slice(i + 1).find((x) => x.weight_g);
              const dd = prev ? (new Date(m.measured_on).getTime() - new Date(prev.measured_on).getTime()) / 86400_000 : 0;
              const gd = prev && m.weight_g && dd > 0 ? Math.round((m.weight_g - prev.weight_g!) / dd) : null;
              return (
                <li key={m.id} className="flex justify-between gap-3 border-b border-line py-2.5 text-[14px] last:border-0">
                  <span className="font-semibold">{fechaDia(m.measured_on)}</span>
                  <span className="text-right text-muted">
                    {[m.weight_g && `${m.weight_g.toLocaleString("es-AR")} g`, m.length_cm && `${m.length_cm} cm`, m.head_cm && `PC ${m.head_cm} cm`].filter(Boolean).join(" · ")}
                    {gd !== null && ` · ${gd >= 0 ? "+" : ""}${gd} g/día`}
                    {pct(m) && ` · ${pct(m)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {ultimoPeso?.weight_g && pesoNacer && (
          <p className="text-[12px] text-faint">
            Respecto del nacimiento: {ultimoPeso.weight_g - pesoNacer >= 0 ? "+" : ""}
            {(ultimoPeso.weight_g - pesoNacer).toLocaleString("es-AR")} g ({num(((ultimoPeso.weight_g - pesoNacer) / pesoNacer) * 100)} %).
          </p>
        )}
      </Seccion>

      {medsPeriodo.length > 0 && (
        <Seccion titulo="Medicamentos">
          <ul className="card px-4">
            {medsPeriodo.map((m) => {
              const dadas = (dosis.data ?? []).filter((x) => x.medication_id === m.id).length;
              let esperadas: number | null = null;
              if (m.kind === "diaria") {
                const ini = [toDateInput(desdeReal), m.starts_on].sort().at(-1)!;
                const fin = [hoy, m.ends_on ?? hoy].sort()[0];
                const nDias = Math.max(0, Math.round((new Date(`${fin}T12:00:00-03:00`).getTime() - new Date(`${ini}T12:00:00-03:00`).getTime()) / 86400_000) + 1);
                esperadas = nDias * m.times.length;
              }
              return (
                <li key={m.id} className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0">
                  <span className="text-[14px] font-semibold">
                    {m.name}
                    {m.dose ? ` · ${m.dose}` : ""}
                    {!m.active ? " (pausado)" : ""}
                  </span>
                  <span className="text-[13px] text-muted">
                    {describirPauta(m)}
                    {m.prescribed_by ? ` · indicó ${m.prescribed_by}` : ""} · {dadas} dosis en el período
                    {esperadas ? ` de ${esperadas} previstas` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="Vacunas">
        <div className="card flex flex-col gap-1.5 p-4 text-[14px]">
          <p>
            <span className="font-semibold">Aplicadas en el período: </span>
            {vacPeriodo.length ? vacPeriodo.map((v) => `${v.vacuna} (${v.dosis})`).join(", ") : "ninguna"}
          </p>
          {vacPendientes.length > 0 && (
            <p>
              <span className="font-semibold">Pendientes: </span>
              {vacPendientes.map((v) => `${v.vacuna} ${v.dosis.toLowerCase()} (${v.estado === "atrasada" ? "atrasada" : fechaCorta(v.fecha)})`).join(", ")}
            </p>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Preguntas para la consulta">
        {(preguntas.data ?? []).length === 0 ? (
          <p className="text-[14px] text-muted print:hidden">
            No hay preguntas anotadas. <Link href="/registrar/nota?pediatra=1" className="font-semibold text-accent">Anotar una</Link>
          </p>
        ) : (
          <ul className="card px-4">
            {(preguntas.data ?? []).map((q) => (
              <li key={q.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
                <span className="flex-1 py-1.5 text-[15px]">{q.body}</span>
                <form action={resolverPregunta} className="print:hidden">
                  <input type="hidden" name="id" value={q.id} />
                  <button aria-label="Marcar como respondida" className="flex size-11 items-center justify-center rounded-xl text-muted hover:text-accent">
                    <Icon name="check" size={20} stroke={2} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {(notas.data ?? []).length > 0 && (
        <Seccion titulo="Notas del período">
          <ul className="card px-4">
            {(notas.data ?? []).map((n) => (
              <li key={n.id} className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0">
                <span className="text-[12px] text-faint">{fechaCorta(n.created_at)} · {hhmm(n.created_at)}</span>
                <span className="whitespace-pre-line text-[14px]">{n.body}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {fotos.length > 0 && (
        <Seccion titulo="Fotos de pañales">
          <div className="grid grid-cols-2 gap-2">
            {fotos.map(({ p: x, url }) => (
              <a key={x.id} href={url} target="_blank" rel="noreferrer" className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Pañal del ${fechaCorta(x.changed_at)}`} className="aspect-square w-full object-cover" />
                <span className="block px-2.5 py-1.5 text-[12px] text-muted">
                  {fechaCorta(x.changed_at)} {hhmm(x.changed_at)}
                  {x.poop_color ? ` · ${color(x.poop_color)?.label}` : ""}
                </span>
              </a>
            ))}
          </div>
        </Seccion>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-faint">
        Generado con Sofía el {fechaLarga(now).toLowerCase()} a las {hhmm(now)}. Son registros cargados por la familia: no reemplazan la evaluación del pediatra.
      </p>
    </>
  );
}
