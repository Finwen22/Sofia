@AGENTS.md

# Sofía

App personal (PWA) para seguir a una bebé recién nacida: ficha, tomas, pañales (con foto),
sueño, notas/preguntas para el pediatra, turnos, vacunas (calendario nacional AR),
crecimiento y lista de compras. Uso de a dos (la familia); se invita gente desde Ajustes.

- Stack: Next.js 16 (App Router, `src/proxy.ts`), React 19, Tailwind v4, Supabase (Auth, Postgres, Storage), Vercel.
- Diseño oscuro con 6 combinaciones pastel elegibles por persona (`src/lib/temas.ts`, columna `family_members.theme` + cookie `tema` → `data-tema` en <html>); "Arena" es la de base (tokens en `src/app/globals.css`), tipografía Nunito (títulos 800 vía `.display`, texto 400–700). Luces flotantes (`<Orbs/>`) solo en ingreso y alta.
- Hora: todo en `America/Argentina/Buenos_Aires` vía `src/lib/time.ts`; nunca `toISOString().slice(0,10)` para fechas.
- Datos: todo cuelga de `family_id`; RLS con `is_member()`. Registros llevan FK compuesta `(baby_id, family_id)`.
- Migraciones en `supabase/migrations/`, se aplican a mano en el SQL Editor de Supabase.
- La app registra y avisa; nunca diagnostica. Textos de aviso siempre terminan en "consultá al pediatra".
