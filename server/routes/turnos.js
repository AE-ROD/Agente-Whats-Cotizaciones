// Rutas de turnos
const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/turnos — Todos los turnos
router.get('/', (req, res) => {
  try {
    const turnos = db.prepare(`
      SELECT * FROM turnos ORDER BY fecha_turno DESC
    `).all();
    res.json(turnos);
  } catch (error) {
    console.error('[Turnos] Error al obtener turnos:', error);
    res.status(500).json({ error: 'Error al obtener turnos', detalle: error.message });
  }
});

// GET /api/turnos/:fecha — Turnos de una fecha específica (YYYY-MM-DD)
router.get('/:fecha', (req, res) => {
  try {
    const { fecha } = req.params;
    const turnos = db.prepare(`
      SELECT * FROM turnos
      WHERE date(fecha_turno) = date(?)
      ORDER BY fecha_turno ASC
    `).all(fecha);
    res.json(turnos);
  } catch (error) {
    console.error('[Turnos] Error al obtener turnos por fecha:', error);
    res.status(500).json({ error: 'Error al obtener turnos', detalle: error.message });
  }
});

// POST /api/turnos — Crear turno manualmente
router.post('/', (req, res) => {
  try {
    const { numero_telefono, nombre_paciente, fecha_turno, tipo_turno, estado, notas } = req.body;

    if (!numero_telefono || !fecha_turno || !tipo_turno) {
      return res.status(400).json({ error: 'Campos requeridos: numero_telefono, fecha_turno, tipo_turno' });
    }

    const resultado = db.prepare(`
      INSERT INTO turnos (numero_telefono, nombre_paciente, fecha_turno, tipo_turno, estado, notas)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      numero_telefono,
      nombre_paciente || null,
      fecha_turno,
      tipo_turno,
      estado || 'pendiente',
      notas || null
    );

    const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(turno);
  } catch (error) {
    console.error('[Turnos] Error al crear turno:', error);
    res.status(500).json({ error: 'Error al crear turno', detalle: error.message });
  }
});

// PATCH /api/turnos/:id — Actualizar estado de turno
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id);
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

    const estadosValidos = ['pendiente', 'confirmado', 'cancelado', 'completado'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
    }

    db.prepare(`
      UPDATE turnos SET
        estado = COALESCE(?, estado),
        notas = COALESCE(?, notas)
      WHERE id = ?
    `).run(estado || null, notas || null, id);

    const turnoActualizado = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id);
    res.json(turnoActualizado);
  } catch (error) {
    console.error('[Turnos] Error al actualizar turno:', error);
    res.status(500).json({ error: 'Error al actualizar turno', detalle: error.message });
  }
});

module.exports = router;
