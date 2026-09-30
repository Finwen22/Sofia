import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Baby } from "@/lib/types";

export type Member = { family_id: string; role: "admin" | "miembro"; display_name: string };

/** Usuario + familia + bebé. Una sola consulta por request. */
export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/ingresar");

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id, role, display_name")
    .eq("user_id", auth.user.id)
    .maybeSingle<Member>();
  if (!member) redirect("/ingresar?error=sin-familia");

  const { data: baby } = await supabase
    .from("babies")
    .select("*")
    .eq("family_id", member.family_id)
    .order("created_at")
    .limit(1)
    .maybeSingle<Baby>();

  return { supabase, user: auth.user, member, baby };
});

/** Igual que getContext pero exige que la bebé ya esté cargada. */
export async function requireBaby() {
  const ctx = await getContext();
  if (!ctx.baby) redirect("/bienvenida");
  return { ...ctx, baby: ctx.baby };
}
