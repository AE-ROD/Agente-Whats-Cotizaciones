// Rutas de mensajes de WhatsApp
const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/mensajes — Últimos 50 mensajes
router.get('/', (req, res) => {
  try {
    const mensajes = db.prepare(`
      SELECT * FROM mensajes_whatsapp
      ORDER BY recibido_en DESC
      LIMIT 50
    `).all();
    res.json(mensajes);
  } catch (error) {
    console.error('[Mensajes] Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes', detalle: error.message });
  }
});

// GET /api/mensajes/:numero — Mensajes de un número específico
router.get('/:numero', (req, res) => {
  try {
    const { numero } = req.params;
    const mensajes = db.prepare(`
      SELECT * FROM mensajes_whatsapp
      WHERE numero_telefono = ?
      ORDER BY recibido_en ASC
    `).all(numero);
    res.json(mensajes);
  } catch (error) {
    console.error('[Mensajes] Error al obtener mensajes del número:', error);
    res.status(500).json({ error: 'Error al obtener mensajes', detalle: error.message });
  }
});

module.exports = router;
