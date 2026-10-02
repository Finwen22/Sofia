"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaby } from "@/lib/session";
import { bool, dec, num, oneOf, str, when, type ActionState } from "@/lib/forms";
import { COLORES, CONSISTENCIAS } from "@/lib/panal";
import { hhmm, toDateInput } from "@/lib/time";
import { METODOS, SINTOMAS, formatoTemp } from "@/lib/sintomas";

const LADOS = ["izquierdo", "derecho", "ambos"] as const;

function listo(volverA = "/") {
  revalidatePath("/", "layout");
  redirect(volverA);
}

type Supa = Awaited<ReturnType<typeof requireBaby>>["supabase"];

/**
 * Si estaba durmiendo, una toma o un cambio de pañal casi siempre la despierta:
 * se cierra el sueño a esa hora. El inicio ofrece "Sigue durmiendo" para
 * deshacerlo (toma dormida, cambio de noche). Devuelve a dónde volver.
 */
async function cortarSueno(supabase: Supa, babyId: string, at: Date, motivo: "toma" | "panal") {
  const { data } = await supabase
    .from("sleeps")
    .update({ ended_at: at.toISOString() })
    .eq("baby_id", babyId)
    .is("ended_at", null)
    .lte("started_at", at.toISOString())
    .select("id");
  return data?.length ? `/?sueno=${data[0].id}&por=${motivo}` : "/";
}

/** Al editar, vuelve al día del registro en la línea de tiempo. */
function alDia(d: Date) {
  return `/registro?dia=${toDateInput(d)}`;
}

/** Pecho con cronómetro: arranca ahora, se termina desde el inicio. */
export async function empezarToma(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const side = oneOf(str(fd, "side"), LADOS);
  // Si había otra toma abierta, se cierra ahora (cambio de pecho).
  await supabase.from("feedings").update({ ended_at: new Date().toISOString() }).eq("baby_id", baby.id).is("ended_at", null);
  await supabase.from("feedings").insert({ family_id: baby.family_id, baby_id: baby.id, kind: "pecho", side });
  listo(await cortarSueno(supabase, baby.id, new Date(), "toma"));
}

export async function terminarToma(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("feedings").update({ ended_at: new Date().toISOString() }).eq("id", id).eq("baby_id", baby.id).is("ended_at", null);
  listo();
}

export async function guardarToma(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const kind = oneOf(str(fd, "kind"), ["pecho", "mamadera"] as const);
  if (!kind) return { error: "Elegí pecho o mamadera." };
  const start = when(fd, "started_at");
  if (start.getTime() > Date.now() + 60_000) return { error: "La hora no puede ser futura." };

  const row: Record<string, unknown> = { family_id: baby.family_id, baby_id: baby.id, kind, started_at: start.toISOString(), notes: str(fd, "notes") };
  if (kind === "pecho") {
    const min = num(fd, "minutes");
    row.side = oneOf(str(fd, "side"), LADOS);
    row.ended_at = new Date(start.getTime() + (min ?? 0) * 60000).toISOString();
  } else {
    const ml = num(fd, "amount_ml");
    if (!ml || ml < 1 || ml > 400) return { error: "Cargá cuántos ml tomó." };
    row.amount_ml = ml;
    row.milk = oneOf(str(fd, "milk"), ["materna", "formula"] as const);
    row.ended_at = start.toISOString();
  }
  const { error } = await supabase.from("feedings").insert(row);
  if (error) return { error: "No se pudo guardar la toma." };
  listo(await cortarSueno(supabase, baby.id, start, "toma"));
}

