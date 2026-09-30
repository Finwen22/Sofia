import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino del link del mail de confirmación (y de invitaciones a futuro).
// Supabase ya confirmó el email antes de mandar acá; esto solo abre la sesión.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  // Si se abrió el mail en otro navegador (ej. el celular) no hay sesión que
  // abrir, pero el email igual quedó confirmado: que ingrese con su contraseña.
  const destino = new URL(ok ? "/" : "/ingresar?aviso=confirmada", url.origin);
  return NextResponse.redirect(destino);
}
