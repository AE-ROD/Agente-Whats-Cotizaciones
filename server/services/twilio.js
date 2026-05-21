// Servicio de Twilio para enviar mensajes de WhatsApp

const twilio = require('twilio');

function enviarMensajeWhatsapp(numeroDestino, mensaje) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const numeroTwilio = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    console.log('[Twilio] Credenciales no configuradas, modo simulación');
    return Promise.resolve({ sid: 'SIMULADO' });
  }

  const client = twilio(accountSid, authToken);

  const numeroFormateado = numeroDestino.startsWith('whatsapp:')
    ? numeroDestino
    : `whatsapp:${numeroDestino}`;

  return client.messages.create({
    body: mensaje,
    from: numeroTwilio,
    to: numeroFormateado,
  });
}

module.exports = { enviarMensajeWhatsapp };
