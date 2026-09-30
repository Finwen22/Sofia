import { DeleteButton } from "@/components/DeleteButton";
import { PageHeader } from "@/components/PageHeader";
import { getContext } from "@/lib/session";
import { salir } from "@/app/(auth)/actions";
import { cancelarInvitacion, quitarMiembro } from "../actions";
import { InvitarForm, MiNombreForm } from "./Forms";
import { PushCelular, RecordatorioForm } from "./Recordatorio";

export const metadata = { title: "Ajustes · Sofía" };

export default async function Page() {
  const { supabase, member, user, baby } = await getContext();
  const esAdmin = member.role === "admin";
  const [miembros, invitaciones] = await Promise.all([
    supabase.from("family_members").select("user_id, display_name, role").eq("family_id", member.family_id).order("created_at"),
    esAdmin
      ? supabase.from("invitations").select("id, email, role").eq("family_id", member.family_id).is("accepted_at", null).order("created_at")
      : Promise.resolve({ data: [] as { id: string; email: string; role: string }[] }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Ficha" title="Ajustes" back="/ficha" />

      <section id="recordatorio" className="flex scroll-mt-6 flex-col gap-2">
        <h2 className="eyebrow mt-2">Recordatorio de tomas</h2>
        <div className="card flex flex-col gap-4 p-4">
          {baby && <RecordatorioForm activo={baby.feed_reminders} intervalo={baby.feed_interval_min} antes={baby.feed_reminder_lead_min} />}
          <div className="border-t border-line pt-4">
            <PushCelular />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow mt-2">Tu perfil</h2>
        <div className="card flex flex-col gap-3 p-4">
          <p className="text-[14px] text-muted">{user.email}</p>
          <MiNombreForm nombre={member.display_name} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow mt-2">Quiénes la cuidan</h2>
        <ul className="card px-4">
          {(miembros.data ?? []).map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
              <span className="flex min-h-11 flex-1 flex-col justify-center">
                <span className="text-[15px] font-semibold">
                  {m.display_name}
                  {m.user_id === user.id && <span className="font-normal text-muted"> (vos)</span>}
                </span>
                <span className="text-[13px] text-muted">{m.role === "admin" ? "Admin" : "Miembro"}</span>
              </span>
              {esAdmin && m.user_id !== user.id && (
                <DeleteButton action={quitarMiembro} fields={{ user_id: m.user_id }} pregunta={`¿Quitarle el acceso a ${m.display_name}?`} label="Quitar acceso" />
              )}
            </li>
          ))}
        </ul>
      </section>

      {esAdmin && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow mt-2">Dar de alta a alguien</h2>
          <div className="card flex flex-col gap-3 p-4">
            <p className="text-[14px] leading-relaxed text-muted">
              Poné su email. Cuando se registre en Sofía con ese mismo email, entra directo a la familia y ve todo lo que ustedes cargan.
            </p>
            <InvitarForm />
            {(invitaciones.data ?? []).length > 0 && (
              <ul className="flex flex-col">
                {(invitaciones.data ?? []).map((i) => (
                  <li key={i.id} className="flex items-center gap-2 border-t border-line py-1.5">
                    <span className="flex flex-1 flex-col">
                      <span className="text-[15px]">{i.email}</span>
                      <span className="text-[13px] text-muted">Esperando que se registre · {i.role === "admin" ? "Admin" : "Miembro"}</span>
                    </span>
                    <DeleteButton action={cancelarInvitacion} fields={{ id: i.id }} pregunta={`¿Cancelar la invitación a ${i.email}?`} label="Cancelar invitación" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <form action={salir} className="mt-4">
        <button className="btn-ghost">Cerrar sesión</button>
      </form>
    </>
  );
}
