# Configuración de Nodemailer - Variables de Entorno

Para que Nodemailer funcione correctamente, necesitas configurar las siguientes variables de entorno.

## Para desarrollo local (.env.local o similar):

```env
# Configuración de Nodemailer para el cliente
VITE_EMAIL_HOST=smtp.gmail.com
VITE_EMAIL_PORT=587
VITE_EMAIL_SECURE=false
VITE_EMAIL_USER=tu-email@gmail.com
VITE_EMAIL_PASSWORD=tu-app-password
VITE_EMAIL_FROM=tu-email@gmail.com
```

## Para Supabase Edge Functions:

Configura las siguientes variables en tu proyecto de Supabase:

```env
NODEMAILER_EMAIL_HOST=smtp.gmail.com
NODEMAILER_EMAIL_PORT=587
NODEMAILER_EMAIL_USER=tu-email@gmail.com
NODEMAILER_EMAIL_PASSWORD=tu-app-password
NODEMAILER_EMAIL_FROM=tu-email@gmail.com
```

## Configuración por proveedor de email:

### Gmail (recomendado):
- Host: `smtp.gmail.com`
- Port: `587` (TLS) o `465` (SSL)
- Secure: `false` para puerto 587, `true` para 465
- Usuario: Tu email de Gmail
- Contraseña: **Contraseña de aplicación** (NO tu contraseña de Google)

**Cómo obtener la contraseña de aplicación de Gmail:**
1. Ve a tu Cuenta de Google (myaccount.google.com)
2. En el menú de la izquierda, selecciona Seguridad
3. Activa la Verificación en dos pasos si aún no está activa
4. Bajo "Contraseñas de aplicación", selecciona el tipo de aplicación (Correo) y dispositivo
5. Copia la contraseña de 16 caracteres que se genera

### Hotmail/Outlook:
- Host: `smtp-mail.outlook.com`
- Port: `587`
- Secure: `false`

### SendGrid:
- Host: `smtp.sendgrid.net`
- Port: `587`
- Usuario: `apikey`
- Contraseña: Tu clave API de SendGrid

### AWS SES:
- Host: `email-smtp.[region].amazonaws.com`
- Port: `587`
- Usuario: Tu usuario de SMTP de SES
- Contraseña: Tu contraseña de SMTP de SES

## Notas importantes:

1. **Nunca hagas commit de tus variables sensibles** a Git. Usa archivos `.env.local` que estén en `.gitignore`.

2. Para Supabase, configura las variables en:
   - Dashboard de Supabase → Settings → Edge Functions Secrets

3. Asegúrate de que tu proveedor de email permite conexiones SMTP desde tu ubicación/IP.

4. Algunos proveedores requieren permisos específicos o configuraciones adicionales para aplicaciones "menos seguras".

5. Si recibes errores de autenticación:
   - Verifica que las credenciales sean correctas
   - Para Gmail, asegúrate de usar una contraseña de aplicación (no tu contraseña normal)
   - Comprueba que el puerto coincida con la configuración de seguridad (secure)
