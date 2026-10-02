import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { color, CONSISTENCIAS } from "@/lib/panal";
import { duracionToma, minutosDeSueno } from "@/lib/resumen";
import { duracion, fechaLarga, hhmm, toDateInput } from "@/lib/time";
import type { Diaper, Feeding, Note, Sleep, HealthLog } from "@/lib/types";
import { etiquetaSintoma, formatoTemp } from "@/lib/sintomas";
import { borrarRegistro } from "../registrar/actions";
import { DeleteButton } from "@/components/DeleteButton";

export const metadata = { title: "Registro · Sofía" };

const SLUG: Record<string, string> = { feedings: "toma", diapers: "panal", sleeps: "sueno", notes: "nota", health_logs: "salud" };

type Item = { at: string; tabla: string; id: string; icon: IconName; titulo: string; detalle?: string; foto?: string | null };

function sumarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00-03:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateInput(d);
}

export default async function Page({ searchParams }: PageProps<"/registro">) {
  const { supabase, baby } = await requireBaby();
  const { dia: diaParam } = await searchParams;
  const hoy = toDateInput();
  const dia = typeof diaParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) && diaParam <= hoy ? diaParam : hoy;
  const desde = new Date(`${dia}T00:00:00-03:00`);
  const hasta = new Date(`${sumarDias(dia, 1)}T00:00:00-03:00`);

  const [f, d, s, n, h] = await Promise.all([
    supabase.from("feedings").select("*").eq("baby_id", baby.id).gte("started_at", desde.toISOString()).lt("started_at", hasta.toISOString()).returns<Feeding[]>(),
    supabase.from("diapers").select("*").eq("baby_id", baby.id).gte("changed_at", desde.toISOString()).lt("changed_at", hasta.toISOString()).returns<Diaper[]>(),
    supabase.from("sleeps").select("*").eq("baby_id", baby.id).lt("started_at", hasta.toISOString()).or(`ended_at.is.null,ended_at.gte.${desde.toISOString()}`).returns<Sleep[]>(),
    supabase.from("notes").select("*").eq("baby_id", baby.id).gte("created_at", desde.toISOString()).lt("created_at", hasta.toISOString()).returns<Note[]>(),
    supabase.from("health_logs").select("*").eq("baby_id", baby.id).gte("observed_at", desde.toISOString()).lt("observed_at", hasta.toISOString()).returns<HealthLog[]>(),
  ]);
  const tomas = f.data ?? [];
  const panales = d.data ?? [];
  const suenos = s.data ?? [];
  const notas = n.data ?? [];

  const conFoto = panales.filter((p) => p.photo_path).map((p) => p.photo_path!);
  const firmadas = conFoto.length ? (await supabase.storage.from("fotos").createSignedUrls(conFoto, 3600)).data ?? [] : [];
  const urlDe = (path: string | null) => firmadas.find((x) => x.path === path)?.signedUrl ?? null;

  const items: Item[] = [
    ...tomas.map((t) => ({
      at: t.started_at, tabla: "feedings", id: t.id, icon: "bottle" as const,
      titulo: t.kind === "mamadera" ? `Mamadera · ${t.amount_ml} ml` : `Pecho ${t.side ?? ""}`.trim(),
      detalle: [
        t.kind === "pecho" ? (t.ended_at ? duracion(duracionToma(t)) : "en curso") : t.milk === "formula" ? "Fórmula" : t.milk === "materna" ? "Leche materna" : null,
        t.notes,
      ].filter(Boolean).join(" · "),
    })),
    ...panales.map((p) => ({
      at: p.changed_at, tabla: "diapers", id: p.id, icon: "diaper" as const,
      titulo: `Pañal · ${[p.pee && "pis", p.poop && "caca"].filter(Boolean).join(" y ")}`,
      detalle: [color(p.poop_color)?.label, CONSISTENCIAS.find((c) => c.code === p.consistency)?.label, p.notes].filter(Boolean).join(" · "),
      foto: urlDe(p.photo_path),
    })),
    ...suenos.map((z) => ({
      at: z.started_at, tabla: "sleeps", id: z.id, icon: "moon" as const,
      titulo: z.ended_at ? `Durmió ${duracion((new Date(z.ended_at).getTime() - new Date(z.started_at).getTime()) / 60000)}` : "Durmiendo",
      detalle: z.ended_at ? `Hasta las ${hhmm(z.ended_at)}` : undefined,
    })),
    ...(h.data ?? []).map((x) => ({
      at: x.observed_at, tabla: "health_logs", id: x.id, icon: "thermo" as const,
      titulo: x.temperature_c !== null ? `Temperatura ${formatoTemp(x.temperature_c)}` : "Síntomas",
      detalle: [x.symptoms.map(etiquetaSintoma).join(", "), x.notes].filter(Boolean).join(" · "),
    })),
    ...notas.map((x) => ({
      at: x.created_at, tabla: "notes", id: x.id, icon: "note" as const,
      titulo: x.for_doctor ? "Pregunta para el pediatra" : "Nota", detalle: x.body,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const ml = tomas.reduce((acc, t) => acc + (t.amount_ml ?? 0), 0);
  const minPecho = tomas.filter((t) => t.kind === "pecho" && t.ended_at).reduce((acc, t) => acc + duracionToma(t), 0);
  const sueno = minutosDeSueno(suenos, desde, new Date(Math.min(hasta.getTime(), new Date().getTime())));

  return (
    <>
      <PageHeader eyebrow="Registro" title={dia === hoy ? "Hoy" : fechaLarga(desde)} />
      <p className="-mt-2 text-[13px] text-faint">Tocá un registro para corregirlo.</p>

      <div className="flex items-center gap-2">
        <Link href={`/registro?dia=${sumarDias(dia, -1)}`} aria-label="Día anterior" className="flex size-11 items-center justify-center rounded-2xl border border-line bg-surface">
          <Icon name="back" size={20} />
        </Link>
        <span className="flex-1 text-center text-[15px] font-semibold text-muted">{fechaLarga(desde)}</span>
        {dia < hoy ? (
          <Link href={`/registro?dia=${sumarDias(dia, 1)}`} aria-label="Día siguiente" className="flex size-11 items-center justify-center rounded-2xl border border-line bg-surface">
            <Icon name="chev" size={20} />
          </Link>
        ) : (
          <span className="size-11" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card flex flex-col gap-0.5 p-3">
          <span className="label">Tomas</span>
          <span className="display text-2xl">{tomas.length}</span>
          <span className="text-[12px] text-muted">{[minPecho ? `${duracion(minPecho)} pecho` : null, ml ? `${ml} ml` : null].filter(Boolean).join(" · ") || "—"}</span>
        </div>
        <div className="card flex flex-col gap-0.5 p-3">
          <span className="label">Pañales</span>
          <span className="display text-2xl">{panales.length}</span>
          <span className="text-[12px] text-muted">{panales.filter((p) => p.pee).length} pis · {panales.filter((p) => p.poop).length} caca</span>
        </div>
        <div className="card flex flex-col gap-0.5 p-3">
          <span className="label">Sueño</span>
          <span className="display text-2xl">{duracion(sueno)}</span>
          <span className="text-[12px] text-muted">{suenos.length} siestas</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-muted">No hay nada registrado este día.</p>
      ) : (
        <ol className="flex flex-col">
          {items.map((it) => (
            <li key={`${it.tabla}-${it.id}`} className="flex gap-3 border-b border-line py-3.5 last:border-0">
              <span className="w-12 shrink-0 pt-0.5 text-[14px] font-semibold text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>{hhmm(it.at)}</span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft text-soft-ink">
                <Icon name={it.icon} size={18} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/registro/${SLUG[it.tabla]}/${it.id}`} className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">{it.titulo}</span>
                  {it.detalle && <span className="text-[14px] leading-snug text-muted">{it.detalle}</span>}
                </Link>
                {it.foto && (
                  <a href={it.foto} target="_blank" rel="noreferrer" className="mt-1 block w-28 overflow-hidden rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.foto} alt="Foto del pañal" className="aspect-square w-full object-cover" />
                  </a>
                )}
              </div>
              <DeleteButton action={borrarRegistro} fields={{ tabla: it.tabla, id: it.id }} pregunta="¿Borrar este registro?" />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
