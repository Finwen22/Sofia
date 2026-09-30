"use client";

import { createClient } from "@/lib/supabase/client";

/** Achica la foto (lado mayor 1600 px, JPEG) para que suba rápido con datos móviles. */
async function comprimir(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Sube una foto privada a <familia>/<carpeta>/ y devuelve su ruta. */
export async function subirFoto(file: File, familyId: string, carpeta: string): Promise<string> {
  const blob = await comprimir(file);
  const ruta = `${familyId}/${carpeta}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient().storage.from("fotos").upload(ruta, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return ruta;
}
