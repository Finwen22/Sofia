import { RegistroForm } from "./RegistroForm";

export const metadata = { title: "Crear cuenta · Sofía" };

export default async function Page({ searchParams }: PageProps<"/crear-cuenta">) {
  const { email } = await searchParams;
  return <RegistroForm email={typeof email === "string" ? email : undefined} />;
}
