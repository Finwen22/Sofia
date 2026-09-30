import "server-only";
import webpush from "web-push";

let configured = false;
function setup() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushMessage = { title: string; body: string; url?: string; tag?: string };

/** Manda a cada destino; devuelve los endpoints dados de baja (para borrarlos). */
export async function sendPush(targets: (PushTarget & Partial<PushMessage>)[], fallback?: PushMessage): Promise<string[]> {
  setup();
  const gone: string[] = [];
  await Promise.all(
    targets.map(async (t) => {
      const msg = { title: t.title ?? fallback?.title, body: t.body ?? fallback?.body, url: t.url ?? fallback?.url, tag: t.tag ?? fallback?.tag };
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify(msg), { TTL: 1800, urgency: "high" });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(t.endpoint);
        else console.error("push", code, (e as Error).message);
      }
    }),
  );
  return gone;
}
