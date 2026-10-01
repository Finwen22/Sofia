"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Los mails de Supabase (invitación, recuperar contraseña) vuelven con la
 * sesión en el #fragmento de la URL. Eso funciona aunque el mail se abra en
 * otro navegador. Acá se toma esa sesión, se guarda y se sigue.
 */
export function HashSession({ siempre = false }: { siempre?: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"nada" | "abriendo" | "error">(siempre ? "abriendo" : "nada");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const type = hash.get("type");
    const next = new URLSearchParams(window.location.search).get("next");

    if (hash.get("error")) {
      const t = setTimeout(() => setEstado("error"), 0);
      return () => clearTimeout(t);
    }
    if (!access_token || !refresh_token) {
      if (siempre) router.replace("/");
      return;
    }
    let vivo = true;
    (async () => {
      setEstado("abriendo");
      const { error } = await createClient().auth.setSession({ access_token, refresh_token });
      if (!vivo) return;
      if (error) {
        setEstado("error");
        return;
      }
      const destino = type === "recovery" || type === "invite" ? "/nueva-clave" : next?.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.history.replaceState(null, "", window.location.pathname);
      router.replace(destino);
      router.refresh();
    })();
    return () => {
      vivo = false;
    };
  }, [router, siempre]);

  if (estado === "abriendo") {
    return <p role="status" className="rounded-2xl bg-soft px-4 py-3 text-[15px] text-soft-ink">Abriendo tu sesión…</p>;
  }
  if (estado === "error") {
    return (
      <p role="alert" className="rounded-2xl bg-alert-bg px-4 py-3 text-[15px] text-alert">
        Ese link venció o ya se usó. Pedí uno nuevo con “Me olvidé la contraseña”.
      </p>
    );
  }
  return null;
}
