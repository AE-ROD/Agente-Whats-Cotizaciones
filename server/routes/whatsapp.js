// Rutas de estado y control del agente WhatsApp
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { obtenerEstado, obtenerQR } = require('../services/whatsapp');

// GET /api/whatsapp/estado
router.get('/estado', (req, res) => {
  res.json(obtenerEstado());
});

// GET /api/whatsapp/qr
router.get('/qr', (req, res) => {
  const qr = obtenerQR();
  res.json({ qr });
});

// PUT /api/whatsapp/bot — activar/desactivar el agente
router.put('/bot', (req, res) => {
  const { activo } = req.body;
  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'El campo activo debe ser true o false' });
  }
  db.prepare('UPDATE configuracion_clinica SET bot_activo = ? WHERE id = 1').run(activo ? 1 : 0);
  console.log(`[WhatsApp] Bot ${activo ? 'activado' : 'desactivado'}`);
  res.json({ bot_activo: activo });
});

module.exports = router;
