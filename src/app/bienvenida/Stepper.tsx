"use client";

import { useActionState, useRef, useState } from "react";
import { crearFicha } from "./actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";

const PASOS = ["Su nombre", "Nacimiento", "Salud", "Cobertura", "Alimentación"];

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-1 flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-faint">{hint}</span>}
    </label>
  );
}

function Unit({ name, placeholder, unit, inputMode = "numeric" }: { name: string; placeholder: string; unit: string; inputMode?: "numeric" | "decimal" }) {
  return (
    <span className="input flex items-center gap-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent">
      <input name={name} inputMode={inputMode} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint" />
      <span className="text-sm text-muted">{unit}</span>
    </span>
  );
}

function Opt({ name, value, children, defaultChecked }: { name: string; value: string; children: React.ReactNode; defaultChecked?: boolean }) {
  return (
    <label className="opt flex-1">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      {children}
    </label>
  );
}

function SiNo({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="label mb-2">{label}</legend>
      <div className="flex gap-2">
        <Opt name={name} value="si">Sí</Opt>
        <Opt name={name} value="no">No</Opt>
        <Opt name={name} value="" defaultChecked>No sé</Opt>
      </div>
    </fieldset>
  );
}

export function Stepper({ nombre }: { nombre: string }) {
  const [paso, setPaso] = useState(0);
  const [state, action] = useActionState(crearFicha, undefined);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const hoy = new Date().toLocaleDateString("en-CA");

  function siguiente() {
    const campos = refs.current[paso]?.querySelectorAll<HTMLInputElement>("input, select, textarea") ?? [];
    for (const c of campos) {
      if (!c.checkValidity()) {
        c.reportValidity();
        return;
      }
    }
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
    window.scrollTo({ top: 0 });
  }

  const paneles: { titulo: React.ReactNode; texto: string; cuerpo: React.ReactNode }[] = [
    {
      titulo: <>Hola, {nombre}.<br />¿Cómo se llama?</>,
      texto: "Armemos su ficha. Son cinco pasos cortos y todo se puede cambiar después.",
      cuerpo: (
        <>
          <Field label="Nombre">
            <input name="first_name" required autoComplete="off" className="input" />
          </Field>
          <Field label="Apellido">
            <input name="last_name" autoComplete="off" className="input" />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Es</legend>
            <div className="flex gap-2">
              <Opt name="sex" value="femenino" defaultChecked>Nena</Opt>
              <Opt name="sex" value="masculino">Varón</Opt>
            </div>
          </fieldset>
        </>
      ),
    },
    {
      titulo: <>¿Cómo llegó<br />al mundo?</>,
      texto: "Estos datos están en la libreta sanitaria o en el alta de la maternidad.",
      cuerpo: (
        <>
          <div className="flex gap-3">
            <Field label="Fecha">
              <input name="birth_date" type="date" required max={hoy} className="input" />
            </Field>
            <Field label="Hora">
              <input name="birth_time" type="time" className="input" />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Peso"><Unit name="birth_weight_g" placeholder="3250" unit="g" /></Field>
            <Field label="Talla"><Unit name="birth_length_cm" placeholder="49" unit="cm" inputMode="decimal" /></Field>
          </div>
          <div className="flex gap-3">
            <Field label="Perím. cefálico"><Unit name="birth_head_cm" placeholder="34" unit="cm" inputMode="decimal" /></Field>
            <Field label="Gestación"><Unit name="gestation_weeks" placeholder="39" unit="sem" /></Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Tipo de parto</legend>
            <div className="flex gap-2">
              <Opt name="delivery_type" value="natural">Natural</Opt>
              <Opt name="delivery_type" value="cesarea">Cesárea</Opt>
            </div>
          </fieldset>
          <Field label="Dónde nació">
            <input name="birthplace" placeholder="Maternidad o clínica" className="input" />
          </Field>
        </>
      ),
    },
    {
      titulo: <>Su salud<br />al nacer</>,
      texto: "Si algo no lo sabés, dejalo en “No sé” y lo completás en el primer control.",
      cuerpo: (
        <>
          <Field label="Grupo y factor sanguíneo">
            <select name="blood_type" defaultValue="" className="input">
              <option value="">No sé todavía</option>
              {["0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Vacunas que recibió en la maternidad</legend>
            <label className="opt justify-start px-4">
              <input type="checkbox" name="vac_bcg" className="size-5 accent-accent" /> BCG
            </label>
            <label className="opt justify-start px-4">
              <input type="checkbox" name="vac_hb-rn" className="size-5 accent-accent" /> Hepatitis B
            </label>
          </fieldset>
          <SiNo name="neonatal_screening" label="¿Le hicieron la pesquisa neonatal (prueba del talón)?" />
          <SiNo name="hearing_screening" label="¿Le hicieron la prueba de audición (otoemisiones)?" />
          <Field label="Alergias u observaciones">
            <textarea name="allergies" rows={2} className="input" />
          </Field>
        </>
      ),
    },
    {
      titulo: <>Cobertura<br />y pediatra</>,
      texto: "Para tenerlo a mano en una guardia o al pedir un turno.",
      cuerpo: (
        <>
          <Field label="Obra social o prepaga">
            <input name="health_insurance" className="input" />
          </Field>
          <Field label="Número de afiliada">
            <input name="insurance_number" className="input" />
          </Field>
          <Field label="Pediatra">
            <input name="pediatrician_name" className="input" />
          </Field>
          <Field label="Teléfono del pediatra">
            <input name="pediatrician_phone" type="tel" inputMode="tel" className="input" />
          </Field>
        </>
      ),
    },
    {
      titulo: <>¿Cómo se<br />alimenta?</>,
      texto: "Sirve para ordenar los botones de registro. Si cambia, lo cambiás en la ficha.",
      cuerpo: (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Alimentación</legend>
          <Opt name="feeding_mode" value="pecho" defaultChecked>Pecho</Opt>
          <Opt name="feeding_mode" value="mixta">Mixta: pecho y mamadera</Opt>
          <Opt name="feeding_mode" value="formula">Mamadera</Opt>
        </fieldset>
      ),
    },
  ];

  const ultimo = paso === PASOS.length - 1;

  return (
    <form
      action={action}
      onKeyDown={(e) => {
        // Enter en un paso intermedio avanza en vez de enviar todo.
        if (e.key === "Enter" && !ultimo && !(e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          siguiente();
        }
      }}
      className="relative mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pb-8 pt-12"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Volver"
          disabled={paso === 0}
          onClick={() => setPaso((p) => Math.max(p - 1, 0))}
          className="flex size-11 items-center justify-center rounded-2xl border border-line bg-surface disabled:opacity-40"
        >
          <Icon name="back" size={20} />
        </button>
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {PASOS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === paso ? "flex-[2]" : "flex-1"} ${i <= paso ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <span className="text-[13px] font-semibold text-muted">{paso + 1} de {PASOS.length}</span>
      </div>

      {paneles.map((p, i) => (
        <div key={i} ref={(el) => { refs.current[i] = el; }} hidden={i !== paso} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">{PASOS[i]}</span>
            <h1 className="display text-[34px] leading-[1.1]">{p.titulo}</h1>
            <p className="text-[15px] leading-relaxed text-muted">{p.texto}</p>
          </div>
          {p.cuerpo}
        </div>
      ))}

      <div className="flex-1" />
      <FormError message={state?.error} />
      {ultimo ? (
        <Submit pendingText="Guardando la ficha…">Guardar y empezar</Submit>
      ) : (
        <button type="button" onClick={siguiente} className="btn-primary">
          Continuar
        </button>
      )}
    </form>
  );
}