export async function guardarPanal(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const pee = bool(fd, "pee");
  const poop = bool(fd, "poop");
  if (!pee && !poop) return { error: "Marcá si tenía pis, caca o las dos." };
  const photo = str(fd, "photo_path");
  if (photo && !photo.startsWith(`${baby.family_id}/`)) return { error: "La foto no es válida." };

  const id = str(fd, "id");
  const changedAt = when(fd, "changed_at");
  const row = {
    changed_at: changedAt.toISOString(),
    pee,
    poop,
    poop_color: poop ? oneOf(str(fd, "poop_color"), COLORES.map((c) => c.code)) : null,
    consistency: poop ? oneOf(str(fd, "consistency"), CONSISTENCIAS.map((c) => c.code)) : null,
    notes: str(fd, "notes"),
  };

  if (!id) {
    const { error } = await supabase.from("diapers").insert({ ...row, family_id: baby.family_id, baby_id: baby.id, photo_path: photo });
    if (error) return { error: "No se pudo guardar el pañal." };
    listo(await cortarSueno(supabase, baby.id, changedAt, "panal"));
  }

  // Edición: foto nueva reemplaza a la anterior; "quitar foto" la borra.
  const { data: actual } = await supabase.from("diapers").select("photo_path").eq("id", id).eq("baby_id", baby.id).maybeSingle();
  if (!actual) return { error: "Ese pañal ya no existe." };
  const quitar = bool(fd, "quitar_foto");
  const photo_path = photo ?? (quitar ? null : actual.photo_path);
  const { error } = await supabase.from("diapers").update({ ...row, photo_path }).eq("id", id).eq("baby_id", baby.id);
  if (error) return { error: "No se pudo guardar el pañal." };
  if (actual.photo_path && actual.photo_path !== photo_path) await supabase.storage.from("fotos").remove([actual.photo_path]);
  listo(alDia(changedAt));
}

export async function empezarSueno() {
  const { supabase, baby } = await requireBaby();
  const { data: abierto } = await supabase.from("sleeps").select("id").eq("baby_id", baby.id).is("ended_at", null).limit(1);
  if (!abierto?.length) await supabase.from("sleeps").insert({ family_id: baby.family_id, baby_id: baby.id });
  listo();
}

export async function terminarSueno(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("sleeps").update({ ended_at: new Date().toISOString() }).eq("id", id).eq("baby_id", baby.id).is("ended_at", null);
  listo();
}

export async function guardarSueno(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const start = when(fd, "started_at");
  const end = when(fd, "ended_at");
  if (end <= start) return { error: "La hora en que se despertó tiene que ser posterior." };
  if (end.getTime() > Date.now() + 60_000) return { error: "La hora no puede ser futura." };
  const { error } = await supabase.from("sleeps").insert({
    family_id: baby.family_id, baby_id: baby.id, started_at: start.toISOString(), ended_at: end.toISOString(), notes: str(fd, "notes"),
  });
  if (error) return { error: "No se pudo guardar." };
  listo();
}

export async function guardarNota(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const body = str(fd, "body");
  if (!body) return { error: "Escribí la nota." };
  const { error } = await supabase.from("notes").insert({
    family_id: baby.family_id, baby_id: baby.id, body, for_doctor: bool(fd, "for_doctor"),
  });
  if (error) return { error: "No se pudo guardar la nota." };
  listo();
}

const BORRABLES = ["feedings", "diapers", "sleeps", "notes", "health_logs"] as const;

export async function borrarRegistro(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const tabla = oneOf(str(fd, "tabla"), BORRABLES);
  const id = str(fd, "id");
  if (!tabla || !id) return;
  if (tabla === "diapers") {
    const { data } = await supabase.from("diapers").select("photo_path").eq("id", id).maybeSingle();
    if (data?.photo_path) await supabase.storage.from("fotos").remove([data.photo_path]);
  }
  await supabase.from(tabla).delete().eq("id", id).eq("baby_id", baby.id);
  revalidatePath("/", "layout");
}

