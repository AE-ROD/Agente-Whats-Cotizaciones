// Rutas de configuración de la clínica
const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/configuracion
router.get('/', (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM configuracion_clinica LIMIT 1').get();
    res.json(config);
  } catch (error) {
    console.error('[Config] Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración', detalle: error.message });
  }
});

// PUT /api/configuracion
router.put('/', (req, res) => {
  try {
    const { nombre_clinica, direccion, telefono, email, horarios, servicios, sobre_clinica, webhook_url } = req.body;

    db.prepare(`
      UPDATE configuracion_clinica SET
        nombre_clinica = COALESCE(?, nombre_clinica),
        direccion = COALESCE(?, direccion),
        telefono = COALESCE(?, telefono),
        email = COALESCE(?, email),
        horarios = COALESCE(?, horarios),
        servicios = COALESCE(?, servicios),
        sobre_clinica = COALESCE(?, sobre_clinica),
        webhook_url = COALESCE(?, webhook_url)
      WHERE id = 1
    `).run(
      nombre_clinica || null,
      direccion || null,
      telefono || null,
      email || null,
      horarios || null,
      servicios || null,
      sobre_clinica || null,
      webhook_url || null
    );

    const config = db.prepare('SELECT * FROM configuracion_clinica LIMIT 1').get();
    res.json(config);
  } catch (error) {
    console.error('[Config] Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración', detalle: error.message });
  }
});

module.exports = router;
