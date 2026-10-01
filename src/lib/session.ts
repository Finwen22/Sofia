import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Baby } from "@/lib/types";

export type Member = { family_id: string; role: "admin" | "miembro"; display_name: string };

/**
 * Usuario + familia + bebé. La sesión se valida localmente (firma del JWT,
 * sin ir al servidor de Auth) y familia y bebé se piden en paralelo: la RLS
 * ya limita las bebés a la familia de quien consulta.
 */
export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) redirect("/ingresar");
  const user = { id: claims.sub, email: (claims.email as string | undefined) ?? "" };

  const [{ data: member }, { data: baby }] = await Promise.all([
    supabase.from("family_members").select("family_id, role, display_name").eq("user_id", user.id).maybeSingle<Member>(),
    supabase.from("babies").select("*").order("created_at").limit(1).maybeSingle<Baby>(),
  ]);
  if (!member) redirect("/ingresar?error=sin-familia");

  return { supabase, user, member, baby: baby && baby.family_id === member.family_id ? baby : null };
});

/** Igual que getContext pero exige que la bebé ya esté cargada. */
export async function requireBaby() {
  const ctx = await getContext();
  if (!ctx.baby) redirect("/bienvenida");
  return { ...ctx, baby: ctx.baby };
}