export async function editarToma(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  const { data: t } = await supabase.from("feedings").select("kind, ended_at").eq("id", id ?? "").eq("baby_id", baby.id).maybeSingle();
  if (!id || !t) return { error: "Esa toma ya no existe." };
  const start = when(fd, "started_at");
  if (start.getTime() > Date.now() + 60_000) return { error: "La hora no puede ser futura." };
  const row: Record<string, unknown> = { started_at: start.toISOString(), notes: str(fd, "notes") };
  if (t.kind === "pecho") {
    row.side = oneOf(str(fd, "side"), LADOS);
    const min = num(fd, "minutes");
    // Una toma en curso sigue en curso si no le pusieron duración.
    row.ended_at = min === null && !t.ended_at ? null : new Date(start.getTime() + (min ?? 0) * 60000).toISOString();
  } else {
    const ml = num(fd, "amount_ml");
    if (!ml || ml < 1 || ml > 400) return { error: "Cargá cuántos ml tomó." };
    row.amount_ml = ml;
    row.milk = oneOf(str(fd, "milk"), ["materna", "formula"] as const);
    row.ended_at = start.toISOString();
  }
  const { error } = await supabase.from("feedings").update(row).eq("id", id).eq("baby_id", baby.id);
  if (error) return { error: "No se pudo guardar." };
  listo(alDia(start));
}

export async function editarSueno(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (!id) return { error: "Falta el registro." };
  const start = when(fd, "started_at");
  const fin = str(fd, "ended_at");
  const end = fin ? when(fd, "ended_at") : null;
  if (end && end <= start) return { error: "La hora en que se despertó tiene que ser posterior." };
  const { error } = await supabase
    .from("sleeps")
    .update({ started_at: start.toISOString(), ended_at: end?.toISOString() ?? null })
    .eq("id", id)
    .eq("baby_id", baby.id);
  if (error) return { error: "No se pudo guardar." };
  listo(alDia(start));
}

export async function editarNota(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  const body = str(fd, "body");
  if (!id) return { error: "Falta el registro." };
  if (!body) return { error: "Escribí la nota." };
  const { data, error } = await supabase
    .from("notes")
    .update({ body, for_doctor: bool(fd, "for_doctor") })
    .eq("id", id)
    .eq("baby_id", baby.id)
    .select("created_at")
    .maybeSingle();
  if (error || !data) return { error: "No se pudo guardar." };
  listo(alDia(new Date(data.created_at)));
}

/** Deshace el corte automático: el sueño sigue en curso. */
export async function sigueDurmiendo(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) {
    const { data: abierto } = await supabase.from("sleeps").select("id").eq("baby_id", baby.id).is("ended_at", null).limit(1);
    if (!abierto?.length) await supabase.from("sleeps").update({ ended_at: null }).eq("id", id).eq("baby_id", baby.id);
  }
  listo();
}

/** Temperatura y/o síntomas. Opcional: recordatorio para volver a medir. */
export async function guardarSalud(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  const observed = when(fd, "observed_at");
  if (observed.getTime() > Date.now() + 60_000) return { error: "La hora no puede ser futura." };
  const temp = dec(fd, "temperature_c");
  if (temp !== null && (temp < 34 || temp > 43)) return { error: "Revisá la temperatura (ej.: 37,8)." };
  const symptoms = fd.getAll("symptoms").map(String).filter((c) => SINTOMAS.some((x) => x.code === c));
  const notes = str(fd, "notes");
  if (temp === null && !symptoms.length && !notes) return { error: "Cargá la temperatura o marcá algún síntoma." };

  const row = {
    observed_at: observed.toISOString(),
    temperature_c: temp,
    method: temp === null ? null : oneOf(str(fd, "method"), METODOS.map((m) => m.code)),
    symptoms,
    notes,
  };
  const { error } = id
    ? await supabase.from("health_logs").update(row).eq("id", id).eq("baby_id", baby.id)
    : await supabase.from("health_logs").insert({ ...row, family_id: baby.family_id, baby_id: baby.id });
  if (error) return { error: "No se pudo guardar." };

  const remedir = num(fd, "remedir");
  if (!id && remedir && remedir > 0 && remedir <= 240) {
    await supabase.from("one_off_reminders").insert({
      family_id: baby.family_id,
      due_at: new Date(Date.now() + remedir * 60000).toISOString(),
      title: `Volvé a tomarle la temperatura a ${baby.first_name}`,
      body: temp !== null ? `La última fue ${formatoTemp(temp)} a las ${hhmm(observed)}.` : "Para ver cómo sigue.",
      url: "/registrar/temperatura",
    });
  }
  listo(id ? alDia(observed) : "/");
}
