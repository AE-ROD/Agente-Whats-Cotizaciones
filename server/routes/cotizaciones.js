// Rutas de cotizaciones y catálogo de servicios
const express = require('express');
const router = express.Router();
const { db, generarNumeroCotizacion } = require('../db');
const { generarHtmlCotizacion } = require('../utils/cotizacion-html');

// GET /api/cotizaciones — Todas las cotizaciones con items
router.get('/', (req, res) => {
  try {
    const { sede, estado, buscar } = req.query;

    let query = `
      SELECT c.*,
        co.nombre as nombre_contacto,
        co.total_visitas,
        (SELECT json_group_array(json_object(
          'id', i.id,
          'nombre_servicio', i.nombre_servicio,
          'categoria', i.categoria,
          'precio_unitario', i.precio_unitario,
          'cantidad', i.cantidad,
          'subtotal', i.subtotal
        )) FROM items_cotizacion i WHERE i.cotizacion_id = c.id) as items
      FROM cotizaciones c
      LEFT JOIN contactos co ON c.numero_telefono = co.numero_telefono
      WHERE 1=1
    `;
    const params = [];

    if (sede && sede !== 'todas') {
      query += ` AND c.sede = ?`;
      params.push(sede);
    }

    if (estado && estado !== 'todos') {
      query += ` AND c.estado = ?`;
      params.push(estado);
    }

    if (buscar) {
      query += ` AND (c.nombre_paciente LIKE ? OR c.numero_cotizacion LIKE ? OR co.nombre LIKE ?)`;
      params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
    }

    query += ` ORDER BY c.creado_en DESC`;

    const cotizaciones = db.prepare(query).all(...params).map(c => ({
      ...c,
      items: c.items ? JSON.parse(c.items) : [],
    }));

    res.json(cotizaciones);
  } catch (error) {
    console.error('[Cotizaciones] Error al obtener cotizaciones:', error);
    res.status(500).json({ error: 'Error al obtener cotizaciones', detalle: error.message });
  }
});

// GET /api/cotizaciones/:id — Cotización específica con items
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cotizacion = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);
    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

    const items = db.prepare('SELECT * FROM items_cotizacion WHERE cotizacion_id = ? ORDER BY id').all(id);
    res.json({ ...cotizacion, items });
  } catch (error) {
    console.error('[Cotizaciones] Error al obtener cotización:', error);
    res.status(500).json({ error: 'Error al obtener cotización', detalle: error.message });
  }
});

// POST /api/cotizaciones — Crear nueva cotización manual
router.post('/', (req, res) => {
  try {
    const { numero_telefono, nombre_paciente, sede, estado, validez_dias, notas, servicios } = req.body;

    // Validaciones
    if (!nombre_paciente || !nombre_paciente.trim()) {
      return res.status(400).json({ error: 'El nombre del paciente es requerido' });
    }
    if (!numero_telefono || !numero_telefono.trim()) {
      return res.status(400).json({ error: 'El número de teléfono es requerido' });
    }
    if (!sede || !['principal', 'secundaria'].includes(sede)) {
      return res.status(400).json({ error: "La sede es requerida y debe ser 'principal' o 'secundaria'" });
    }
    if (!servicios || !Array.isArray(servicios) || servicios.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un servicio' });
    }

    // Verificar que todos los servicios existan y estén activos
    const itemsValidos = [];
    for (const s of servicios) {
      if (!s.servicio_id) {
        return res.status(400).json({ error: 'Cada servicio debe tener servicio_id' });
      }
      const servicio = db.prepare('SELECT * FROM catalogo_servicios WHERE id = ? AND activo = 1').get(s.servicio_id);
      if (!servicio) {
        return res.status(400).json({ error: `Servicio ID ${s.servicio_id} no existe o está inactivo` });
      }
      const cantidad = parseInt(s.cantidad) || 1;
      itemsValidos.push({
        servicio,
        cantidad,
        subtotal: servicio.precio * cantidad,
      });
    }

    const total = itemsValidos.reduce((acc, i) => acc + i.subtotal, 0);
    const estadoFinal = estado && ['borrador', 'enviada'].includes(estado) ? estado : 'borrador';
    const validezFinal = parseInt(validez_dias) || 15;

    let numeroCotizacion;
    const crearCotizacion = db.transaction(() => {
      numeroCotizacion = generarNumeroCotizacion();

      const res2 = db.prepare(`
        INSERT INTO cotizaciones
          (numero_cotizacion, numero_telefono, nombre_paciente, sede, estado, validez_dias, notas, total, generada_por_ia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(numeroCotizacion, numero_telefono.trim(), nombre_paciente.trim(), sede, estadoFinal, validezFinal, notas || null, total);

      const cotizacionId = res2.lastInsertRowid;

      for (const item of itemsValidos) {
        db.prepare(`
          INSERT INTO items_cotizacion (cotizacion_id, nombre_servicio, categoria, precio_unitario, cantidad, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(cotizacionId, item.servicio.nombre, item.servicio.categoria, item.servicio.precio, item.cantidad, item.subtotal);
      }

      return cotizacionId;
    });

    const cotizacionId = crearCotizacion();
    const cotizacion = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(cotizacionId);
    const items = db.prepare('SELECT * FROM items_cotizacion WHERE cotizacion_id = ?').all(cotizacionId);

    console.log(`[Cotizaciones] Nueva cotización manual creada: ${numeroCotizacion}`);
    res.status(201).json({ ...cotizacion, items });
  } catch (error) {
    console.error('[Cotizaciones] Error al crear cotización:', error);
    res.status(500).json({ error: 'Error al crear cotización', detalle: error.message });
  }
});

// PATCH /api/cotizaciones/:id/estado — Actualizar estado
router.patch('/:id/estado', (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['borrador', 'enviada', 'aceptada', 'rechazada'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
    }

    const cotizacion = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);
    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

    db.prepare('UPDATE cotizaciones SET estado = ? WHERE id = ?').run(estado, id);
    const actualizada = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);
    res.json(actualizada);
  } catch (error) {
    console.error('[Cotizaciones] Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado', detalle: error.message });
  }
});

