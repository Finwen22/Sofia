import { PageHeader } from "@/components/PageHeader";
import { toDateInput } from "@/lib/time";
import { MedForm } from "../MedForm";

export const metadata = { title: "Nuevo medicamento · Sofía" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Medicamentos" title="Agregar" back="/salud/medicamentos" />
      <MedForm hoy={toDateInput()} />
    </>
  );
}
