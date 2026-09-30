import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { sendPush, type PushMessage, type PushTarget } from "@/lib/push";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

// Lo llama pg_cron (vía pg_net) cuando hay un recordatorio de toma vencido.
// La base valida el secreto; acá solo reenviamos a los celulares.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") ?? "";
  const esperado = process.env.PUSH_CRON_SECRET ?? "";
  const ok = esperado.length > 0 && secret.length === esperado.length && timingSafeEqual(Buffer.from(secret), Buffer.from(esperado));
  if (!ok) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("push_due_reminders", { p_secret: secret });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mensajes = (data ?? []) as (PushTarget & PushMessage)[];
  const gone = await sendPush(mensajes.map((m) => ({ ...m, tag: "proxima-toma" })));
  if (gone.length) await supabase.rpc("push_prune", { p_secret: secret, p_endpoints: gone });
  return NextResponse.json({ enviados: mensajes.length - gone.length, bajas: gone.length });
}
