// Rutas de contactos / pacientes
const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/contactos
router.get('/', (req, res) => {
  try {
    const { buscar } = req.query;

    let query = `
      SELECT
        c.*,
        COUNT(DISTINCT m.id)   as total_mensajes,
        COUNT(DISTINCT t.id)   as total_turnos,
        COUNT(DISTINCT cot.id) as total_cotizaciones,
        COALESCE(SUM(CASE WHEN cot.estado = 'aceptada' THEN cot.total ELSE 0 END), 0) as monto_aceptado
      FROM contactos c
      LEFT JOIN mensajes_whatsapp m   ON m.numero_telefono = c.numero_telefono
      LEFT JOIN turnos t              ON t.numero_telefono = c.numero_telefono AND t.estado != 'cancelado'
      LEFT JOIN cotizaciones cot      ON cot.numero_telefono = c.numero_telefono
      WHERE 1=1
    `;
    const params = [];

    if (buscar) {
      query += ` AND (c.nombre LIKE ? OR c.numero_telefono LIKE ?)`;
      params.push(`%${buscar}%`, `%${buscar}%`);
    }

    query += ` GROUP BY c.numero_telefono ORDER BY c.ultima_actividad DESC, c.creado_en DESC`;

    res.json(db.prepare(query).all(...params));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contactos', detalle: error.message });
  }
});

// GET /api/contactos/:numero — Detalle completo de un paciente
router.get('/:numero', (req, res) => {
  try {
    const { numero } = req.params;

    const contacto = db.prepare('SELECT * FROM contactos WHERE numero_telefono = ?').get(numero);
    if (!contacto) return res.status(404).json({ error: 'Contacto no encontrado' });

    const mensajes = db.prepare(`
      SELECT * FROM mensajes_whatsapp WHERE numero_telefono = ? ORDER BY recibido_en DESC LIMIT 30
    `).all(numero);

    const turnos = db.prepare(`
      SELECT * FROM turnos WHERE numero_telefono = ? ORDER BY fecha_turno DESC
    `).all(numero);

    const cotizaciones = db.prepare(`
      SELECT * FROM cotizaciones WHERE numero_telefono = ? ORDER BY creado_en DESC
    `).all(numero);

    res.json({ ...contacto, mensajes, turnos, cotizaciones });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contacto', detalle: error.message });
  }
});

// PATCH /api/contactos/:numero — Actualizar nombre, notas o es_admin
router.patch('/:numero', (req, res) => {
  try {
    const { numero } = req.params;
    const { nombre, notas, es_admin } = req.body;

    // es_admin es booleano/número — lo tratamos explícitamente
    const sets = [];
    const params = [];

    if (nombre !== undefined) { sets.push('nombre = ?'); params.push(nombre ?? null); }
    if (notas  !== undefined) { sets.push('notas = ?');  params.push(notas  ?? null); }
    if (es_admin !== undefined) {
      sets.push('es_admin = ?');
      params.push(es_admin ? 1 : 0);
    }

    if (sets.length === 0) return res.json(db.prepare('SELECT * FROM contactos WHERE numero_telefono = ?').get(numero));

    params.push(numero);
    db.prepare(`UPDATE contactos SET ${sets.join(', ')} WHERE numero_telefono = ?`).run(...params);

    res.json(db.prepare('SELECT * FROM contactos WHERE numero_telefono = ?').get(numero));
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contacto', detalle: error.message });
  }
});

// DELETE /api/contactos/:numero
router.delete('/:numero', (req, res) => {
  try {
    const { numero } = req.params;
    db.prepare('DELETE FROM contactos WHERE numero_telefono = ?').run(numero);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar contacto', detalle: error.message });
  }
});

module.exports = router;
