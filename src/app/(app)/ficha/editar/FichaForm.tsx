"use client";

import { useActionState } from "react";
import { editarFicha } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";
import type { Baby } from "@/lib/types";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Opciones({ name, value, options }: { name: string; value: string | null; options: [string, string][] }) {
  return (
    <div className="flex gap-2">
      {options.map(([v, l]) => (
        <label key={v} className="opt flex-1">
          <input type="radio" name={name} value={v} defaultChecked={(value ?? "") === v} className="sr-only" />
          {l}
        </label>
      ))}
    </div>
  );
}

const triple = (v: boolean | null) => (v === null ? "" : v ? "si" : "no");

export function FichaForm({ baby: b, fecha, hora }: { baby: Baby; fecha: string; hora: string }) {
  const [state, action] = useActionState(editarFicha, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="eyebrow mt-2">Datos</h2>
      <div className="flex gap-3">
        <F label="Nombre"><input name="first_name" required defaultValue={b.first_name} className="input" /></F>
        <F label="Apellido"><input name="last_name" defaultValue={b.last_name ?? ""} className="input" /></F>
      </div>
      <Opciones name="sex" value={b.sex} options={[["femenino", "Nena"], ["masculino", "Varón"]]} />

      <h2 className="eyebrow mt-4">Nacimiento</h2>
      <div className="flex gap-3">
        <F label="Fecha"><input name="birth_date" type="date" required defaultValue={fecha} className="input" /></F>
        <F label="Hora"><input name="birth_time" type="time" defaultValue={hora} className="input" /></F>
      </div>
      <div className="flex gap-3">
        <F label="Peso (g)"><input name="birth_weight_g" inputMode="numeric" defaultValue={b.birth_weight_g ?? ""} className="input" /></F>
        <F label="Talla (cm)"><input name="birth_length_cm" inputMode="decimal" defaultValue={b.birth_length_cm ?? ""} className="input" /></F>
      </div>
      <div className="flex gap-3">
        <F label="Perím. cefálico (cm)"><input name="birth_head_cm" inputMode="decimal" defaultValue={b.birth_head_cm ?? ""} className="input" /></F>
        <F label="Semanas de gestación"><input name="gestation_weeks" inputMode="numeric" defaultValue={b.gestation_weeks ?? ""} className="input" /></F>
      </div>
      <Opciones name="delivery_type" value={b.delivery_type} options={[["natural", "Natural"], ["cesarea", "Cesárea"]]} />
      <F label="Dónde nació"><input name="birthplace" defaultValue={b.birthplace ?? ""} className="input" /></F>

      <h2 className="eyebrow mt-4">Salud</h2>
      <F label="Grupo y factor">
        <select name="blood_type" defaultValue={b.blood_type ?? ""} className="input">
          <option value="">No sé todavía</option>
          {["0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => <option key={g}>{g}</option>)}
        </select>
      </F>
      <span className="label">Pesquisa neonatal</span>
      <Opciones name="neonatal_screening" value={triple(b.neonatal_screening)} options={[["si", "Hecha"], ["no", "Pendiente"], ["", "No sé"]]} />
      <span className="label">Otoemisiones</span>
      <Opciones name="hearing_screening" value={triple(b.hearing_screening)} options={[["si", "Hecha"], ["no", "Pendiente"], ["", "No sé"]]} />
      <F label="Alergias u observaciones"><textarea name="allergies" rows={2} defaultValue={b.allergies ?? ""} className="input" /></F>
      <span className="label">Alimentación</span>
      <Opciones name="feeding_mode" value={b.feeding_mode} options={[["pecho", "Pecho"], ["mixta", "Mixta"], ["formula", "Mamadera"]]} />

      <h2 className="eyebrow mt-4">Cobertura y pediatra</h2>
      <F label="Obra social o prepaga"><input name="health_insurance" defaultValue={b.health_insurance ?? ""} className="input" /></F>
      <F label="Número de afiliada"><input name="insurance_number" defaultValue={b.insurance_number ?? ""} className="input" /></F>
      <F label="Pediatra"><input name="pediatrician_name" defaultValue={b.pediatrician_name ?? ""} className="input" /></F>
      <F label="Teléfono del pediatra"><input name="pediatrician_phone" type="tel" defaultValue={b.pediatrician_phone ?? ""} className="input" /></F>
      <F label="Notas"><textarea name="notes" rows={3} defaultValue={b.notes ?? ""} className="input" /></F>

      <FormError message={state?.error} />
      <Submit>Guardar ficha</Submit>
    </form>
  );
}
