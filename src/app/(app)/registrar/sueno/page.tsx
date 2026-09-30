import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { LiveTimer } from "@/components/LiveTimer";
import { requireBaby } from "@/lib/session";
import { hhmm, toLocalInput } from "@/lib/time";
import { empezarSueno, terminarSueno } from "../actions";
import { SuenoForm } from "./SuenoForm";

export const metadata = { title: "Sueño · Sofía" };

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const { data: abierto } = await supabase.from("sleeps").select("id, started_at").eq("baby_id", baby.id).is("ended_at", null).maybeSingle();
  const hace1h = toLocalInput(new Date(new Date().getTime() - 3600_000));

  return (
    <>
      <PageHeader eyebrow="Sueño" title={abierto ? "Está durmiendo" : "Se durmió"} back="/" />
      {abierto ? (
        <section className="card flex flex-col gap-3 p-5">
          <span className="eyebrow">Durmiendo desde las {hhmm(abierto.started_at)}</span>
          <LiveTimer since={abierto.started_at} className="display text-5xl" />
          <form action={terminarSueno}>
            <input type="hidden" name="id" value={abierto.id} />
            <button className="btn-primary">
              <Icon name="stop" size={20} /> Se despertó
            </button>
          </form>
        </section>
      ) : (
        <form action={empezarSueno}>
          <button className="btn-primary h-20 text-lg">
            <Icon name="moon" size={24} /> Se durmió ahora
          </button>
        </form>
      )}
      <h2 className="eyebrow mt-4">O cargá una siesta que ya pasó</h2>
      <SuenoForm desde={hace1h} hasta={toLocalInput()} />
    </>
  );
}
