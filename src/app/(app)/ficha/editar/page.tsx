import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { toLocalInput } from "@/lib/time";
import { FichaForm } from "./FichaForm";

export const metadata = { title: "Editar ficha · Sofía" };

export default async function Page() {
  const { baby } = await requireBaby();
  const [fecha, hora] = toLocalInput(new Date(baby.birth_at)).split("T");
  return (
    <>
      <PageHeader eyebrow="Ficha" title="Editar ficha" back="/ficha" />
      <FichaForm baby={baby} fecha={fecha} hora={hora} />
    </>
  );
}
