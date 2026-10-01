import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { LiveDuration } from "@/components/LiveDuration";
import { LiveTimer } from "@/components/LiveTimer";
import { requireBaby } from "@/lib/session";
import { avisos, duracionToma, estadoVacunas, intervaloPromedio, minutosDeSueno, sesionesDeToma } from "@/lib/resumen";
import { duracion, edad, fechaCorta, fechaLarga, haceCuanto, hhmm, startOfTodayAR } from "@/lib/time";
import type { Appointment, Diaper, Feeding, Growth, Sleep, VaccineDose } from "@/lib/types";
import { terminarSueno, terminarToma, empezarSueno } from "./registrar/actions";
import { cargarMedicamentos } from "./salud/medicamentos/datos";
import { MedEstado } from "./salud/medicamentos/MedEstado";
import { estadoMed } from "@/lib/medicamentos";
import { toDateInput } from "@/lib/time";

const ACCIONES: { href: string; label: string; icon: IconName }[] = [
  { href: "/registrar/toma", label: "Toma", icon: "bottle" },
  { href: "/registrar/panal", label: "Pañal", icon: "diaper" },
  { href: "/registrar/sueno", label: "Sueño", icon: "moon" },
  { href: "/registrar/nota", label: "Nota", icon: "note" },
];

function ladoTexto(f: Feeding) {
  if (f.kind === "mamadera") return `Mamadera · ${f.amount_ml ?? "?"} ml${f.milk === "formula" ? " de fórmula" : f.milk === "materna" ? " de leche materna" : ""}`;
  const lado = f.side === "izquierdo" ? "Pecho izquierdo" : f.side === "derecho" ? "Pecho derecho" : f.side === "ambos" ? "Ambos pechos" : "Pecho";
  return f.ended_at ? `${lado} · ${duracion(duracionToma(f))}` : lado;
}

