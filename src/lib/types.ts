export type Baby = {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string | null;
  sex: "femenino" | "masculino" | null;
  birth_at: string;
  birth_weight_g: number | null;
  birth_length_cm: number | null;
  birth_head_cm: number | null;
  gestation_weeks: number | null;
  delivery_type: "natural" | "cesarea" | null;
  birthplace: string | null;
  blood_type: string | null;
  neonatal_screening: boolean | null;
  hearing_screening: boolean | null;
  allergies: string | null;
  health_insurance: string | null;
  insurance_number: string | null;
  pediatrician_name: string | null;
  pediatrician_phone: string | null;
  feeding_mode: "pecho" | "mixta" | "formula" | null;
  notes: string | null;
};

export type Feeding = {
  id: string;
  kind: "pecho" | "mamadera";
  side: "izquierdo" | "derecho" | "ambos" | null;
  milk: "materna" | "formula" | null;
  amount_ml: number | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
};

export type Diaper = {
  id: string;
  changed_at: string;
  pee: boolean;
  poop: boolean;
  poop_color: string | null;
  consistency: string | null;
  notes: string | null;
  photo_path: string | null;
};

export type Sleep = { id: string; started_at: string; ended_at: string | null; notes: string | null };

export type Note = { id: string; body: string; for_doctor: boolean; resolved: boolean; created_at: string };

export type Appointment = {
  id: string;
  scheduled_at: string;
  kind: string;
  professional: string | null;
  place: string | null;
  notes: string | null;
  outcome: string | null;
  done: boolean;
};

export type Growth = {
  id: string;
  measured_on: string;
  weight_g: number | null;
  length_cm: number | null;
  head_cm: number | null;
  notes: string | null;
};

export type VaccineDose = { id: string; vaccine_code: string; applied_on: string; lot: string | null; place: string | null };

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  category: string;
  done: boolean;
};
