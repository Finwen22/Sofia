import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { estadoVacunas } from "@/lib/resumen";
import { fechaCorta, fechaDia, hhmm } from "@/lib/time";
import type { Appointment, Growth, Note, VaccineDose } from "@/lib/types";
import { borrarMedida, resolverPregunta } from "./actions";

export const metadata = { title: "Salud · Sofía" };

function Seccion({ id, titulo, accion, children }: { id?: string; titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-2.5">
      <div className="mt-3 flex items-center justify-between">
        <h2 className="eyebrow">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Agregar({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex h-9 items-center gap-1 rounded-full border border-line px-3 text-[13px] font-semibold text-accent">
      <Icon name="plus" size={16} /> {label}
    </Link>
  );
}

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const ahora = new Date().toISOString();
  const [proximos, pasados, dosis, medidas, preguntas] = await Promise.all([
    supabase.from("appointments").select("*").eq("baby_id", baby.id).eq("done", false).order("scheduled_at").returns<Appointment[]>(),
    supabase.from("appointments").select("*").eq("baby_id", baby.id).eq("done", true).order("scheduled_at", { ascending: false }).limit(5).returns<Appointment[]>(),
    supabase.from("vaccine_doses").select("*").eq("baby_id", baby.id).returns<VaccineDose[]>(),
    supabase.from("growth_records").select("*").eq("baby_id", baby.id).order("measured_on", { ascending: false }).returns<Growth[]>(),
    supabase.from("notes").select("*").eq("baby_id", baby.id).eq("for_doctor", true).eq("resolved", false).order("created_at").returns<Note[]>(),
  ]);

  const vacunas = estadoVacunas(baby.birth_at, dosis.data ?? []);
  const atrasadas = vacunas.filter((v) => v.estado === "atrasada");
  const proximas = vacunas.filter((v) => v.estado === "proxima");
  const aplicadas = vacunas.filter((v) => v.estado === "aplicada").length;
  const listaMedidas = medidas.data ?? [];

  return (
    <>
      <PageHeader eyebrow="Salud" title="Controles y cuidados" />

      <Seccion titulo="Turnos" accion={<Agregar href="/salud/turnos/nuevo" label="Turno" />}>
        {(proximos.data ?? []).length === 0 && <p className="text-[15px] text-muted">No hay turnos agendados.</p>}
        {(proximos.data ?? []).map((t) => {
          const vencido = t.scheduled_at < ahora;
          return (
            <Link key={t.id} href={`/salud/turnos/${t.id}`} className="card flex items-center gap-3.5 px-4 py-3.5">
              <span className="flex w-12 shrink-0 flex-col items-center rounded-[14px] bg-soft py-1.5 text-soft-ink">
                <span className="text-[11px] font-semibold uppercase">{fechaCorta(t.scheduled_at).split(" ")[0]}</span>
                <span className="display text-xl leading-none">{new Date(t.scheduled_at).toLocaleDateString("es-AR", { day: "numeric", timeZone: "America/Argentina/Buenos_Aires" })}</span>
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{t.kind}</span>
                <span className="text-[13px] text-muted">
                  {hhmm(t.scheduled_at)}
                  {t.professional ? ` · ${t.professional}` : ""}
                  {t.place ? ` · ${t.place}` : ""}
                </span>
                {vencido && <span className="text-[13px] font-semibold text-alert">¿Ya fueron? Tocá para cargar cómo salió</span>}
              </span>
              <Icon name="chev" size={18} className="text-muted" />
            </Link>
          );
        })}
        {(pasados.data ?? []).length > 0 && (
          <details className="card px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-semibold text-muted">Últimos controles</summary>
            <ul className="mt-2 flex flex-col">
              {(pasados.data ?? []).map((t) => (
                <li key={t.id}>
                  <Link href={`/salud/turnos/${t.id}`} className="flex flex-col gap-0.5 border-t border-line py-2.5">
                    <span className="text-[14px] font-semibold">{t.kind} · {fechaDia(t.scheduled_at)}</span>
                    {t.outcome && <span className="text-[13px] text-muted">{t.outcome}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Seccion>

      <Seccion id="preguntas" titulo="Para preguntarle al pediatra" accion={<Agregar href="/registrar/nota?pediatra=1" label="Pregunta" />}>
        {(preguntas.data ?? []).length === 0 ? (
          <p className="text-[15px] text-muted">Cuando te surja una duda, anotala acá y la llevan al control.</p>
        ) : (
          <ul className="card flex flex-col px-4">
            {(preguntas.data ?? []).map((q) => (
              <li key={q.id} className="flex items-center gap-2 border-b border-line py-2 last:border-0">
                <span className="flex-1 text-[15px]">{q.body}</span>
                <form action={resolverPregunta}>
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

      <Seccion titulo="Vacunas">
        <Link href="/salud/vacunas" className="card flex items-center gap-3.5 px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-soft text-soft-ink">
            <Icon name="syringe" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">
              {atrasadas.length ? `${atrasadas.length} atrasada${atrasadas.length > 1 ? "s" : ""}` : `${aplicadas} aplicadas`}
            </span>
            <span className="text-[13px] text-muted">
              {proximas.length
                ? `Próximas: ${[...new Set(proximas.map((p) => p.vacuna))].join(", ")} · ${fechaCorta(proximas[0].fecha)}`
                : "Ver calendario completo"}
            </span>
          </span>
          <Icon name="chev" size={18} className="text-muted" />
        </Link>
      </Seccion>

      <Seccion titulo="Crecimiento" accion={<Agregar href="/salud/crecimiento/nuevo" label="Medida" />}>
        {listaMedidas.length === 0 ? (
          <p className="text-[15px] text-muted">Cargá el peso y la talla de cada control para ver cómo crece.</p>
        ) : (
          <ul className="card flex flex-col px-4">
            {listaMedidas.map((m, i) => {
              const prev = listaMedidas.slice(i + 1).find((x) => x.weight_g);
              const dias = prev ? (new Date(m.measured_on).getTime() - new Date(prev.measured_on).getTime()) / 86400000 : 0;
              const gramosDia = prev && m.weight_g && dias > 0 ? Math.round((m.weight_g - prev.weight_g!) / dias) : null;
              return (
                <li key={m.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">
                      {[m.weight_g && `${m.weight_g.toLocaleString("es-AR")} g`, m.length_cm && `${m.length_cm} cm`, m.head_cm && `PC ${m.head_cm} cm`].filter(Boolean).join(" · ")}
                    </span>
                    <span className="text-[13px] text-muted">
                      {fechaDia(m.measured_on)}
                      {m.notes ? ` · ${m.notes}` : ""}
                      {gramosDia !== null ? ` · ${gramosDia >= 0 ? "+" : ""}${gramosDia} g/día` : ""}
                    </span>
                  </span>
                  <DeleteButton action={borrarMedida} fields={{ id: m.id }} pregunta="¿Borrar esta medida?" />
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[13px] leading-relaxed text-faint">
          Es normal que baje hasta un 10 % del peso en los primeros días y lo recupere hacia las 2 semanas. El pediatra interpreta las curvas.
        </p>
      </Seccion>
    </>
  );
}
