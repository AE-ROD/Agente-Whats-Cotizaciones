// Rutas de estadísticas para el dashboard
const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/stats — Resumen general
router.get('/', (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const pacientes     = db.prepare('SELECT COUNT(*) as n FROM contactos').get().n;
    const turnosHoy     = db.prepare("SELECT COUNT(*) as n FROM turnos WHERE date(fecha_turno) = ? AND estado != 'cancelado'").get(hoy).n;
    const cotPendientes = db.prepare("SELECT COUNT(*) as n FROM cotizaciones WHERE estado = 'enviada'").get().n;
    const ingresosMes   = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as n FROM cotizaciones
      WHERE estado = 'aceptada' AND strftime('%Y-%m', creado_en) = strftime('%Y-%m', 'now', 'localtime')
    `).get().n;

    // Cotizaciones por mes (últimos 6 meses)
    const cotPorMes = db.prepare(`
      SELECT
        strftime('%m/%Y', creado_en) as mes,
        strftime('%Y-%m', creado_en) as orden,
        COUNT(*) as cantidad,
        COALESCE(SUM(CASE WHEN estado = 'aceptada' THEN total ELSE 0 END), 0) as monto
      FROM cotizaciones
      WHERE creado_en >= date('now', '-6 months', 'localtime')
      GROUP BY strftime('%Y-%m', creado_en)
      ORDER BY orden ASC
    `).all();

    // Turnos por estado
    const turnosPorEstado = db.prepare(`
      SELECT estado, COUNT(*) as cantidad FROM turnos GROUP BY estado
    `).all();

    // Nuevos pacientes por mes (últimos 6 meses)
    const pacientesPorMes = db.prepare(`
      SELECT
        strftime('%m/%Y', creado_en) as mes,
        strftime('%Y-%m', creado_en) as orden,
        COUNT(*) as cantidad
      FROM contactos
      WHERE creado_en >= date('now', '-6 months', 'localtime')
      GROUP BY strftime('%Y-%m', creado_en)
      ORDER BY orden ASC
    `).all();

    res.json({
      resumen: { pacientes, turnosHoy, cotPendientes, ingresosMes },
      cotPorMes,
      turnosPorEstado,
      pacientesPorMes,
    });
  } catch (error) {
    console.error('[Stats] Error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
