import { HashSession } from "@/components/HashSession";
import { Orbs } from "@/components/Orbs";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Orbs />
      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <span className="display text-5xl">Sofía</span>
          <p className="text-[15px] leading-relaxed text-muted">Tomas, pañales, sueño, turnos y vacunas, en un solo lugar y a un toque.</p>
        </div>
        <HashSession />
        {children}
      </main>
    </div>
  );
}
