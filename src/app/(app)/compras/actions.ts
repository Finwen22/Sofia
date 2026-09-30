"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/session";
import { oneOf, str, type ActionState } from "@/lib/forms";
import { CATEGORIAS } from "./categorias";

export async function agregarItem(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, member } = await getContext();
  const name = str(fd, "name");
  if (!name) return { error: "Escribí qué hay que comprar." };
  const { error } = await supabase.from("shopping_items").insert({
    family_id: member.family_id,
    name,
    quantity: str(fd, "quantity"),
    category: oneOf(str(fd, "category"), CATEGORIAS.map((c) => c.code)) ?? "otros",
  });
  if (error) return { error: "No se pudo agregar." };
  revalidatePath("/compras");
  return { ok: true };
}

export async function marcarItem(fd: FormData) {
  const { supabase, member } = await getContext();
  const id = str(fd, "id");
  const done = str(fd, "done") === "1";
  if (!id) return;
  await supabase.from("shopping_items").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", id).eq("family_id", member.family_id);
  revalidatePath("/compras");
}

export async function borrarComprados() {
  const { supabase, member } = await getContext();
  await supabase.from("shopping_items").delete().eq("family_id", member.family_id).eq("done", true);
  revalidatePath("/compras");
}

export async function borrarItem(fd: FormData) {
  const { supabase, member } = await getContext();
  const id = str(fd, "id");
  if (id) await supabase.from("shopping_items").delete().eq("id", id).eq("family_id", member.family_id);
  revalidatePath("/compras");
}
