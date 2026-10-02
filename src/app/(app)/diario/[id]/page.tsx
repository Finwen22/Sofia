import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { etiquetaHito } from "@/lib/hitos";
import { edad, fechaDia, toDateInput } from "@/lib/time";
import type { DiaryEntry, DiaryPhoto } from "@/lib/types";
import { borrarRecuerdo } from "../actions";
import { RecuerdoForm } from "../RecuerdoForm";

export const metadata = { title: "Recuerdo · Sofía" };

export default async function Page({ params, searchParams }: PageProps<"/diario/[id]">) {
  const { id } = await params;
  const { editar } = await searchParams;
  const { supabase, baby } = await requireBaby();
  const [{ data: e }, { data: fotos }, { data: usados }, { data: miembros }] = await Promise.all([
    supabase.from("diary_entries").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<DiaryEntry>(),
    supabase.from("diary_photos").select("*").eq("entry_id", id).order("position").returns<DiaryPhoto[]>(),
    supabase.from("diary_entries").select("milestone").eq("baby_id", baby.id).not("milestone", "is", null),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", baby.family_id),
  ]);
  if (!e) notFound();
  const lista = fotos ?? [];
  const firmadas = lista.length ? (await supabase.storage.from("fotos").createSignedUrls(lista.map((f) => f.path), 3600)).data ?? [] : [];
  const conUrl = lista.flatMap((f) => {
    const url = firmadas.find((x) => x.path === f.path)?.signedUrl;
    return url ? [{ id: f.id, url }] : [];
  });
  const autor = (miembros ?? []).find((m) => m.user_id === e.created_by)?.display_name;

  if (editar === "1") {
    return (
      <>
        <PageHeader eyebrow="Diario" title="Editar recuerdo" back={`/diario/${e.id}`} />
        <RecuerdoForm
          familyId={baby.family_id}
          hoy={toDateInput()}
          nacio={toDateInput(new Date(baby.birth_at))}
          recuerdo={e}
          fotos={conUrl}
          hitosUsados={(usados ?? []).map((d) => d.milestone as string)}
        />
        <DeleteButton
          action={borrarRecuerdo}
          fields={{ id: e.id }}
          pregunta="¿Borrar este recuerdo y sus fotos? No se puede deshacer."
          className="h-12 w-full rounded-2xl text-[15px] font-semibold text-alert"
        >
          Borrar recuerdo
        </DeleteButton>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={etiquetaHito(e.milestone) ? "Primera vez" : "Diario"}
        title={e.title}
        back="/diario"
        action={
          <Link href={`/diario/${e.id}?editar=1`} aria-label="Editar recuerdo" className="mb-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface">
            <Icon name="note" size={20} />
          </Link>
        }
      />
      <p className="-mt-2 text-[14px] text-muted">
        {fechaDia(e.happened_on)} · {edad(baby.birth_at, new Date(`${e.happened_on}T12:00:00-03:00`))}
        {autor ? ` · lo guardó ${autor}` : ""}
      </p>
      {e.body && <p className="whitespace-pre-line text-[16px] leading-relaxed">{e.body}</p>}
      <div className="flex flex-col gap-2">
        {conUrl.map((f) => (
          <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-[20px] border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt={e.title} className="w-full object-cover" />
          </a>
        ))}
      </div>
    </>
  );
}
