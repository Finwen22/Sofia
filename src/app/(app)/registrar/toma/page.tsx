import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { ladoSugerido } from "@/lib/resumen";
import { toLocalInput } from "@/lib/time";
import type { Feeding } from "@/lib/types";
import { TomaForm } from "./TomaForm";

export const metadata = { title: "Toma · Sofía" };

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const { data } = await supabase.from("feedings").select("*").eq("baby_id", baby.id).order("started_at", { ascending: false }).limit(10).returns<Feeding[]>();
  const ultimos = data ?? [];
  const ultimaMamadera = ultimos.find((f) => f.kind === "mamadera");
  return (
    <>
      <PageHeader eyebrow="Alimentación" title="Nueva toma" back="/" />
      <TomaForm
        inicial={baby.feeding_mode === "formula" ? "mamadera" : "pecho"}
        sugerido={ladoSugerido(ultimos)}
        ahora={toLocalInput()}
        mlSugerido={ultimaMamadera?.amount_ml ?? null}
        lecheSugerida={ultimaMamadera?.milk ?? (baby.feeding_mode === "formula" ? "formula" : "materna")}
      />
    </>
  );
}
