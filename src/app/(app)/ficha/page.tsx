import Link from "next/link";
import { Icon } from "@/components/Icon";
import { requireBaby } from "@/lib/session";
import { edad, fechaDia, hhmm } from "@/lib/time";

export const metadata = { title: "Ficha · Sofía" };

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="text-[14px] text-muted">{label}</dt>
      <dd className="text-right text-[15px] font-semibold">{valor ?? <span className="font-normal text-faint">—</span>}</dd>
    </div>
  );
}

const siNo = (v: boolean | null) => (v === null ? null : v ? "Hecha" : "Pendiente");

export default async function Page() {
  const { baby } = await requireBaby();
  const b = baby;
  return (
    <>
      <header className="flex items-center gap-4">
        <span className="display flex size-20 shrink-0 items-center justify-center rounded-full bg-soft text-4xl text-soft-ink">{b.first_name.charAt(0)}</span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="eyebrow">Ficha</span>
          <h1 className="display text-[32px] leading-tight">{[b.first_name, b.last_name].filter(Boolean).join(" ")}</h1>
          <span className="chip self-start">{edad(b.birth_at)}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/ficha/editar" className="btn-ghost h-12 text-[15px]">Editar ficha</Link>
        <Link href="/ficha/ajustes" className="btn-ghost h-12 text-[15px]"><Icon name="settings" size={18} /> Ajustes</Link>
      </div>

      {(b.pediatrician_phone || b.health_insurance) && (
        <section className="card flex flex-col gap-3 p-4">
          <h2 className="eyebrow">Para una urgencia</h2>
          {b.pediatrician_phone && (
            <a href={`tel:${b.pediatrician_phone.replace(/[^\d+]/g, "")}`} className="btn-primary h-12 text-[15px]">
              <Icon name="phone" size={18} /> Llamar a {b.pediatrician_name ?? "pediatra"}
            </a>
          )}
          {b.health_insurance && (
            <p className="text-[15px]">
              {b.health_insurance}
              {b.insurance_number && <span className="text-muted"> · N.º {b.insurance_number}</span>}
            </p>
          )}
          <p className="text-[13px] leading-relaxed text-faint">Ante fiebre de 38 °C o más en un bebé menor de 3 meses, dificultad para respirar o si no quiere comer, consultá a la guardia sin esperar.</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow mt-2">Nacimiento</h2>
        <dl className="card px-4">
          <Dato label="Fecha" valor={`${fechaDia(b.birth_at)} · ${hhmm(b.birth_at)}`} />
          <Dato label="Peso" valor={b.birth_weight_g && `${b.birth_weight_g.toLocaleString("es-AR")} g`} />
          <Dato label="Talla" valor={b.birth_length_cm && `${b.birth_length_cm} cm`} />
          <Dato label="Perímetro cefálico" valor={b.birth_head_cm && `${b.birth_head_cm} cm`} />
          <Dato label="Gestación" valor={b.gestation_weeks && `${b.gestation_weeks} semanas`} />
          <Dato label="Parto" valor={b.delivery_type && (b.delivery_type === "natural" ? "Natural" : "Cesárea")} />
          <Dato label="Lugar" valor={b.birthplace} />
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow mt-2">Salud</h2>
        <dl className="card px-4">
          <Dato label="Grupo sanguíneo" valor={b.blood_type} />
          <Dato label="Pesquisa neonatal" valor={siNo(b.neonatal_screening)} />
          <Dato label="Otoemisiones" valor={siNo(b.hearing_screening)} />
          <Dato label="Alergias / observaciones" valor={b.allergies} />
          <Dato label="Alimentación" valor={b.feeding_mode && { pecho: "Pecho", mixta: "Mixta", formula: "Mamadera" }[b.feeding_mode]} />
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow mt-2">Cobertura y pediatra</h2>
        <dl className="card px-4">
          <Dato label="Obra social / prepaga" valor={b.health_insurance} />
          <Dato label="N.º de afiliada" valor={b.insurance_number} />
          <Dato label="Pediatra" valor={b.pediatrician_name} />
          <Dato label="Teléfono" valor={b.pediatrician_phone} />
        </dl>
      </section>

      {b.notes && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow mt-2">Notas</h2>
          <p className="card whitespace-pre-line p-4 text-[15px]">{b.notes}</p>
        </section>
      )}
    </>
  );
}
