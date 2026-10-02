"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaby } from "@/lib/session";
import { bool, dec, num, str, when, type ActionState } from "@/lib/forms";
import { CALENDARIO } from "@/lib/vacunas";
import { toDateInput } from "@/lib/time";

function volver(to = "/salud") {
  revalidatePath("/", "layout");
  redirect(to);
}

export async function guardarTurno(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  const kind = str(fd, "kind");
  const fecha = str(fd, "scheduled_at");
  if (!kind) return { error: "Poné qué turno es (ej.: control pediátrico)." };
  if (!fecha) return { error: "Falta la fecha y hora." };
  const row = {
    scheduled_at: when(fd, "scheduled_at").toISOString(),
    kind,
    professional: str(fd, "professional"),
    place: str(fd, "place"),
    notes: str(fd, "notes"),
    outcome: str(fd, "outcome"),
    done: bool(fd, "done"),
  };
  const { error } = id
    ? await supabase.from("appointments").update(row).eq("id", id).eq("baby_id", baby.id)
    : await supabase.from("appointments").insert({ ...row, family_id: baby.family_id, baby_id: baby.id });
  if (error) return { error: "No se pudo guardar el turno." };

  // Si en el control la pesaron o midieron, queda en crecimiento.
  const peso = num(fd, "weight_g");
  const talla = dec(fd, "length_cm");
  const pc = dec(fd, "head_cm");
  if (row.done && (peso || talla || pc)) {
    await supabase.from("growth_records").insert({
      family_id: baby.family_id, baby_id: baby.id, measured_on: toDateInput(new Date(row.scheduled_at)),
      weight_g: peso, length_cm: talla, head_cm: pc, notes: kind,
    });
  }
  volver();
}

export async function borrarTurno(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("appointments").delete().eq("id", id).eq("baby_id", baby.id);
  volver();
}

export async function aplicarVacuna(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const code = str(fd, "vaccine_code");
  const fecha = str(fd, "applied_on");
  if (!code || !CALENDARIO.some((d) => d.code === code)) return { error: "Vacuna desconocida." };
  if (!fecha) return { error: "Poné la fecha en que se aplicó." };
  const { error } = await supabase.from("vaccine_doses").upsert(
    { family_id: baby.family_id, baby_id: baby.id, vaccine_code: code, applied_on: fecha, lot: str(fd, "lot"), place: str(fd, "place") },
    { onConflict: "baby_id,vaccine_code" },
  );
  if (error) return { error: "No se pudo guardar." };
  volver("/salud/vacunas");
}

export async function desmarcarVacuna(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const code = str(fd, "vaccine_code");
  if (code) await supabase.from("vaccine_doses").delete().eq("baby_id", baby.id).eq("vaccine_code", code);
  volver("/salud/vacunas");
}

export async function guardarMedida(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const fecha = str(fd, "measured_on");
  const peso = num(fd, "weight_g");
  const talla = dec(fd, "length_cm");
  const pc = dec(fd, "head_cm");
  if (!fecha) return { error: "Falta la fecha." };
  if (!peso && !talla && !pc) return { error: "Cargá al menos una medida." };
  const { error } = await supabase.from("growth_records").insert({
    family_id: baby.family_id, baby_id: baby.id, measured_on: fecha, weight_g: peso, length_cm: talla, head_cm: pc, notes: str(fd, "notes"),
  });
  if (error) return { error: "Revisá las medidas: peso en gramos (ej. 4250), talla y perímetro en cm." };
  volver("/salud/crecimiento");
}

export async function borrarMedida(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("growth_records").delete().eq("id", id).eq("baby_id", baby.id);
  revalidatePath("/salud");
}

export async function resolverPregunta(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (id) await supabase.from("notes").update({ resolved: true }).eq("id", id).eq("baby_id", baby.id);
  revalidatePath("/", "layout");
}
