import { DeleteButton } from "@/components/DeleteButton";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { getContext } from "@/lib/session";
import type { ShoppingItem } from "@/lib/types";
import { borrarComprados, borrarItem, marcarItem } from "./actions";
import { AgregarItem } from "./AgregarItem";
import { CATEGORIAS, SUGERENCIAS } from "./categorias";

export const metadata = { title: "Compras · Sofía" };

function Fila({ it }: { it: ShoppingItem }) {
  return (
    <li className="flex items-center gap-1 border-b border-line last:border-0">
      <form action={marcarItem} className="flex-1">
        <input type="hidden" name="id" value={it.id} />
        <input type="hidden" name="done" value={it.done ? "0" : "1"} />
        <button className="flex min-h-14 w-full items-center gap-3 py-2 text-left" aria-pressed={it.done}>
          <span className={`flex size-6 shrink-0 items-center justify-center rounded-lg border ${it.done ? "border-accent bg-accent text-on-accent" : "border-line"}`}>
            {it.done && <Icon name="check" size={16} stroke={2.4} />}
          </span>
          <span className={`flex flex-col ${it.done ? "text-faint line-through" : ""}`}>
            <span className="text-[16px]">{it.name}</span>
            {it.quantity && <span className="text-[13px] text-muted">{it.quantity}</span>}
          </span>
        </button>
      </form>
      <DeleteButton action={borrarItem} fields={{ id: it.id }} pregunta={`¿Sacar "${it.name}" de la lista?`} />
    </li>
  );
}

export default async function Page() {
  const { supabase, member } = await getContext();
  const { data } = await supabase.from("shopping_items").select("*").eq("family_id", member.family_id).order("created_at").returns<ShoppingItem[]>();
  const items = data ?? [];
  const pendientes = items.filter((i) => !i.done);
  const comprados = items.filter((i) => i.done);
  const nombres = new Set(pendientes.map((i) => i.name.toLowerCase()));
  const sugerencias = SUGERENCIAS.filter((s) => !nombres.has(s.name.toLowerCase()));

  return (
    <>
      <PageHeader eyebrow="Compras" title="Lista de compras" />
      <AgregarItem sugerencias={sugerencias} />

      {pendientes.length === 0 ? (
        <p className="py-6 text-center text-[15px] text-muted">No falta nada.</p>
      ) : (
        CATEGORIAS.map((c) => {
          const deCat = pendientes.filter((i) => i.category === c.code);
          if (!deCat.length) return null;
          return (
            <section key={c.code} className="flex flex-col gap-2">
              <h2 className="eyebrow mt-2">{c.label}</h2>
              <ul className="card px-4">
                {deCat.map((it) => <Fila key={it.id} it={it} />)}
              </ul>
            </section>
          );
        })
      )}

      {comprados.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="mt-2 flex items-center justify-between">
            <h2 className="eyebrow">Comprado</h2>
            <form action={borrarComprados}>
              <button className="h-9 rounded-full border border-line px-3 text-[13px] font-semibold text-muted">Vaciar comprados</button>
            </form>
          </div>
          <ul className="card px-4">
            {comprados.map((it) => <Fila key={it.id} it={it} />)}
          </ul>
        </section>
      )}
    </>
  );
}
