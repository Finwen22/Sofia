import { BottomNav } from "@/components/BottomNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { TemaSync } from "@/components/TemaSync";
import { temaValido } from "@/lib/temas";
import { requireBaby } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { baby, member } = await requireBaby();
  return (
    <>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 pb-32 pt-12">{children}</main>
      <BottomNav />
      <LiveRefresh familyId={baby.family_id} />
      <TemaSync tema={temaValido(member.theme)} />
    </>
  );
}
