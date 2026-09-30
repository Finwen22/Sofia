import { IngresarForm } from "./IngresarForm";

export const metadata = { title: "Ingresar · Sofía" };

export default async function Page({ searchParams }: PageProps<"/ingresar">) {
  const { error, aviso } = await searchParams;
  return (
    <IngresarForm
      aviso={error === "sin-familia" ? "Tu cuenta no está asociada a ninguna familia." : undefined}
      info={aviso === "confirmada" ? "Tu email quedó confirmado. Ingresá con tu contraseña." : undefined}
    />
  );
}
