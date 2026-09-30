import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { toDateInput } from "@/lib/time";
import { TurnoForm } from "../TurnoForm";

export const metadata = { title: "Nuevo turno · Sofía" };

export default async function Page() {
  const { baby } = await requireBaby();
  const manana = toDateInput(new Date(new Date().getTime() + 86400000));
  return (
    <>
      <PageHeader eyebrow="Turnos" title="Nuevo turno" back="/salud" />
      <TurnoForm fechaInicial={`${manana}T10:00`} pediatra={baby.pediatrician_name} />
    </>
  );
}
