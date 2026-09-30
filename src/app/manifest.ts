import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sofía",
    short_name: "Sofía",
    description: "Tomas, pañales, sueño, turnos y vacunas de tu bebé.",
    start_url: "/",
    display: "standalone",
    background_color: "#221d19",
    theme_color: "#221d19",
    lang: "es-AR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
