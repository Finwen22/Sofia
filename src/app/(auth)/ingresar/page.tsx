import { IngresarForm } from "./IngresarForm";

export const metadata = { title: "Ingresar · Sofía" };

export default async function Page({ searchParams }: PageProps<"/ingresar">) {
  const { error } = await searchParams;
  return <IngresarForm aviso={error === "sin-familia" ? "Tu cuenta no está asociada a ninguna familia." : undefined} />;
}
