"use server";

import { redirect } from "next/navigation";
import { getContext } from "@/lib/session";
import { bool, dec, num, oneOf, str, triBool, type ActionState } from "@/lib/forms";
import { fromLocalInput, toDateInput } from "@/lib/time";

export async function crearFicha(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, member, baby: existente } = await getContext();
  if (existente) redirect("/");

  const nombre = str(fd, "first_name");
  const fecha = str(fd, "birth_date");
  if (!nombre) return { error: "Falta el nombre." };
  if (!fecha) return { error: "Falta la fecha de nacimiento." };
  const birthAt = fromLocalInput(`${fecha}T${str(fd, "birth_time") ?? "12:00"}`);
  if (!birthAt) return { error: "La fecha de nacimiento no es válida." };
  if (birthAt.getTime() > Date.now() + 60_000) return { error: "La fecha de nacimiento no puede ser futura." };

  const peso = num(fd, "birth_weight_g");
  const talla = dec(fd, "birth_length_cm");
  const pc = dec(fd, "birth_head_cm");

  const { data: baby, error } = await supabase
    .from("babies")
    .insert({
      family_id: member.family_id,
      first_name: nombre,
      last_name: str(fd, "last_name"),
      sex: oneOf(str(fd, "sex"), ["femenino", "masculino"] as const),
      birth_at: birthAt.toISOString(),
      birth_weight_g: peso,
      birth_length_cm: talla,
      birth_head_cm: pc,
      gestation_weeks: num(fd, "gestation_weeks"),
      delivery_type: oneOf(str(fd, "delivery_type"), ["natural", "cesarea"] as const),
      birthplace: str(fd, "birthplace"),
      blood_type: str(fd, "blood_type"),
      neonatal_screening: triBool(fd, "neonatal_screening"),
      hearing_screening: triBool(fd, "hearing_screening"),
      allergies: str(fd, "allergies"),
      health_insurance: str(fd, "health_insurance"),
      insurance_number: str(fd, "insurance_number"),
      pediatrician_name: str(fd, "pediatrician_name"),
      pediatrician_phone: str(fd, "pediatrician_phone"),
      feeding_mode: oneOf(str(fd, "feeding_mode"), ["pecho", "mixta", "formula"] as const),
    })
    .select("id")
    .single();
  if (error || !baby) return { error: "No pudimos guardar la ficha. Revisá los datos (peso en gramos, talla en cm)." };

  const nacio = toDateInput(birthAt);
  const extras = [];
  if (peso || talla || pc) {
    extras.push(
      supabase.from("growth_records").insert({
        family_id: member.family_id, baby_id: baby.id, measured_on: nacio,
        weight_g: peso, length_cm: talla, head_cm: pc, notes: "Al nacer",
      }),
    );
  }
  const vacunas = ["bcg", "hb-rn"].filter((c) => bool(fd, `vac_${c}`));
  if (vacunas.length) {
    extras.push(
      supabase.from("vaccine_doses").insert(
        vacunas.map((code) => ({
          family_id: member.family_id, baby_id: baby.id, vaccine_code: code, applied_on: nacio, place: str(fd, "birthplace"),
        })),
      ),
    );
  }
  await Promise.all(extras);
  redirect("/");
}
