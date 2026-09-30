import { PageHeader } from "@/components/PageHeader";
import { NotaForm } from "./NotaForm";

export const metadata = { title: "Nota · Sofía" };

export default async function Page({ searchParams }: PageProps<"/registrar/nota">) {
  const { pediatra } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Nota" title="Anotar algo" back="/" />
      <NotaForm paraPediatra={pediatra === "1"} />
    </>
  );
}
