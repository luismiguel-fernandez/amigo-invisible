import { supabase } from './supabase'

/**
 * Envía un email a un participante con su amigo invisible asignado
 * Usa Supabase Edge Function para evitar problemas de CORS
 */
export const sendSecretSantaEmail = async (giverName, giverEmail, receiverName, roomName, receiverPreferences = null) => {
  try {
    // Llamar a la Edge Function de Supabase que maneja el envío con Resend
    const { data, error } = await supabase.functions.invoke('send-secret-santa-email', {
      body: {
        giverName,
        giverEmail,
        receiverName,
        roomName,
        receiverPreferences
      }
    })

    if (error) {
      console.error(`❌ Error enviando email a ${giverEmail}:`, error)
      return { 
        success: false, 
        error: error.message,
        email: giverEmail 
      }
    }

    if (data && data.success && data.emailId) {
      // Verificar que Resend devolvió un ID de email
      console.log(`✅ Email enviado exitosamente a: ${giverEmail} (ID: ${data.emailId})`)
      return { 
        success: true, 
        data: data.data, 
        emailId: data.emailId,
        email: giverEmail 
      }
    } else if (data && data.success) {
      // Success sin emailId (caso extraño, pero lo marcamos como warning)
      console.warn(`⚠️ Email aparentemente enviado a ${giverEmail} pero sin ID de confirmación`)
      return { 
        success: true, 
        data: data.data, 
        email: giverEmail,
        warning: 'Sin ID de confirmación de Resend'
      }
    } else {
      console.error(`❌ Error en respuesta para ${giverEmail}:`, data)
      return { 
        success: false, 
        error: data?.error || 'Error desconocido',
        resendError: data?.resendError,
        details: data?.details,
        email: giverEmail 
      }
    }
  } catch (error) {
    console.error(`❌ Error en sendSecretSantaEmail para ${giverEmail}:`, error)
    return { 
      success: false, 
      error: error.message,
      email: giverEmail 
    }
  }
}

/**
 * Envía emails a todos los participantes
 */
export const sendBulkSecretSantaEmails = async (assignments, roomName) => {
  const results = []
  
  console.log(`📧 Iniciando envío de ${assignments.length} emails...`)
  
  for (const assignment of assignments) {
    console.log(`📨 Enviando email a ${assignment.giverEmail}...`)
    
    const result = await sendSecretSantaEmail(
      assignment.giverName,
      assignment.giverEmail,
      assignment.receiverName,
      roomName,
      assignment.receiverPreferences
    )
    
    results.push({
      ...assignment,
      emailSent: result.success,
      emailError: result.error,
      emailDetails: result.details
    })
    
    // Si falló, mostrar detalles
    if (!result.success) {
      console.error(`❌ Falló email para ${assignment.giverEmail}:`, {
        error: result.error,
        resendError: result.resendError,
        details: result.details
      })
    }
    
    // Pequeña pausa entre emails para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const successCount = results.filter(r => r.emailSent).length
  const failCount = results.filter(r => !r.emailSent).length
  
  console.log(`\n📊 Resumen de envío:`)
  console.log(`   ✅ Exitosos: ${successCount}`)
  console.log(`   ❌ Fallidos: ${failCount}`)
  console.log(`   📧 Total: ${results.length}\n`)
  
  return results
}

export default {
  sendSecretSantaEmail,
  sendBulkSecretSantaEmails
}
