import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { HITOS } from "@/lib/hitos";
import { edad, fechaDia } from "@/lib/time";
import type { DiaryEntry, DiaryPhoto } from "@/lib/types";

export const metadata = { title: "Diario · Sofía" };

const mesDe = (d: string) => {
  const s = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const [{ data: entradas }, { data: fotos }] = await Promise.all([
    supabase.from("diary_entries").select("*").eq("baby_id", baby.id).order("happened_on", { ascending: false }).order("created_at", { ascending: false }).returns<DiaryEntry[]>(),
    supabase.from("diary_photos").select("*").eq("family_id", baby.family_id).order("position").returns<DiaryPhoto[]>(),
  ]);
  const lista = entradas ?? [];
  const deEntrada = (id: string) => (fotos ?? []).filter((f) => f.entry_id === id);

  // Primera foto de cada recuerdo (hasta 3 para la vista previa).
  const previas = lista.flatMap((e) => deEntrada(e.id).slice(0, 3).map((f) => f.path));
  const firmadas = previas.length ? (await supabase.storage.from("fotos").createSignedUrls(previas, 3600)).data ?? [] : [];
  const url = (path: string) => firmadas.find((x) => x.path === path)?.signedUrl;

  const usados = new Set(lista.map((e) => e.milestone).filter(Boolean));
  const pendientes = HITOS.filter((h) => !usados.has(h.code));
  const meses = [...new Set(lista.map((e) => e.happened_on.slice(0, 7)))];

  return (
    <>
      <PageHeader
        eyebrow="Diario"
        title={`Los recuerdos de ${baby.first_name}`}
        back="/ficha"
        action={
          <Link href="/diario/nuevo" aria-label="Agregar recuerdo" className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent">
            <Icon name="plus" size={22} stroke={2} />
          </Link>
        }
      />

      {pendientes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Primeras veces</h2>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {HITOS.map((h) => {
              const hecho = usados.has(h.code);
              const entrada = hecho ? lista.find((e) => e.milestone === h.code) : null;
              return (
                <Link
                  key={h.code}
                  href={entrada ? `/diario/${entrada.id}` : `/diario/nuevo?hito=${h.code}`}
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold ${hecho ? "bg-soft text-soft-ink" : "border border-dashed border-line text-muted"}`}
                >
                  <Icon name={hecho ? "check" : "plus"} size={14} stroke={2.2} />
                  {h.label}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {lista.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <Icon name="heart" size={28} className="text-accent" />
          <p className="text-[15px] leading-relaxed text-muted">
            Acá van quedando las primeras veces y los momentos que no quieren olvidar, con fotos. Lo ven los dos.
          </p>
          <Link href="/diario/nuevo" className="btn-primary h-12 text-[15px]">Guardar el primer recuerdo</Link>
        </div>
      ) : (
        meses.map((m) => (
          <section key={m} className="flex flex-col gap-2.5">
            <h2 className="eyebrow mt-2">{mesDe(`${m}-15`)}</h2>
            {lista
              .filter((e) => e.happened_on.startsWith(m))
              .map((e) => {
                const fs = deEntrada(e.id);
                const prev = fs.slice(0, 3).map((f) => url(f.path)).filter(Boolean) as string[];
                return (
                  <Link key={e.id} href={`/diario/${e.id}`} className="card flex flex-col gap-2.5 overflow-hidden p-0">
                    {prev.length > 0 && (
                      <div className={`grid gap-0.5 ${prev.length === 1 ? "grid-cols-1" : prev.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                        {prev.map((u, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={u} alt="" className={`w-full object-cover ${prev.length === 1 ? "aspect-[4/3]" : "aspect-square"}`} />
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 px-4 pb-3.5 pt-1">
                      <span className="text-[12px] font-semibold text-muted">
                        {fechaDia(e.happened_on)} · {edad(baby.birth_at, new Date(`${e.happened_on}T12:00:00-03:00`))}
                        {fs.length > 3 ? ` · ${fs.length} fotos` : ""}
                      </span>
                      <span className="flex items-center gap-1.5 text-[17px] font-bold">
                        {e.milestone && <Icon name="heart" size={16} className="text-accent" />}
                        {e.title}
                      </span>
                      {e.body && <span className="line-clamp-2 text-[14px] leading-snug text-muted">{e.body}</span>}
                    </div>
                  </Link>
                );
              })}
          </section>
        ))
      )}
    </>
  );
}
