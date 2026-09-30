import { PageHeader } from "@/components/PageHeader";
import { toDateInput } from "@/lib/time";
import { MedidaForm } from "./MedidaForm";

export const metadata = { title: "Nueva medida · Sofía" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Crecimiento" title="Nueva medida" back="/salud" />
      <MedidaForm hoy={toDateInput()} />
    </>
  );
}
