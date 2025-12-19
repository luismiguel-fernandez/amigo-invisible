import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import nodemailer from 'npm:nodemailer@7.0.11'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { giverName, giverEmail, receiverName, roomName, receiverPreferences } = await req.json()

    // Verificar que tenemos todos los datos
    if (!giverName || !giverEmail || !receiverName || !roomName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Faltan datos requeridos',
          received: { giverName, giverEmail, receiverName, roomName }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Obtener configuración de Nodemailer desde variables de entorno
    const emailUser = Deno.env.get('NODEMAILER_EMAIL_USER')
    const emailPassword = Deno.env.get('NODEMAILER_EMAIL_PASSWORD')
    const emailHost = Deno.env.get('NODEMAILER_EMAIL_HOST') || 'smtp.gmail.com'
    const emailPort = parseInt(Deno.env.get('NODEMAILER_EMAIL_PORT') || '587')
    const emailFrom = Deno.env.get('NODEMAILER_EMAIL_FROM') || emailUser

    if (!emailUser || !emailPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuración de Nodemailer no disponible en Supabase' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Crear el transporte de Nodemailer
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    })

    // HTML del email
    const html = `
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

    // Enviar email
    const info = await transporter.sendMail({
      from: emailFrom,
      to: giverEmail,
      subject: `🎁 Tu Amigo Invisible - ${roomName}`,
      html: html,
    })

    console.log('Email enviado con éxito a:', giverEmail, 'ID:', info.messageId)
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: info,
        emailId: info.messageId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error en Edge Function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Error desconocido', 
        details: String(error) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
