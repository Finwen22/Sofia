import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { diasDesde, toDateInput, toLocalInput } from "@/lib/time";
import type { Diaper, Feeding, Note, Sleep } from "@/lib/types";
import { PanalForm } from "../../../registrar/panal/PanalForm";
import { EditarNota, EditarSueno, EditarToma } from "./EditarForms";

export const metadata = { title: "Editar registro · Sofía" };

const local = (iso: string) => toLocalInput(new Date(iso));

export default async function Page({ params }: PageProps<"/registro/[tabla]/[id]">) {
  const { tabla, id } = await params;
  const { supabase, baby } = await requireBaby();
  const volver = (iso: string) => `/registro?dia=${toDateInput(new Date(iso))}`;

  if (tabla === "toma") {
    const { data: t } = await supabase.from("feedings").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<Feeding>();
    if (!t) notFound();
    const minutos = t.ended_at ? Math.round((new Date(t.ended_at).getTime() - new Date(t.started_at).getTime()) / 60000) : null;
    return (
      <>
        <PageHeader eyebrow="Editar" title={t.kind === "pecho" ? "Toma de pecho" : "Mamadera"} back={volver(t.started_at)} />
        <EditarToma toma={t} inicio={local(t.started_at)} minutos={minutos} />
      </>
    );
  }

  if (tabla === "panal") {
    const { data: d } = await supabase.from("diapers").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<Diaper>();
    if (!d) notFound();
    const foto = d.photo_path ? (await supabase.storage.from("fotos").createSignedUrl(d.photo_path, 3600)).data?.signedUrl ?? null : null;
    return (
      <>
        <PageHeader eyebrow="Editar" title="Pañal" back={volver(d.changed_at)} />
        <PanalForm familyId={baby.family_id} ahora={local(d.changed_at)} diasDeVida={diasDesde(baby.birth_at, new Date(d.changed_at))} panal={d} fotoUrl={foto} />
      </>
    );
  }

  if (tabla === "sueno") {
    const { data: z } = await supabase.from("sleeps").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<Sleep>();
    if (!z) notFound();
    return (
      <>
        <PageHeader eyebrow="Editar" title="Sueño" back={volver(z.started_at)} />
        <EditarSueno id={z.id} inicio={local(z.started_at)} fin={z.ended_at ? local(z.ended_at) : null} />
      </>
    );
  }

  if (tabla === "nota") {
    const { data: n } = await supabase.from("notes").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<Note>();
    if (!n) notFound();
    return (
      <>
        <PageHeader eyebrow="Editar" title="Nota" back={volver(n.created_at)} />
        <EditarNota nota={n} />
      </>
    );
  }

  notFound();
}
