import { RecuperarForm } from "./RecuperarForm";

export const metadata = { title: "Recuperar contraseña · Sofía" };

export default async function Page({ searchParams }: PageProps<"/recuperar">) {
  const { error } = await searchParams;
  return <RecuperarForm aviso={error === "link" ? "Ese link venció o ya se usó. Pedí uno nuevo." : undefined} />;
}
