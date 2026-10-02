import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { colorFondo, cssTemas, temaValido } from "@/lib/temas";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sofía",
  description: "Tomas, pañales, sueño, turnos y vacunas de tu bebé, en un solo lugar.",
  appleWebApp: { capable: true, title: "Sofía", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

async function temaActual() {
  return temaValido((await cookies()).get("tema")?.value);
}

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: colorFondo(await temaActual()),
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = await temaActual();
  return (
    <html lang="es-AR" data-tema={tema} className={`${nunito.variable} h-full antialiased`}>
      <head>
        {/* Colores de cada combinación (el tema elegido va en data-tema). */}
        <style>{cssTemas()}</style>
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
