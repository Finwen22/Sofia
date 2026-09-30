"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: nombre } },
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
