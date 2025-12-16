import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

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

    // Verificar que tenemos la API key
    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY no configurada en Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Inicializar Resend
    const resend = new Resend(apiKey)

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
    const { data, error } = await resend.emails.send({
      from: 'Amigo Invisible <onboarding@resend.dev>',
      to: [giverEmail],
      subject: `🎁 Tu Amigo Invisible - ${roomName}`,
      html: html,
    })

    if (error) {
      console.error('Error de Resend:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Error al enviar email',
          resendError: error,
          email: giverEmail
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar que Resend devolvió un ID de email (confirmación de envío)
    if (!data || !data.id) {
      console.error('Resend no devolvió un ID de email para:', giverEmail)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Resend no confirmó el envío del email',
          email: giverEmail,
          resendData: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Email enviado con éxito a:', giverEmail, 'ID:', data.id)
    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        emailId: data.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error en Edge Function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Error desconocido', details: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
