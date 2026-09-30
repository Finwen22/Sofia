import { Orbs } from "@/components/Orbs";
import { NuevaClaveForm } from "./NuevaClaveForm";

export const metadata = { title: "Nueva contraseña · Sofía" };

export default function Page() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Orbs />
      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
        <h1 className="display text-[34px] leading-tight">Elegí una contraseña nueva</h1>
        <NuevaClaveForm />
      </main>
    </div>
  );
}
