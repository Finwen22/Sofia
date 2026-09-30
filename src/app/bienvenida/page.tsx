import { redirect } from "next/navigation";
import { Orbs } from "@/components/Orbs";
import { getContext } from "@/lib/session";
import { Stepper } from "./Stepper";

export const metadata = { title: "Bienvenida · Sofía" };

export default async function Page() {
  const { baby, member } = await getContext();
  if (baby) redirect("/");
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Orbs />
      <Stepper nombre={member.display_name} />
    </div>
  );
}
