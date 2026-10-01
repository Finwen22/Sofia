import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Medication, MedicationDose } from "@/lib/types";

/** Medicamentos + dosis de los últimos días (para saber qué toca) + nombres de quién la dio. */
export async function cargarMedicamentos(supabase: SupabaseClient, babyId: string, familyId: string, { soloActivos = true } = {}) {
  const desde = new Date(Date.now() - 3 * 86400_000).toISOString();
  let q = supabase.from("medications").select("*").eq("baby_id", babyId).order("created_at");
  if (soloActivos) q = q.eq("active", true);
  const [meds, doses, miembros] = await Promise.all([
    q.returns<Medication[]>(),
    supabase.from("medication_doses").select("*").eq("baby_id", babyId).gte("given_at", desde).order("given_at", { ascending: false }).returns<MedicationDose[]>(),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", familyId),
  ]);
  const porMed = (id: string) => (doses.data ?? []).filter((d) => d.medication_id === id);
  const nombres: Record<string, string> = Object.fromEntries((miembros.data ?? []).map((m) => [m.user_id, m.display_name]));
  return { meds: meds.data ?? [], porMed, nombres };
}
