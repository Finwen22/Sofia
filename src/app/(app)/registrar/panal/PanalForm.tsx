"use client";

import { startTransition, useActionState, useState } from "react";
import { guardarPanal } from "../actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";
import { COLORES, CONSISTENCIAS, avisoColor } from "@/lib/panal";
import { subirFoto } from "@/lib/foto";
import type { Diaper } from "@/lib/types";

type Props = { familyId: string; ahora: string; diasDeVida: number; panal?: Diaper; fotoUrl?: string | null };

export function PanalForm({ familyId, ahora, diasDeVida, panal, fotoUrl }: Props) {
  const [state, dispatch] = useActionState(guardarPanal, undefined);
  const [pee, setPee] = useState(panal ? panal.pee : true);
  const [poop, setPoop] = useState(panal?.poop ?? false);
  const [color, setColor] = useState<string | null>(panal?.poop_color ?? null);
  const [preview, setPreview] = useState<string | null>(fotoUrl ?? null);
  const [quitar, setQuitar] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string>();

  const aviso = poop ? avisoColor(color, diasDeVida) : null;
  const colores = COLORES.filter((c) => !c.soloPrimerosDias || diasDeVida <= 7);

  async function enviar(fd: FormData) {
    setErrorFoto(undefined);
    const foto = fd.get("foto");
    fd.delete("foto");
    if (foto instanceof File && foto.size > 0) {
      try {
        fd.set("photo_path", await subirFoto(foto, familyId, "panales"));
      } catch {
        setErrorFoto("No se pudo subir la foto. Probá de nuevo o guardá sin foto.");
        return;
      }
    }
    startTransition(() => dispatch(fd));
  }

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {panal && <input type="hidden" name="id" value={panal.id} />}
      {quitar && <input type="hidden" name="quitar_foto" value="1" />}
      <label className="flex flex-col gap-1.5">
        <span className="label">Hora</span>
        <input name="changed_at" type="datetime-local" defaultValue={ahora} className="input" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Tenía</legend>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="opt h-20 text-[17px]">
            <input type="checkbox" name="pee" checked={pee} onChange={(e) => setPee(e.target.checked)} className="sr-only" />
            Pis
          </label>
          <label className="opt h-20 text-[17px]">
            <input type="checkbox" name="poop" checked={poop} onChange={(e) => setPoop(e.target.checked)} className="sr-only" />
            Caca
          </label>
        </div>
      </fieldset>

      {poop && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Color</legend>
            <div className="grid grid-cols-2 gap-2">
              {colores.map((c) => (
                <label key={c.code} className="opt justify-start px-3 text-left text-[14px]">
                  <input type="radio" name="poop_color" value={c.code} checked={color === c.code} onChange={() => setColor(c.code)} className="sr-only" />
                  <span className="size-6 shrink-0 rounded-full border border-white/20" style={{ background: c.hex }} />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
          {aviso && (
            <p role="status" className="flex items-start gap-2 rounded-2xl bg-alert-bg px-4 py-3 text-[15px] text-alert">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              {aviso} Sacale una foto para mostrarla.
            </p>
          )}
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Consistencia</legend>
            <div className="flex flex-wrap gap-2">
              {CONSISTENCIAS.map((c) => (
                <label key={c.code} className="opt px-4">
                  <input type="radio" name="consistency" value={c.code} defaultChecked={panal?.consistency === c.code} className="sr-only" />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div className="flex flex-col gap-2">
        <span className="label">Foto para el pediatra</span>
        <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-line bg-surface text-[15px] font-semibold text-muted has-focus-visible:outline-2 has-focus-visible:outline-accent">
          <input
            type="file"
            name="foto"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
              setQuitar(false);
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Foto elegida" className="max-h-64 w-full object-cover" />
          ) : (
            <>
              <Icon name="camera" /> Sacar foto
            </>
          )}
        </label>
        <span className="flex items-center justify-between text-[13px] text-faint">
          Queda privada: solo la ven ustedes dos.
          {panal?.photo_path && preview && (
            <button type="button" onClick={() => { setQuitar(true); setPreview(null); }} className="px-2 py-1 font-semibold text-alert">
              Quitar foto
            </button>
          )}
        </span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Detalles observados</span>
        <textarea name="notes" rows={2} defaultValue={panal?.notes ?? ""} placeholder="Opcional: paspadura, olor, mucosidad…" className="input" />
      </label>

      <FormError message={errorFoto ?? state?.error} />
      <Submit>{panal ? "Guardar cambios" : "Guardar pañal"}</Submit>
    </form>
  );
}
