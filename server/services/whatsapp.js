// Servicio de WhatsApp via Baileys (multi-device, sin Chromium)

const path = require('path');
const qrcode = require('qrcode');
const { db } = require('../db');
const { procesarMensaje } = require('./openai');
const { generarPdfCotizacion } = require('../utils/cotizacion-pdf');

let sock = null;
let qrActual = null;
let estadoConexion = 'desconectado';

const AUTH_PATH = process.env.AUTH_PATH || path.join(process.cwd(), 'whatsapp-auth');

// Rate limiting por número
const rateLimitStore = new Map();
function verificarRateLimit(numero) {
  const ahora = Date.now();
  const ventana = 60 * 1000;
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

setInterval(() => {
  const ahora = Date.now();
  for (const [numero, datos] of rateLimitStore.entries()) {
    if (ahora - datos.inicio > 60 * 1000) rateLimitStore.delete(numero);
  }
}, 5 * 60 * 1000);

async function manejarMensaje(message) {
  if (message.key.fromMe) return;

  const remoteJid = message.key.remoteJid;
  if (!remoteJid || remoteJid.endsWith('@g.us')) return;

  const config = db.prepare('SELECT * FROM configuracion_clinica LIMIT 1').get();
  if (!config?.bot_activo) return;

  const timestamp = new Date().toISOString();
  // Extraer solo el número para la DB (sin el sufijo @s.whatsapp.net / @lid)
  const numero = remoteJid.split('@')[0];
  const mensaje = (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    ''
  ).trim();

  if (!mensaje) return;

  console.log(`[${timestamp}] [WhatsApp] Mensaje de ${numero}: "${mensaje.substring(0, 100)}"`);

  if (!verificarRateLimit(numero)) {
    await enviarMensaje(remoteJid, 'Por favor esperá un momento antes de enviar más mensajes. 🙏');
    return;
  }

  const normalizado = mensaje.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  if (normalizado === 'ACEPTAR') {
    const cotizacion = db.prepare(`
      SELECT * FROM cotizaciones
      WHERE numero_telefono = ? AND estado = 'enviada'
      ORDER BY creado_en DESC LIMIT 1
    `).get(numero);
    if (cotizacion) {
      db.prepare("UPDATE cotizaciones SET estado = 'aceptada' WHERE id = ?").run(cotizacion.id);
      await enviarMensaje(remoteJid, `✅ ¡Perfecto! Tu cotización N° ${cotizacion.numero_cotizacion} ha sido aceptada. Nos pondremos en contacto para confirmar el turno. ¡Muchas gracias!`);
      return;
    }
  }

  if (normalizado === 'RECHAZAR') {
    const cotizacion = db.prepare(`
      SELECT * FROM cotizaciones
      WHERE numero_telefono = ? AND estado = 'enviada'
      ORDER BY creado_en DESC LIMIT 1
    `).get(numero);
    if (cotizacion) {
      db.prepare("UPDATE cotizaciones SET estado = 'rechazada' WHERE id = ?").run(cotizacion.id);
      await enviarMensaje(remoteJid, `Entendido, hemos marcado la cotización N° ${cotizacion.numero_cotizacion} como rechazada. Si necesitás algo más, escribinos. 😊`);
      return;
    }
  }

  // Registrar o actualizar contacto y contar visitas
  db.prepare(`
    INSERT INTO contactos (numero_telefono, total_visitas, ultima_actividad)
    VALUES (?, 1, datetime('now', 'localtime'))
    ON CONFLICT(numero_telefono) DO UPDATE SET
      total_visitas = total_visitas + 1,
      ultima_actividad = datetime('now', 'localtime')
  `).run(numero);

  db.prepare(`
    INSERT INTO mensajes_whatsapp (numero_telefono, contenido_mensaje, remitente, tipo_mensaje)
    VALUES (?, ?, 'usuario', 'texto')
  `).run(numero, mensaje);

  const historial = db.prepare(`
    SELECT contenido_mensaje, remitente FROM mensajes_whatsapp
    WHERE numero_telefono = ?
    ORDER BY recibido_en DESC LIMIT 20
  `).all(numero).reverse();

  console.log(`[${timestamp}] [WhatsApp] Llamando a OpenAI para ${numero}`);
  const { respuesta: respuestaIA, cotizacionId } = await procesarMensaje(numero, mensaje, historial.slice(0, -1), config);

  db.prepare(`
    INSERT INTO mensajes_whatsapp (numero_telefono, contenido_mensaje, remitente, tipo_mensaje, procesado)
    VALUES (?, ?, 'asistente', 'texto', 1)
  `).run(numero, respuestaIA);

  await enviarMensaje(remoteJid, respuestaIA);
  console.log(`[${timestamp}] [WhatsApp] Respuesta enviada a ${numero}`);

  // Enviar PDF si se generó una cotización
  if (cotizacionId && sock && estadoConexion === 'conectado') {
    try {
      const cotizacion = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(cotizacionId);
      const items = db.prepare('SELECT * FROM items_cotizacion WHERE cotizacion_id = ?').all(cotizacionId);
      const pdfBuffer = await generarPdfCotizacion(cotizacion, items, config);
      const jidFinal = remoteJid.includes('@') ? remoteJid : `${remoteJid}@s.whatsapp.net`;
      await sock.sendMessage(jidFinal, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `Cotizacion-${cotizacion.numero_cotizacion}.pdf`,
        caption: '📄 Tu cotización en PDF',
      });
      console.log(`[${timestamp}] [WhatsApp] PDF enviado para cotización ${cotizacion.numero_cotizacion}`);
    } catch (pdfErr) {
      console.error('[WhatsApp] Error enviando PDF:', pdfErr.message);
    }
  }
}

