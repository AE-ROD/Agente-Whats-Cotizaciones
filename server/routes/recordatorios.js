// Rutas de recordatorios y tareas pendientes
const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM recordatorios ORDER BY completado ASC, creado_en DESC').all());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { titulo, descripcion, tipo = 'pendiente' } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'Título requerido' });
    const r = db.prepare(`
      INSERT INTO recordatorios (titulo, descripcion, tipo) VALUES (?, ?, ?)
    `).run(titulo.trim(), descripcion?.trim() || null, tipo);
    res.status(201).json(db.prepare('SELECT * FROM recordatorios WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completado, titulo, descripcion } = req.body;
    if (completado !== undefined) {
      db.prepare('UPDATE recordatorios SET completado = ? WHERE id = ?').run(completado ? 1 : 0, id);
    }
    if (titulo !== undefined) {
      db.prepare('UPDATE recordatorios SET titulo = ?, descripcion = ? WHERE id = ?')
        .run(titulo, descripcion ?? null, id);
    }
    res.json(db.prepare('SELECT * FROM recordatorios WHERE id = ?').get(id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM recordatorios WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
