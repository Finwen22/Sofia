import { HashSession } from "@/components/HashSession";
import { Orbs } from "@/components/Orbs";

export const metadata = { title: "Sofía" };

export default function Page() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Orbs />
      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
        <span className="display text-5xl">Sofía</span>
        <HashSession siempre />
      </main>
    </div>
  );
}
