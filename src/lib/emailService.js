import nodemailer from 'nodemailer'
import { getNodemailerTransporter, getSecretSantaEmailTemplate } from './nodemailerConfig'

/**
 * Envía un email a un participante con su amigo invisible asignado
 * Usa Nodemailer para el envío de correos
 */
export const sendSecretSantaEmail = async (giverName, giverEmail, receiverName, roomName, receiverPreferences = null) => {
  try {
    // Obtener el transporte configurado
    const transporterConfig = getNodemailerTransporter()
    const transporter = nodemailer.createTransport(transporterConfig)

    // Generar el HTML del email
    const html = getSecretSantaEmailTemplate(giverName, receiverName, roomName, receiverPreferences)

    // Configurar el email
    const mailOptions = {
      from: import.meta.env.VITE_EMAIL_FROM || import.meta.env.VITE_EMAIL_USER,
      to: giverEmail,
      subject: `🎁 Tu Amigo Invisible - ${roomName}`,
      html: html
    }

    // Enviar email
    const info = await transporter.sendMail(mailOptions)

    console.log(`✅ Email enviado exitosamente a: ${giverEmail} (ID: ${info.messageId})`)
    return { 
      success: true, 
      data: info,
      emailId: info.messageId,
      email: giverEmail 
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