export default async function Inicio() {
  const { supabase, baby } = await requireBaby();
  const now = new Date();
  const hace24 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const hoy = startOfTodayAR(now);

  const [feedings, diapers, sleeps, turno, dosis, peso, primerPanal, preguntas, ultimaToma, medicamentos] = await Promise.all([
    supabase.from("feedings").select("*").eq("baby_id", baby.id).gte("started_at", hace24).order("started_at", { ascending: false }).returns<Feeding[]>(),
    supabase.from("diapers").select("*").eq("baby_id", baby.id).gte("changed_at", hace24).order("changed_at", { ascending: false }).returns<Diaper[]>(),
    supabase.from("sleeps").select("*").eq("baby_id", baby.id).or(`ended_at.is.null,ended_at.gte.${hoy.toISOString()}`).order("started_at", { ascending: false }).returns<Sleep[]>(),
    supabase.from("appointments").select("*").eq("baby_id", baby.id).eq("done", false).gte("scheduled_at", now.toISOString()).order("scheduled_at").limit(1).maybeSingle<Appointment>(),
    supabase.from("vaccine_doses").select("*").eq("baby_id", baby.id).returns<VaccineDose[]>(),
    supabase.from("growth_records").select("*").eq("baby_id", baby.id).not("weight_g", "is", null).order("measured_on", { ascending: false }).limit(1).maybeSingle<Growth>(),
    supabase.from("diapers").select("changed_at").eq("baby_id", baby.id).order("changed_at").limit(1).maybeSingle<{ changed_at: string }>(),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("baby_id", baby.id).eq("for_doctor", true).eq("resolved", false),
    supabase.from("feedings").select("*").eq("baby_id", baby.id).order("started_at", { ascending: false }).limit(1).returns<Feeding[]>(),
    cargarMedicamentos(supabase, baby.id, baby.family_id),
  ]);
  // En el inicio: los que tienen algo para hoy (pendientes primero). "Si hace falta" no aparece.
  const hoyDia = toDateInput(now);
  const medsHoy = medicamentos.meds
    .filter((m) => m.kind !== "si_hace_falta" && hoyDia >= m.starts_on && (!m.ends_on || hoyDia <= m.ends_on))
    .map((m) => {
      const e = estadoMed(m, medicamentos.porMed(m.id), now);
      const pendiente = e.kind === "diaria" ? e.pendiente : e.kind === "intervalo" ? e.atrasada : false;
      return { m, pendiente };
    })
    .sort((a, b) => Number(b.pendiente) - Number(a.pendiente));

  // Si la última toma es de hace más de 24 h, igual la mostramos.
  const tomas = feedings.data?.length ? feedings.data : (ultimaToma.data ?? []);
  const enCurso = tomas.find((f) => !f.ended_at);
  const ultima = tomas[0];
  const promedio = intervaloPromedio(tomas);
  const sesiones = sesionesDeToma(tomas);
  const ultimaSesion = sesiones[sesiones.length - 1];
  // Con recordatorio activo manda el intervalo configurado; si no, el promedio del día.
  const intervalo = baby.feed_reminders ? baby.feed_interval_min : promedio;
  const proxima = intervalo && ultimaSesion ? new Date(ultimaSesion.getTime() + intervalo * 60000) : null;
  const avance = intervalo && ultimaSesion ? Math.min(100, ((now.getTime() - ultimaSesion.getTime()) / 60000 / intervalo) * 100) : 0;

  const panales = diapers.data ?? [];
  const panalesHoy = panales.filter((d) => new Date(d.changed_at) >= hoy);
  const suenos = sleeps.data ?? [];
  const durmiendo = suenos.find((s) => !s.ended_at);
  const vacunas = estadoVacunas(baby.birth_at, dosis.data ?? [], now);
  const proximaVacuna = vacunas.find((v) => v.estado !== "aplicada");
  const lista = avisos({ birthAt: baby.birth_at, feedings: tomas, diapers24: panales, primerPanal: primerPanal.data?.changed_at ?? null, vacunas, now });
  const pesoActual = peso.data?.weight_g ?? baby.birth_weight_g;

  return (
    <>
      <header className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[13px] font-medium text-muted">{fechaLarga(now)}</span>
          <h1 className="display text-[38px] leading-none">{baby.first_name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="chip">{edad(baby.birth_at, now)}</span>
            {pesoActual && <span className="chip">{(pesoActual / 1000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg</span>}
          </div>
        </div>
        <Link href="/ficha" aria-label="Ver ficha" className="display flex size-14 items-center justify-center rounded-full bg-soft text-2xl text-soft-ink">
          {baby.first_name.charAt(0)}
        </Link>
      </header>

      <div className="grid grid-cols-4 gap-2.5">
        {ACCIONES.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex h-[78px] flex-col items-center justify-center gap-1.5 rounded-[20px] text-sm font-semibold ${i === 0 ? "bg-accent text-on-accent" : "border border-line bg-surface text-ink"}`}
          >
            <Icon name={a.icon} size={24} />
            {a.label}
          </Link>
        ))}
      </div>

      {lista.map((a, i) => {
        const cuerpo = (
          <>
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{a.texto}</span>
          </>
        );
        return a.href ? (
          <Link key={i} href={a.href} className="flex items-start gap-2.5 rounded-[20px] bg-alert-bg px-4 py-3 text-[14px] leading-snug text-alert">{cuerpo}</Link>
        ) : (
          <p key={i} className="flex items-start gap-2.5 rounded-[20px] bg-alert-bg px-4 py-3 text-[14px] leading-snug text-alert">{cuerpo}</p>
        );
      })}

      {enCurso ? (
        <section className="card flex flex-col gap-3 border-accent/60 p-[18px]">
          <span className="eyebrow">Tomando ahora</span>
          <LiveTimer since={enCurso.started_at} className="display text-5xl leading-none" />
          <span className="text-[15px]">{ladoTexto(enCurso)} · desde las {hhmm(enCurso.started_at)}</span>
          <form action={terminarToma}>
            <input type="hidden" name="id" value={enCurso.id} />
            <button className="btn-primary">
              <Icon name="stop" size={20} /> Terminar toma
            </button>
          </form>
        </section>
      ) : (
        <Link href="/registrar/toma" className="card flex flex-col gap-3 p-[18px]">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Última toma</span>
            {ultima && <span className="text-[13px] text-muted">{hhmm(ultima.started_at)}</span>}
          </div>
          {ultima ? (
            <>
              <LiveDuration since={ultima.started_at} prefix="hace " inicial={haceCuanto(ultima.started_at, now)} className="display text-[32px] leading-none" />
              <span className="text-[15px]">{ladoTexto(ultima)}</span>
              {intervalo && proxima && (
                <div className="flex flex-col gap-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-soft">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${avance}%` }} />
                  </div>
                  <div className="flex justify-between text-[13px] text-muted">
                    <span>{baby.feed_reminders ? `Cada ${duracion(intervalo)}` : `Promedio: cada ${duracion(intervalo)}`}</span>
                    <span>Próx. ~{hhmm(proxima)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <span className="text-[15px] text-muted">Todavía no registraste ninguna toma. Tocá “Toma” para empezar.</span>
          )}
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/registro" className="card flex flex-col gap-1 p-4">
          <span className="label">Pañales hoy</span>
          <span className="display text-[30px] leading-tight">{panalesHoy.length}</span>
          <span className="text-[13px] text-muted">
            {panalesHoy.filter((d) => d.pee).length} pis · {panalesHoy.filter((d) => d.poop).length} caca
          </span>
        </Link>
        <div className="card flex flex-col gap-1 p-4">
          <span className="label">Sueño hoy</span>
          {durmiendo ? (
            <LiveDuration
              since={new Date(Math.max(new Date(durmiendo.started_at).getTime(), hoy.getTime())).toISOString()}
              extraMin={minutosDeSueno(suenos.filter((z) => z.ended_at), hoy, now)}
              inicial={duracion(minutosDeSueno(suenos, hoy, now))}
              className="display text-[30px] leading-tight"
            />
          ) : (
            <span className="display text-[30px] leading-tight">{duracion(minutosDeSueno(suenos, hoy, now))}</span>
          )}
          {durmiendo ? (
            <form action={terminarSueno} className="flex items-center justify-between gap-2">
              <input type="hidden" name="id" value={durmiendo.id} />
              <LiveDuration since={durmiendo.started_at} prefix="Duerme hace " inicial={`Duerme hace ${duracion((now.getTime() - new Date(durmiendo.started_at).getTime()) / 60000)}`} className="text-[13px] text-muted" />
              <button className="rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-on-accent">Despertó</button>
            </form>
          ) : (
            <form action={empezarSueno} className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-muted">Despierta</span>
              <button className="rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-ink">Se durmió</button>
            </form>
          )}
        </div>
      </div>

      {medsHoy.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow mt-1">Medicamentos de hoy</h2>
          {medsHoy.map(({ m }) => (
            <MedEstado key={m.id} med={m} doses={medicamentos.porMed(m.id)} nombres={medicamentos.nombres} compacto />
          ))}
        </section>
      )}

      <Link href={turno.data ? `/salud/turnos/${turno.data.id}` : "/salud/turnos/nuevo"} className="card flex items-center gap-3.5 px-4 py-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-soft text-soft-ink">
          <Icon name="cal" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          {turno.data ? (
            <>
              <span className="text-[15px] font-semibold">{turno.data.kind}</span>
              <span className="text-[13px] text-muted">
                {fechaCorta(turno.data.scheduled_at)} · {hhmm(turno.data.scheduled_at)}
                {turno.data.professional ? ` · ${turno.data.professional}` : ""}
              </span>
            </>
          ) : (
            <>
              <span className="text-[15px] font-semibold">Sin turnos próximos</span>
              <span className="text-[13px] text-muted">Agendá el próximo control</span>
            </>
          )}
        </span>
        <Icon name="chev" size={18} className="text-muted" />
      </Link>

      <Link href="/salud/vacunas" className="card flex items-center gap-3.5 px-4 py-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-soft text-soft-ink">
          <Icon name="syringe" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">
            {vacunas.some((v) => v.estado === "atrasada") ? "Vacunas atrasadas" : "Vacunas"}
          </span>
          <span className="text-[13px] text-muted">
            {proximaVacuna ? `Próxima: ${proximaVacuna.vacuna} · ${fechaCorta(proximaVacuna.fecha)}` : "Calendario completo"}
          </span>
        </span>
        <Icon name="chev" size={18} className="text-muted" />
      </Link>

      {!!preguntas.count && (
        <Link href="/salud#preguntas" className="card flex items-center gap-3.5 px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-soft text-soft-ink">
            <Icon name="note" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Para el pediatra</span>
            <span className="text-[13px] text-muted">
              {preguntas.count === 1 ? "1 pregunta anotada" : `${preguntas.count} preguntas anotadas`}
            </span>
          </span>
          <Icon name="chev" size={18} className="text-muted" />
        </Link>
      )}
    </>
  );
}
