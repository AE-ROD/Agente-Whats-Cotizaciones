// Rutas de mensajes de WhatsApp
const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/mensajes — Últimos 50 mensajes
router.get('/', (req, res) => {
  try {
    const mensajes = db.prepare(`
      SELECT m.*, c.nombre as nombre_contacto
      FROM mensajes_whatsapp m
      LEFT JOIN contactos c ON m.numero_telefono = c.numero_telefono
      ORDER BY m.recibido_en DESC
      LIMIT 100
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

// DELETE /api/mensajes/:numero — Eliminar conversación de un número
router.delete('/:numero', (req, res) => {
  try {
    const { numero } = req.params;
    db.prepare('DELETE FROM mensajes_whatsapp WHERE numero_telefono = ?').run(numero);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar conversación', detalle: error.message });
  }
});

module.exports = router;