// DELETE /api/cotizaciones/:id — Eliminar cotización
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cotizacion = db.prepare('SELECT id, numero_cotizacion FROM cotizaciones WHERE id = ?').get(id);
    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

    db.prepare('DELETE FROM items_cotizacion WHERE cotizacion_id = ?').run(id);
    db.prepare('DELETE FROM cotizaciones WHERE id = ?').run(id);

    console.log(`[Cotizaciones] Cotización ${cotizacion.numero_cotizacion} eliminada`);
    res.json({ ok: true });
  } catch (error) {
    console.error('[Cotizaciones] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar cotización', detalle: error.message });
  }
});

// GET /api/cotizaciones/:id/html — HTML para impresión/PDF
router.get('/:id/html', (req, res) => {
  try {
    const { id } = req.params;
    const cotizacion = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);
    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

    const items = db.prepare('SELECT * FROM items_cotizacion WHERE cotizacion_id = ? ORDER BY id').all(id);
    const config = db.prepare('SELECT * FROM configuracion_clinica LIMIT 1').get();

    const html = generarHtmlCotizacion(cotizacion, items, config);
    res.type('text/html').send(html);
  } catch (error) {
    console.error('[Cotizaciones] Error al generar HTML:', error);
    res.status(500).json({ error: 'Error al generar documento', detalle: error.message });
  }
});

// GET /api/catalogo — Catálogo de servicios
router.get('/catalogo/servicios', (req, res) => {
  try {
    const { sede, categoria, activo } = req.query;

    let query = 'SELECT * FROM catalogo_servicios WHERE 1=1';
    const params = [];

    if (activo !== undefined) {
      query += ` AND activo = ?`;
      params.push(activo === '1' ? 1 : 0);
    } else {
      query += ` AND activo = 1`;
    }

    if (sede && sede !== 'todas') {
      query += ` AND (sede = ? OR sede = 'ambas')`;
      params.push(sede);
    }

    if (categoria) {
      query += ` AND categoria = ?`;
      params.push(categoria);
    }

    query += ` ORDER BY categoria, nombre`;

    const servicios = db.prepare(query).all(...params);
    res.json(servicios);
  } catch (error) {
    console.error('[Catálogo] Error al obtener catálogo:', error);
    res.status(500).json({ error: 'Error al obtener catálogo', detalle: error.message });
  }
});

// PUT /api/catalogo/:id — Actualizar servicio del catálogo
router.put('/catalogo/servicios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { precio, activo, es_precio_desde } = req.body;

    const servicio = db.prepare('SELECT * FROM catalogo_servicios WHERE id = ?').get(id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    if (precio !== undefined && (isNaN(precio) || precio < 0)) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo' });
    }

    db.prepare(`
      UPDATE catalogo_servicios SET
        precio = COALESCE(?, precio),
        activo = COALESCE(?, activo),
        es_precio_desde = COALESCE(?, es_precio_desde)
      WHERE id = ?
    `).run(
      precio !== undefined ? parseFloat(precio) : null,
      activo !== undefined ? (activo ? 1 : 0) : null,
      es_precio_desde !== undefined ? (es_precio_desde ? 1 : 0) : null,
      id
    );

    const actualizado = db.prepare('SELECT * FROM catalogo_servicios WHERE id = ?').get(id);
    res.json(actualizado);
  } catch (error) {
    console.error('[Catálogo] Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio', detalle: error.message });
  }
});

module.exports = router;
