// Webhook de Twilio para WhatsApp
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { db } = require('../db');
const { procesarMensaje } = require('../services/openai');

// Rate limiting por número de teléfono (30 req/min)
const rateLimitStore = new Map();
function verificarRateLimit(numero) {
  const ahora = Date.now();
  const ventana = 60 * 1000; // 1 minuto
  const limite = 30;

  if (!rateLimitStore.has(numero)) {
    rateLimitStore.set(numero, { contador: 1, inicio: ahora });
    return true;
  }

  const datos = rateLimitStore.get(numero);
  if (ahora - datos.inicio > ventana) {
    rateLimitStore.set(numero, { contador: 1, inicio: ahora });
    return true;
  }

  if (datos.contador >= limite) return false;

  datos.contador++;
  return true;
}

// Limpiar rate limit store periódicamente
setInterval(() => {
  const ahora = Date.now();
  for (const [numero, datos] of rateLimitStore.entries()) {
    if (ahora - datos.inicio > 60 * 1000) {
      rateLimitStore.delete(numero);
    }
  }
}, 5 * 60 * 1000);

// POST /api/webhook/whatsapp
router.post('/whatsapp', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const { Body: bodyMensaje, From: fromNumero } = req.body;

    if (!bodyMensaje || !fromNumero) {
      return res.status(400).send('<Response></Response>');
    }

    // Limpiar prefijo whatsapp:
    const numero = fromNumero.replace('whatsapp:', '').trim();
    const mensaje = bodyMensaje.trim();

    console.log(`[${timestamp}] [Webhook] Mensaje recibido de ${numero}: "${mensaje.substring(0, 100)}"`);

    // Verificar rate limit
    if (!verificarRateLimit(numero)) {
      console.log(`[${timestamp}] [Webhook] Rate limit alcanzado para ${numero}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>Por favor esperá un momento antes de enviar más mensajes. 🙏</Message></Response>`;
      return res.type('text/xml').send(twiml);
    }

    // Detectar respuestas de aceptación/rechazo de cotización
    const mensajeNormalizado = mensaje
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

    if (mensajeNormalizado === 'ACEPTAR') {
      const cotizacion = db.prepare(`
        SELECT * FROM cotizaciones
        WHERE numero_telefono = ? AND estado = 'enviada'
        ORDER BY creado_en DESC LIMIT 1
      `).get(numero);

      if (cotizacion) {
        db.prepare("UPDATE cotizaciones SET estado = 'aceptada' WHERE id = ?").run(cotizacion.id);
        console.log(`[${timestamp}] [Webhook] Cotización ${cotizacion.numero_cotizacion} ACEPTADA por ${numero}`);

        const respuesta = `✅ ¡Perfecto! Tu cotización N° ${cotizacion.numero_cotizacion} ha sido aceptada. Nos pondremos en contacto para confirmar el turno. ¡Muchas gracias!`;
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${respuesta}</Message></Response>`;
        return res.type('text/xml').send(twiml);
      }
    }

    if (mensajeNormalizado === 'RECHAZAR') {
      const cotizacion = db.prepare(`
        SELECT * FROM cotizaciones
        WHERE numero_telefono = ? AND estado = 'enviada'
        ORDER BY creado_en DESC LIMIT 1
      `).get(numero);

      if (cotizacion) {
        db.prepare("UPDATE cotizaciones SET estado = 'rechazada' WHERE id = ?").run(cotizacion.id);
        console.log(`[${timestamp}] [Webhook] Cotización ${cotizacion.numero_cotizacion} RECHAZADA por ${numero}`);

        const respuesta = `Entendido, hemos marcado la cotización N° ${cotizacion.numero_cotizacion} como rechazada. Si necesitás algo más o querés una nueva cotización, escribinos. 😊`;
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${respuesta}</Message></Response>`;
        return res.type('text/xml').send(twiml);
      }
    }

    // Guardar mensaje del usuario
    db.prepare(`
      INSERT INTO mensajes_whatsapp (numero_telefono, contenido_mensaje, remitente, tipo_mensaje)
      VALUES (?, ?, 'usuario', 'texto')
    `).run(numero, mensaje);

    // Obtener historial (últimos 20 mensajes)
    const historial = db.prepare(`
      SELECT contenido_mensaje, remitente FROM mensajes_whatsapp
      WHERE numero_telefono = ?
      ORDER BY recibido_en DESC LIMIT 20
    `).all(numero).reverse();

    // Obtener config de la clínica
    const config = db.prepare('SELECT * FROM configuracion_clinica LIMIT 1').get();

    // Llamar al servicio de OpenAI
    console.log(`[${timestamp}] [Webhook] Llamando a OpenAI para ${numero}`);
    const respuestaIA = await procesarMensaje(numero, mensaje, historial.slice(0, -1), config);

    // Guardar respuesta del asistente
    db.prepare(`
      INSERT INTO mensajes_whatsapp (numero_telefono, contenido_mensaje, remitente, tipo_mensaje, procesado)
      VALUES (?, ?, 'asistente', 'texto', 1)
    `).run(numero, respuestaIA);

    console.log(`[${timestamp}] [Webhook] Respuesta enviada a ${numero}: "${respuestaIA.substring(0, 100)}"`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${respuestaIA}</Message></Response>`;
    return res.type('text/xml').send(twiml);

  } catch (error) {
    console.error(`[${timestamp}] [Webhook] Error:`, error);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>Ocurrió un error inesperado. Por favor intentá de nuevo en unos momentos. 🙏</Message></Response>`;
    return res.type('text/xml').send(twiml);
  }
});

module.exports = router;
