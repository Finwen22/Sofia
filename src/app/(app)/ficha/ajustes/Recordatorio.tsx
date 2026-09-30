"use client";

import { useActionState, useEffect, useState } from "react";
import { desuscribirPush, guardarRecordatorio, probarPush, suscribirPush } from "../actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";

function base64ToBytes(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function RecordatorioForm({ activo, intervalo, antes }: { activo: boolean; intervalo: number; antes: number }) {
  const [state, action] = useActionState(guardarRecordatorio, undefined);
  const [on, setOn] = useState(activo);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="opt justify-between px-4">
        <span>Avisarme antes de la próxima toma</span>
        <input type="checkbox" name="activo" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-5 accent-[#d8b389]" />
      </label>
      <fieldset className="flex flex-col gap-2" disabled={!on}>
        <legend className="label mb-2">Toma cada</legend>
        <div className="flex gap-2">
          <select name="horas" defaultValue={Math.floor(intervalo / 60)} aria-label="Horas" className="input flex-1 disabled:opacity-50">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => <option key={h} value={h}>{h} h</option>)}
          </select>
          <select name="minutos" defaultValue={intervalo % 60} aria-label="Minutos" className="input flex-1 disabled:opacity-50">
            {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <span className="label mt-2">Avisar</span>
        <select name="antes" defaultValue={antes} aria-label="Minutos antes" className="input disabled:opacity-50">
          {[0, 10, 15, 20, 30, 45, 60].map((m) => (
            <option key={m} value={m}>{m === 0 ? "A la hora justa" : `${m} min antes`}</option>
          ))}
        </select>
        <p className="text-[13px] leading-relaxed text-faint">
          Se cuenta desde que empieza cada toma. Si cambia de pecho dentro de los 45 min, sigue siendo la misma toma. Les llega a los dos celulares.
        </p>
      </fieldset>
      <FormError message={state?.error} />
      {state?.ok && <p role="status" className="text-[14px] text-accent">Guardado.</p>}
      <Submit className="btn-primary h-12 text-[15px]">Guardar recordatorio</Submit>
    </form>
  );
}

type Estado = "cargando" | "no-soportado" | "instalar" | "bloqueado" | "apagado" | "activo";

export function PushCelular() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const instalada = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      let e: Estado;
      let s: PushSubscription | null = null;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) e = iOS && !instalada ? "instalar" : "no-soportado";
      else if (Notification.permission === "denied") e = "bloqueado";
      else {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        s = await reg.pushManager.getSubscription();
        e = s ? "activo" : "apagado";
      }
      if (vivo) {
        setSub(s);
        setEstado(e);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  async function activar() {
    setOcupado(true);
    setMsg({});
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "apagado");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const s = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const r = await suscribirPush(JSON.parse(JSON.stringify(s)));
      if (r?.error) {
        await s.unsubscribe();
        setMsg({ error: r.error });
        return;
      }
      setSub(s);
      setEstado("activo");
    } catch {
      setMsg({ error: "No se pudieron activar las notificaciones en este celular." });
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    if (!sub) return;
    setOcupado(true);
    await desuscribirPush(sub.endpoint);
    await sub.unsubscribe();
    setSub(null);
    setEstado("apagado");
    setOcupado(false);
  }

  async function probar() {
    setOcupado(true);
    const r = await probarPush();
    setMsg(r?.error ? { error: r.error } : { ok: "Enviada. Debería llegarte en unos segundos." });
    setOcupado(false);
  }

  const textos: Record<Estado, string> = {
    cargando: "Revisando…",
    "no-soportado": "Este navegador no permite notificaciones.",
    instalar: "En iPhone primero hay que instalar la app: tocá Compartir → “Agregar a inicio”, abrila desde el ícono y volvé acá.",
    bloqueado: "Las notificaciones están bloqueadas para Sofía. Habilitalas en los ajustes del navegador o del celular.",
    apagado: "Todavía no están activadas en este celular.",
    activo: "Activadas en este celular.",
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 text-[15px]">
        <Icon name={estado === "activo" ? "check" : "alert"} size={18} className={`mt-0.5 shrink-0 ${estado === "activo" ? "text-accent" : "text-muted"}`} />
        {textos[estado]}
      </p>
      {estado === "apagado" && (
        <button type="button" onClick={activar} disabled={ocupado} className="btn-primary h-12 text-[15px]">
          Activar en este celular
        </button>
      )}
      {estado === "activo" && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={probar} disabled={ocupado} className="btn-ghost h-12 text-[15px]">Probar</button>
          <button type="button" onClick={desactivar} disabled={ocupado} className="btn-ghost h-12 text-[15px]">Desactivar</button>
        </div>
      )}
      <FormError message={msg.error} />
      {msg.ok && <p role="status" className="text-[14px] text-accent">{msg.ok}</p>}
    </div>
  );
}
