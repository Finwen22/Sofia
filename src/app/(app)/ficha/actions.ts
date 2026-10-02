"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext, requireBaby } from "@/lib/session";
import { dec, num, oneOf, str, triBool, type ActionState } from "@/lib/forms";
import { fromLocalInput } from "@/lib/time";
import { sendPush } from "@/lib/push";
import { cookies } from "next/headers";
import { TEMAS } from "@/lib/temas";

export async function editarFicha(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const nombre = str(fd, "first_name");
  const fecha = str(fd, "birth_date");
  if (!nombre) return { error: "Falta el nombre." };
  if (!fecha) return { error: "Falta la fecha de nacimiento." };
  const birthAt = fromLocalInput(`${fecha}T${str(fd, "birth_time") ?? "12:00"}`);
  if (!birthAt || birthAt.getTime() > Date.now() + 60_000) return { error: "La fecha de nacimiento no es válida." };

  const { error } = await supabase
    .from("babies")
    .update({
      first_name: nombre,
      last_name: str(fd, "last_name"),
      sex: oneOf(str(fd, "sex"), ["femenino", "masculino"] as const),
      birth_at: birthAt.toISOString(),
      birth_weight_g: num(fd, "birth_weight_g"),
      birth_length_cm: dec(fd, "birth_length_cm"),
      birth_head_cm: dec(fd, "birth_head_cm"),
      gestation_weeks: num(fd, "gestation_weeks"),
      delivery_type: oneOf(str(fd, "delivery_type"), ["natural", "cesarea"] as const),
      birthplace: str(fd, "birthplace"),
      blood_type: str(fd, "blood_type"),
      neonatal_screening: triBool(fd, "neonatal_screening"),
      hearing_screening: triBool(fd, "hearing_screening"),
      allergies: str(fd, "allergies"),
      health_insurance: str(fd, "health_insurance"),
      insurance_number: str(fd, "insurance_number"),
      pediatrician_name: str(fd, "pediatrician_name"),
      pediatrician_phone: str(fd, "pediatrician_phone"),
      feeding_mode: oneOf(str(fd, "feeding_mode"), ["pecho", "mixta", "formula"] as const),
      notes: str(fd, "notes"),
    })
    .eq("id", baby.id);
  if (error) return { error: "No se pudo guardar. Revisá los datos (peso en gramos, talla en cm)." };
  revalidatePath("/", "layout");
  redirect("/ficha");
}

export async function invitar(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, member } = await getContext();
  if (member.role !== "admin") return { error: "Solo un admin puede invitar." };
  const email = str(fd, "email")?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Ese email no parece válido." };
  const role = oneOf(str(fd, "role"), ["admin", "miembro"] as const) ?? "miembro";
  const { error } = await supabase.from("invitations").insert({ family_id: member.family_id, email, role });
  if (error) return { error: error.code === "23505" ? "Ese email ya está invitado." : "No se pudo crear la invitación." };
  revalidatePath("/ficha/ajustes");
  return { ok: true };
}

export async function cancelarInvitacion(fd: FormData) {
  const { supabase, member } = await getContext();
  const id = str(fd, "id");
  if (id) await supabase.from("invitations").delete().eq("id", id).eq("family_id", member.family_id);
  revalidatePath("/ficha/ajustes");
}

export async function quitarMiembro(fd: FormData) {
  const { supabase, member, user } = await getContext();
  const uid = str(fd, "user_id");
  if (!uid || uid === user.id || member.role !== "admin") return;
  await supabase.from("family_members").delete().eq("family_id", member.family_id).eq("user_id", uid);
  revalidatePath("/ficha/ajustes");
}

export async function cambiarMiNombre(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, member, user } = await getContext();
  const nombre = str(fd, "display_name");
  if (!nombre) return { error: "Escribí tu nombre." };
  const { error } = await supabase.from("family_members").update({ display_name: nombre }).eq("family_id", member.family_id).eq("user_id", user.id);
  if (error) return { error: "No se pudo guardar." };
  revalidatePath("/ficha/ajustes");
  return { ok: true };
}

export async function guardarRecordatorio(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const intervalo = (num(fd, "horas") ?? 0) * 60 + (num(fd, "minutos") ?? 0);
  const antes = num(fd, "antes") ?? 30;
  if (intervalo < 30 || intervalo > 720) return { error: "El intervalo tiene que estar entre 30 minutos y 12 horas." };
  if (antes < 0 || antes >= intervalo) return { error: "El aviso tiene que ser antes de que se cumpla el intervalo." };
  const { error } = await supabase
    .from("babies")
    .update({ feed_reminders: fd.get("activo") === "on", feed_interval_min: intervalo, feed_reminder_lead_min: antes })
    .eq("id", baby.id);
  if (error) return { error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

type SubJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function suscribirPush(sub: SubJSON): Promise<ActionState> {
  const { supabase, member, user } = await getContext();
  const endpoint = sub.endpoint;
  const p256dh = sub.keys?.p256dh;
  const auth = sub.keys?.auth;
  if (!endpoint?.startsWith("https://") || !p256dh || !auth) return { error: "Suscripción inválida." };
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ family_id: member.family_id, user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });
  if (error) return { error: "No se pudo activar en este celular." };
  return { ok: true };
}

export async function desuscribirPush(endpoint: string): Promise<void> {
  const { supabase } = await getContext();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function probarPush(): Promise<ActionState> {
  const { supabase, user } = await getContext();
  const { data } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user.id);
  if (!data?.length) return { error: "Este usuario no tiene celulares con notificaciones activadas." };
  const gone = await sendPush(data, { title: "Sofía", body: "Así te va a llegar el aviso de la próxima toma.", url: "/", tag: "prueba" });
  if (gone.length) await supabase.from("push_subscriptions").delete().in("endpoint", gone);
  return gone.length === data.length ? { error: "El celular dio de baja las notificaciones. Volvé a activarlas." } : { ok: true };
}

/** Color de la app: es de cada persona (no de la familia). */
export async function guardarTema(tema: string): Promise<ActionState> {
  const { supabase, member, user } = await getContext();
  if (!TEMAS.some((t) => t.code === tema)) return { error: "Ese color no existe." };
  const { error } = await supabase.from("family_members").update({ theme: tema }).eq("family_id", member.family_id).eq("user_id", user.id);
  if (error) return { error: "No se pudo guardar el color." };
  (await cookies()).set("tema", tema, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return { ok: true };
}
