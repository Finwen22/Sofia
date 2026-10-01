"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { str, type ActionState } from "@/lib/forms";

export async function ingresar(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email || !password) return { error: "Completá email y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/");
}

export async function registrarse(_: ActionState, fd: FormData): Promise<ActionState> {
  const nombre = str(fd, "nombre");
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!nombre || !email || !password) return { error: "Completá todos los campos." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: nombre }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    if (error.message.toLowerCase().includes("registered")) return { error: "Ese email ya tiene cuenta. Probá ingresar." };
    return { error: "No pudimos crear la cuenta. Probá de nuevo en un rato." };
  }
  if (!data.session) {
    return { ok: true };
  }
  redirect("/");
}

export async function salir() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}

export async function recuperar(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email");
  if (!email) return { error: "Poné tu email." };
  // Flujo "implicit": el link trae la sesión en el #fragmento y funciona aunque
  // el mail se abra en otro navegador (en iPhone, la app instalada y Safari
  // no comparten cookies). Lo toma /auth/callback.
  const supabase = createJsClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: "implicit", persistSession: false } });
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback` });
  // Por seguridad no decimos si el email existe o no.
  if (error && error.status === 429) return { error: "Supabase ya mandó demasiados mails esta hora. Probá de nuevo en una hora." };
  return { ok: true };
}

export async function nuevaClave(_: ActionState, fd: FormData): Promise<ActionState> {
  const password = str(fd, "password");
  if (!password || password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== str(fd, "password2")) return { error: "Las dos contraseñas no coinciden." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo cambiar. Pedí un link nuevo e intentá otra vez." };
  redirect("/");
}
