import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { toLocalInput } from "@/lib/time";
import type { Appointment } from "@/lib/types";
import { borrarTurno } from "../../actions";
import { TurnoForm } from "../TurnoForm";

export const metadata = { title: "Turno · Sofía" };

export default async function Page({ params }: PageProps<"/salud/turnos/[id]">) {
  const { id } = await params;
  const { supabase, baby } = await requireBaby();
  const { data: turno } = await supabase.from("appointments").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<Appointment>();
  if (!turno) notFound();
  return (
    <>
      <PageHeader eyebrow="Turno" title={turno.kind} back="/salud" />
      {!turno.done && (
        <Link href="/salud/resumen" className="btn-ghost h-12 text-[15px]">Ver resumen para llevar al control</Link>
      )}
      <TurnoForm turno={turno} fechaInicial={toLocalInput(new Date(turno.scheduled_at))} pediatra={baby.pediatrician_name} />
      <form action={borrarTurno}>
        <input type="hidden" name="id" value={turno.id} />
        <button className="w-full py-3 text-[15px] font-semibold text-alert">Borrar turno</button>
      </form>
    </>
  );
}
