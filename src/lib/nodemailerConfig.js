/**
 * Configuración de Nodemailer para envío de emails
 */

export const getNodemailerTransporter = () => {
  // Configurar el transporte según el proveedor
  // Este ejemplo usa Gmail, pero puedes configurar otros proveedores
  
  const transporter = {
    // Para Gmail
    host: import.meta.env.VITE_EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(import.meta.env.VITE_EMAIL_PORT || '587'),
    secure: import.meta.env.VITE_EMAIL_SECURE === 'true' || false, // true para 465, false para otros puertos
    auth: {
      user: import.meta.env.VITE_EMAIL_USER,
      pass: import.meta.env.VITE_EMAIL_PASSWORD
    }
  }

  // Validar que tenemos las variables de entorno necesarias
  if (!transporter.auth.user || !transporter.auth.pass) {
    throw new Error('Variables de entorno VITE_EMAIL_USER y VITE_EMAIL_PASSWORD no configuradas')
  }

  return transporter
}

/**
 * Plantilla HTML del email de Secret Santa
 */
export const getSecretSantaEmailTemplate = (giverName, receiverName, roomName, receiverPreferences = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu Amigo Invisible</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; text-align: center; color: white;">
        <div style="font-size: 4em; margin-bottom: 20px;">🎅</div>
        <h1 style="margin: 0 0 10px; font-size: 2em;">¡Hola ${giverName}!</h1>
        <p style="font-size: 1.2em; margin: 20px 0;">Tu amigo invisible es:</p>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 30px; margin: 30px 0;">
          <div style="font-size: 2.5em; font-weight: bold; margin-bottom: 10px;">🎁</div>
          <div style="font-size: 1.8em; font-weight: bold; letter-spacing: 2px;">${receiverName}</div>
        </div>
        ${receiverPreferences ? `
        <div style="background: rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
          <p style="font-size: 1em; margin: 0 0 10px; font-weight: bold;">🎁 Sus gustos/preferencias:</p>
          <p style="font-size: 0.95em; margin: 0; white-space: pre-wrap;">${receiverPreferences}</p>
        </div>
        ` : ''}
        <p style="font-size: 0.9em; opacity: 0.9; margin-top: 30px;">
          Sala: ${roomName}<br>
          ¡Recuerda mantenerlo en secreto! 🤫
        </p>
      </div>
      <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 0.85em;">
        <p>Este email fue generado automáticamente por la aplicación Amigo Invisible</p>
        <p style="margin-top: 10px;">🎄 ¡Felices fiestas! 🎄</p>
      </div>
    </body>
    </html>
  `
}