async function iniciar() {
  // Importación dinámica porque Baileys es ESM
  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = await import('@whiskeysockets/baileys');
  const { default: pino } = await import('pino');

  estadoConexion = 'esperando_qr';
  console.log('[WhatsApp] Iniciando Baileys...');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Klin', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrActual = await qrcode.toDataURL(qr);
      estadoConexion = 'esperando_qr';
      console.log('[WhatsApp] QR listo — escanealo desde el dashboard');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const fueDeslogeado = statusCode === DisconnectReason.loggedOut;

      if (fueDeslogeado) {
        estadoConexion = 'desconectado';
        qrActual = null;
        console.log('[WhatsApp] Sesión cerrada. Necesitás escanear el QR de nuevo.');
        // Reconectar para generar nuevo QR
        setTimeout(iniciar, 2000);
      } else {
        console.log('[WhatsApp] Conexión perdida, reconectando...');
        setTimeout(iniciar, 3000);
      }
    } else if (connection === 'open') {
      qrActual = null;
      estadoConexion = 'conectado';
      console.log('[WhatsApp] ¡Conectado exitosamente!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const message of messages) {
      try {
        await manejarMensaje(message);
      } catch (err) {
        console.error('[WhatsApp] Error procesando mensaje:', err.message);
        try {
          const jid = message.key?.remoteJid;
          if (jid && !message.key?.fromMe) {
            await sock.sendMessage(jid, { text: 'Ocurrió un error. Por favor intentá de nuevo en un momento. 🙏' });
          }
        } catch (_) {}
      }
    }
  });
}

async function enviarMensaje(jid, mensaje) {
  if (!sock || estadoConexion !== 'conectado') {
    console.log('[WhatsApp] Sin conexión, modo simulación');
    return;
  }
  // Si ya tiene @ es un JID completo, si no agregar sufijo estándar
  const jidFinal = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
  await sock.sendMessage(jidFinal, { text: mensaje });
}

function obtenerEstado() {
  const config = db.prepare('SELECT bot_activo FROM configuracion_clinica LIMIT 1').get();
  return {
    estado: estadoConexion,
    conectado: estadoConexion === 'conectado',
    bot_activo: config?.bot_activo === 1,
  };
}

function obtenerQR() {
  return qrActual;
}

module.exports = { iniciar, enviarMensaje, obtenerEstado, obtenerQR };
