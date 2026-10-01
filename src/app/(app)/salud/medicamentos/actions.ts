"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaby } from "@/lib/session";
import { bool, dec, oneOf, str, when, type ActionState } from "@/lib/forms";
import { avisoDosisReciente } from "@/lib/medicamentos";
import type { Medication, MedicationDose } from "@/lib/types";

const KINDS = ["diaria", "intervalo", "si_hace_falta"] as const;

export async function guardarMedicamento(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const kind = oneOf(str(fd, "kind"), KINDS);
  if (!name) return { error: "Poné el nombre del medicamento." };
  if (!kind) return { error: "Elegí cada cuánto se da." };

  const times = [...new Set(fd.getAll("times").map(String).filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort();
  const horas = dec(fd, "interval_hours");
  if (kind === "diaria" && !times.length) return { error: "Agregá al menos un horario." };
  if (kind === "intervalo" && (!horas || horas < 1 || horas > 72)) return { error: "Poné cada cuántas horas (entre 1 y 72)." };
  if (kind === "si_hace_falta" && horas !== null && (horas < 1 || horas > 72)) return { error: "El mínimo entre dosis tiene que estar entre 1 y 72 horas." };

  const starts = str(fd, "starts_on");
  const ends = str(fd, "ends_on");
  if (starts && ends && ends < starts) return { error: "La fecha de fin no puede ser anterior al inicio." };

  const row = {
    name,
    dose: str(fd, "dose"),
    kind,
    times: kind === "diaria" ? times : [],
    interval_hours: kind === "diaria" ? null : horas,
    ends_on: ends,
    reminders: kind !== "si_hace_falta" && bool(fd, "reminders"),
    prescribed_by: str(fd, "prescribed_by"),
    notes: str(fd, "notes"),
    ...(starts ? { starts_on: starts } : {}),
  };
  const { error } = id
    ? await supabase.from("medications").update(row).eq("id", id).eq("baby_id", baby.id)
    : await supabase.from("medications").insert({ ...row, family_id: baby.family_id, baby_id: baby.id, active: true });
  if (error) return { error: "No se pudo guardar el medicamento." };
  revalidatePath("/", "layout");
  redirect("/salud/medicamentos");
}

/** Registra una dosis. Si hubo otra muy reciente, primero pide confirmación. */
export async function darDosis(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const medId = str(fd, "medication_id");
  const forzar = str(fd, "forzar") === "1";
  const givenAt = when(fd, "given_at");
  if (givenAt.getTime() > Date.now() + 60_000) return { error: "La hora no puede ser futura." };

  const [{ data: med }, { data: doses }, { data: miembros }] = await Promise.all([
    supabase.from("medications").select("*").eq("id", medId ?? "").eq("baby_id", baby.id).maybeSingle<Medication>(),
    supabase.from("medication_doses").select("*").eq("medication_id", medId ?? "").order("given_at", { ascending: false }).limit(1).returns<MedicationDose[]>(),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", baby.family_id),
  ]);
  if (!med) return { error: "Ese medicamento ya no existe." };

  if (!forzar) {
    const nombres = Object.fromEntries((miembros ?? []).map((m) => [m.user_id, m.display_name]));
    const aviso = avisoDosisReciente(med, doses ?? [], nombres, givenAt);
    if (aviso) return { aviso };
  }

  const { error } = await supabase.from("medication_doses").insert({
    family_id: baby.family_id, baby_id: baby.id, medication_id: med.id, given_at: givenAt.toISOString(), notes: str(fd, "notes"),
  });
  if (error) return { error: "No se pudo registrar la dosis." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function borrarDosis(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("medication_doses").delete().eq("id", id).eq("baby_id", baby.id);
  revalidatePath("/", "layout");
}

export async function cambiarActivo(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("medications").update({ active: str(fd, "active") === "1" }).eq("id", id).eq("baby_id", baby.id);
  revalidatePath("/", "layout");
  redirect("/salud/medicamentos");
}

export async function borrarMedicamento(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("medications").delete().eq("id", id).eq("baby_id", baby.id);
  revalidatePath("/", "layout");
  redirect("/salud/medicamentos");
}
