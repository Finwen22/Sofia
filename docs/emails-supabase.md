# Mails de Supabase (Authentication → Emails → Templates)

Los links usan `token_hash`: funcionan aunque el mail se abra en otro navegador
o en otro dispositivo (en iPhone, la app instalada y Safari no comparten sesión).
`/auth/confirm` valida el token en el servidor y abre la sesión.

## Confirm signup

Asunto: `Confirmá tu cuenta de Sofía`

```html
<h2>¡Hola!</h2>
<p>Tocá el botón para confirmar tu email y empezar a usar Sofía.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/">Confirmar mi cuenta</a></p>
```

## Invite user

Asunto: `Te invitaron a Sofía`

```html
<h2>Te invitaron a Sofía</h2>
<p>Tocá el botón y elegí tu contraseña para entrar.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/nueva-clave">Aceptar y elegir contraseña</a></p>
```

## Reset password

Asunto: `Elegí una contraseña nueva para Sofía`

```html
<h2>Contraseña nueva</h2>
<p>Tocá el botón para elegir una contraseña nueva. Si no lo pediste, ignorá este mail.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nueva-clave">Elegir contraseña nueva</a></p>
```

Site URL (Authentication → URL Configuration) = `https://sofia-eight-pearl.vercel.app`
