"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const TABLAS = [
  "feedings", "diapers", "sleeps", "notes", "appointments", "vaccine_doses", "growth_records", "shopping_items", "babies",
  "medications", "medication_doses", "health_logs", "diary_entries", "diary_photos",
];

/**
 * Refresca la pantalla cuando el otro celular carga algo, y cuando la app
 * vuelve a primer plano (en iPhone la PWA queda "dormida" en segundo plano).
 */
export function LiveRefresh({ familyId }: { familyId: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refrescar = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };

    const supabase = createClient();
    let canal = supabase.channel(`familia-${familyId}`);
    for (const table of TABLAS) {
      canal = canal.on("postgres_changes", { event: "*", schema: "public", table, filter: `family_id=eq.${familyId}` }, refrescar);
    }
    canal.subscribe();

    const alVolver = () => {
      if (document.visibilityState === "visible") refrescar();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", alVolver);
      supabase.removeChannel(canal);
    };
  }, [familyId, router]);

  return null;
}
