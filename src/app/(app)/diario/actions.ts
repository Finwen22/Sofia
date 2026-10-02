"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaby } from "@/lib/session";
import { str, type ActionState } from "@/lib/forms";
import { etiquetaHito, HITOS, MAX_FOTOS } from "@/lib/hitos";
import { toDateInput } from "@/lib/time";

export async function guardarRecuerdo(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  const hito = str(fd, "milestone");
  const milestone = hito && HITOS.some((h) => h.code === hito) ? hito : null;
  const title = str(fd, "title") ?? etiquetaHito(milestone);
  const fecha = str(fd, "happened_on");
  if (!title) return { error: "Ponele un título al recuerdo." };
  if (!fecha) return { error: "Falta la fecha." };
  if (fecha > toDateInput()) return { error: "La fecha no puede ser futura." };
  if (fecha < toDateInput(new Date(baby.birth_at))) return { error: "La fecha no puede ser anterior al nacimiento." };

  const nuevas = fd.getAll("photo_paths").map(String).filter((p) => p.startsWith(`${baby.family_id}/diario/`));
  const quitar = fd.getAll("quitar_fotos").map(String);
  const row = { happened_on: fecha, milestone, title, body: str(fd, "body") };

  let entryId = id;
  if (id) {
    const { error } = await supabase.from("diary_entries").update(row).eq("id", id).eq("baby_id", baby.id);
    if (error) return { error: error.code === "23505" ? "Esa primera vez ya está en el diario." : "No se pudo guardar." };
  } else {
    const { data, error } = await supabase.from("diary_entries").insert({ ...row, family_id: baby.family_id, baby_id: baby.id }).select("id").single();
    if (error || !data) {
      if (nuevas.length) await supabase.storage.from("fotos").remove(nuevas);
      return { error: error?.code === "23505" ? "Esa primera vez ya está en el diario." : "No se pudo guardar." };
    }
    entryId = data.id;
  }

  // Fotos: se borran las que sacaron y se suman las nuevas, hasta el máximo.
  if (quitar.length && id) {
    const { data: borradas } = await supabase.from("diary_photos").delete().eq("entry_id", id).in("id", quitar).select("path");
    if (borradas?.length) await supabase.storage.from("fotos").remove(borradas.map((b) => b.path));
  }
  if (nuevas.length) {
    const { count } = await supabase.from("diary_photos").select("id", { count: "exact", head: true }).eq("entry_id", entryId!);
    const lugar = Math.max(0, MAX_FOTOS - (count ?? 0));
    const entran = nuevas.slice(0, lugar);
    const sobran = nuevas.slice(lugar);
    if (entran.length) {
      await supabase.from("diary_photos").insert(entran.map((path, i) => ({ family_id: baby.family_id, entry_id: entryId, path, position: (count ?? 0) + i })));
    }
    if (sobran.length) await supabase.storage.from("fotos").remove(sobran);
  }

  revalidatePath("/", "layout");
  redirect(`/diario/${entryId}`);
}

export async function borrarRecuerdo(fd: FormData) {
  const { supabase, baby } = await requireBaby();
  const id = str(fd, "id");
  if (!id) return;
  const { data: fotos } = await supabase.from("diary_photos").select("path").eq("entry_id", id);
  await supabase.from("diary_entries").delete().eq("id", id).eq("baby_id", baby.id);
  if (fotos?.length) await supabase.storage.from("fotos").remove(fotos.map((f) => f.path));
  revalidatePath("/", "layout");
  redirect("/diario");
}
