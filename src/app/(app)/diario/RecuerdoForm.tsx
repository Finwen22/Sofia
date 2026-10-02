"use client";

import { startTransition, useActionState, useState } from "react";
import { guardarRecuerdo } from "./actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";
import { subirFoto } from "@/lib/foto";
import { etiquetaHito, HITOS, MAX_FOTOS } from "@/lib/hitos";
import type { DiaryEntry } from "@/lib/types";

type FotoExistente = { id: string; url: string };
type Props = {
  familyId: string;
  hoy: string;
  nacio: string;
  recuerdo?: DiaryEntry;
  fotos?: FotoExistente[];
  hitoInicial?: string | null;
  hitosUsados: string[];
};

export function RecuerdoForm({ familyId, hoy, nacio, recuerdo, fotos = [], hitoInicial, hitosUsados }: Props) {
  const [state, dispatch] = useActionState(guardarRecuerdo, undefined);
  const [hito, setHito] = useState<string>(recuerdo?.milestone ?? hitoInicial ?? "");
  const [nuevas, setNuevas] = useState<{ file: File; url: string }[]>([]);
  const [quitar, setQuitar] = useState<string[]>([]);
  const [progreso, setProgreso] = useState<string>();
  const [errorFoto, setErrorFoto] = useState<string>();

  const quedan = fotos.filter((f) => !quitar.includes(f.id)).length;
  const lugar = MAX_FOTOS - quedan - nuevas.length;
  const disponibles = HITOS.filter((h) => h.code === recuerdo?.milestone || !hitosUsados.includes(h.code));

  async function enviar(fd: FormData) {
    setErrorFoto(undefined);
    fd.delete("fotos");
    try {
      for (let i = 0; i < nuevas.length; i++) {
        setProgreso(`Subiendo foto ${i + 1} de ${nuevas.length}…`);
        fd.append("photo_paths", await subirFoto(nuevas[i].file, familyId, "diario"));
      }
    } catch {
      setProgreso(undefined);
      setErrorFoto("No se pudo subir una foto. Probá de nuevo.");
      return;
    }
    setProgreso(undefined);
    quitar.forEach((id) => fd.append("quitar_fotos", id));
    startTransition(() => dispatch(fd));
  }

  return (
    <form action={enviar} className="flex flex-col gap-4">
      {recuerdo && <input type="hidden" name="id" value={recuerdo.id} />}

      <label className="flex flex-col gap-1.5">
        <span className="label">¿Es una primera vez?</span>
        <select name="milestone" value={hito} onChange={(e) => setHito(e.target.value)} className="input">
          <option value="">No, es un recuerdo</option>
          {disponibles.map((h) => (
            <option key={h.code} value={h.code}>{h.label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Título</span>
        <input
          name="title"
          key={hito}
          defaultValue={recuerdo?.title ?? etiquetaHito(hito) ?? ""}
          required
          placeholder="Ej.: la visita de los abuelos"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Fecha</span>
        <input name="happened_on" type="date" required min={nacio} max={hoy} defaultValue={recuerdo?.happened_on ?? hoy} className="input" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Qué pasó</span>
        <textarea name="body" rows={4} defaultValue={recuerdo?.body ?? ""} placeholder="Lo que no te querés olvidar…" className="input" />
      </label>

      <div className="flex flex-col gap-2">
        <span className="label">Fotos ({quedan + nuevas.length} de {MAX_FOTOS})</span>
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => {
            const fuera = quitar.includes(f.id);
            return (
              <div key={f.id} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" className={`size-full object-cover ${fuera ? "opacity-25" : ""}`} />
                <button
                  type="button"
                  onClick={() => setQuitar((xs) => (fuera ? xs.filter((x) => x !== f.id) : [...xs, f.id]))}
                  aria-label={fuera ? "Volver a poner la foto" : "Quitar foto"}
                  className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-bg/80 text-ink"
                >
                  <Icon name={fuera ? "plus" : "close"} size={16} stroke={2} />
                </button>
              </div>
            );
          })}
          {nuevas.map((n, i) => (
            <div key={n.url} className="relative aspect-square overflow-hidden rounded-xl border border-accent/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setNuevas((xs) => xs.filter((_, j) => j !== i))}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-bg/80 text-ink"
              >
                <Icon name="close" size={16} stroke={2} />
              </button>
            </div>
          ))}
          {lugar > 0 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface text-[13px] font-semibold text-muted has-focus-visible:outline-2 has-focus-visible:outline-accent">
              <input
                type="file"
                name="fotos"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])].slice(0, lugar);
                  setNuevas((xs) => [...xs, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
                  e.target.value = "";
                }}
              />
              <Icon name="camera" />
              Agregar
            </label>
          )}
        </div>
        <span className="text-[13px] text-faint">Quedan privadas: solo las ve la familia.</span>
      </div>

      {progreso && <p role="status" className="text-[14px] text-accent">{progreso}</p>}
      <FormError message={errorFoto ?? state?.error} />
      <Submit pendingText="Guardando…">{recuerdo ? "Guardar cambios" : "Guardar recuerdo"}</Submit>
    </form>
  );
}
