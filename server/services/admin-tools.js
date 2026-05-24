// Herramientas de administración para contactos con rol admin
// Se usan cuando es_admin = 1 en la tabla contactos

const { db } = require('../db');

// ── Definición de herramientas (para Groq function calling) ─────────────────

const HERRAMIENTAS_ADMIN = [

  // ── AGENDA ────────────────────────────────────────────────────────────────

  {
    type: 'function',
    function: {
      name: 'ver_turnos_dia',
      description: 'Lista todos los turnos de hoy o de una fecha específica.',
      parameters: {
        type: 'object',
        properties: {
          fecha: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD. Si no se indica, usa hoy.',
          },
        },
        required: [],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'ver_turnos_semana',
      description: 'Lista todos los turnos de los próximos 7 días.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'ver_turnos_paciente_admin',
      description: 'Muestra todos los turnos de un paciente buscando por nombre o teléfono.',
      parameters: {
        type: 'object',
        properties: {
          busqueda: {
            type: 'string',
            description: 'Nombre del paciente o número de teléfono.',
          },
        },
        required: ['busqueda'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'crear_turno_admin',
      description: 'Crea un turno para cualquier paciente. Si el paciente no existe en la DB, se crea automáticamente.',
      parameters: {
        type: 'object',
        properties: {
          nombre_paciente: { type: 'string', description: 'Nombre completo del paciente' },
          numero_telefono: { type: 'string', description: 'Número de teléfono (opcional)' },
          fecha_turno: { type: 'string', description: 'Fecha y hora ISO 8601 (ej: 2026-05-24T10:00:00)' },
          tipo_turno: { type: 'string', description: 'Tipo de consulta (ej: Limpieza, Extracción)' },
          notas: { type: 'string', description: 'Notas adicionales (opcional)' },
        },
        required: ['nombre_paciente', 'fecha_turno', 'tipo_turno'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'cancelar_turno_admin',
      description: 'Cancela un turno por su ID.',
      parameters: {
        type: 'object',
        properties: {
          id_turno: { type: 'integer', description: 'ID del turno a cancelar' },
        },
        required: ['id_turno'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'completar_turno',
      description: 'Marca un turno como completado por su ID.',
      parameters: {
        type: 'object',
        properties: {
          id_turno: { type: 'integer', description: 'ID del turno' },
        },
        required: ['id_turno'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'reprogramar_turno_admin',
      description: 'Reprograma un turno a una nueva fecha y hora.',
      parameters: {
        type: 'object',
        properties: {
          id_turno: { type: 'integer', description: 'ID del turno' },
          nueva_fecha: { type: 'string', description: 'Nueva fecha y hora ISO 8601' },
        },
        required: ['id_turno', 'nueva_fecha'],
      },
    },
  },

  // ── STATS ─────────────────────────────────────────────────────────────────

  {
    type: 'function',
    function: {
      name: 'ver_stats_clinica',
      description: 'Resumen general de la clínica: pacientes totales, turnos de hoy, cotizaciones pendientes, ingresos del mes.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'ver_ingresos_mes',
      description: 'Muestra los ingresos del mes actual en USD (cotizaciones aceptadas).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'ver_pacientes_nuevos',
      description: 'Muestra la cantidad y lista de pacientes que contactaron por primera vez este mes.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'ver_proximos_confirmados',
      description: 'Lista los próximos turnos con estado confirmado.',
      parameters: {
        type: 'object',
        properties: {
          limite: { type: 'integer', description: 'Cantidad máxima a mostrar (default 10)' },
        },
        required: [],
      },
    },
  },

  // ── COTIZACIONES ──────────────────────────────────────────────────────────

  {
    type: 'function',
    function: {
      name: 'ver_cotizaciones_pendientes',
      description: 'Lista las cotizaciones en estado "enviada" (sin respuesta del paciente).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'cambiar_estado_cotizacion',
      description: 'Cambia el estado de una cotización por su ID.',
      parameters: {
        type: 'object',
        properties: {
          id_cotizacion: { type: 'integer', description: 'ID de la cotización' },
          estado: {
            type: 'string',
            enum: ['borrador', 'enviada', 'aceptada', 'rechazada'],
            description: 'Nuevo estado de la cotización',
          },
        },
        required: ['id_cotizacion', 'estado'],
      },
    },
  },

  // ── PACIENTES ─────────────────────────────────────────────────────────────

  {
    type: 'function',
    function: {
      name: 'buscar_paciente',
      description: 'Busca un paciente por nombre o teléfono y devuelve su info y estadísticas.',
      parameters: {
        type: 'object',
        properties: {
          busqueda: { type: 'string', description: 'Nombre o número de teléfono' },
        },
        required: ['busqueda'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'agregar_nota_paciente',
      description: 'Agrega o reemplaza las notas de un paciente (alergias, observaciones, etc.).',
      parameters: {
        type: 'object',
        properties: {
          busqueda: { type: 'string', description: 'Nombre o número de teléfono del paciente' },
          nota: { type: 'string', description: 'Texto de la nota a guardar' },
        },
        required: ['busqueda', 'nota'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'ver_recordatorios',
      description: 'Lista los recordatorios pendientes del sistema.',
      parameters: {
        type: 'object',
        properties: {
          solo_pendientes: {
            type: 'boolean',
            description: 'Si es true, muestra solo los no completados (default true)',
          },
        },
        required: [],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'crear_recordatorio',
      description: 'Crea un nuevo recordatorio en el sistema.',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Título del recordatorio' },
          descripcion: { type: 'string', description: 'Descripción detallada (opcional)' },
          tipo: {
            type: 'string',
            enum: ['pendiente', 'idea', 'recomendacion'],
            description: 'Tipo de recordatorio (default: pendiente)',
          },
        },
        required: ['titulo'],
      },
    },
  },

  // ── SISTEMA ───────────────────────────────────────────────────────────────

  {
    type: 'function',
    function: {
      name: 'ver_estado_bot',
      description: 'Devuelve si el agente IA está activo o pausado.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'pausar_bot',
      description: 'Pausa las respuestas automáticas del agente IA.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'activar_bot',
      description: 'Activa las respuestas automáticas del agente IA.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  {
    type: 'function',
    function: {
      name: 'enviar_mensaje_paciente',
      description: 'Envía un mensaje de WhatsApp a un paciente en nombre de la clínica.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: { type: 'string', description: 'Número de teléfono con código de país (ej: +541112345678)' },
          mensaje: { type: 'string', description: 'Texto del mensaje a enviar' },
        },
        required: ['numero_telefono', 'mensaje'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'consultar_precio_servicio',
      description: 'Busca el precio de un servicio en el catálogo por nombre.',
      parameters: {
        type: 'object',
        properties: {
          nombre_servicio: { type: 'string', description: 'Nombre o parte del nombre del servicio' },
        },
        required: ['nombre_servicio'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'actualizar_precio_servicio',
      description: 'Actualiza el precio de un servicio del catálogo.',
      parameters: {
        type: 'object',
        properties: {
          nombre_servicio: { type: 'string', description: 'Nombre o parte del nombre del servicio' },
          nuevo_precio: { type: 'number', description: 'Nuevo precio en USD' },
        },
        required: ['nombre_servicio', 'nuevo_precio'],
      },
    },
  },
];

// ── Ejecutores ───────────────────────────────────────────────────────────────

function fmt(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-AR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function buscarContacto(busqueda) {
  return db.prepare(`
    SELECT * FROM contactos
    WHERE nombre LIKE ? OR numero_telefono LIKE ?
    LIMIT 1
  `).get(`%${busqueda}%`, `%${busqueda}%`);
}

async function ejecutarHerramientaAdmin(nombre, args, _config, enviarMensajeFn) {
  switch (nombre) {

    // ── AGENDA ──────────────────────────────────────────────────────────────

    case 'ver_turnos_dia': {
      const fecha = args.fecha || new Date().toISOString().split('T')[0];
      const turnos = db.prepare(`
        SELECT * FROM turnos
        WHERE date(fecha_turno) = date(?) AND estado != 'cancelado'
        ORDER BY fecha_turno ASC
      `).all(fecha);
      if (turnos.length === 0) return { mensaje: `Sin turnos para el ${fecha}.` };
      return {
        fecha,
        total: turnos.length,
        turnos: turnos.map(t => ({
          id: t.id,
          paciente: t.nombre_paciente,
          hora: fmt(t.fecha_turno),
          tipo: t.tipo_turno,
          estado: t.estado,
          notas: t.notas,
        })),
      };
    }

    case 'ver_turnos_semana': {
      const turnos = db.prepare(`
        SELECT * FROM turnos
        WHERE fecha_turno >= datetime('now', 'localtime')
          AND fecha_turno <= datetime('now', '+7 days', 'localtime')
          AND estado != 'cancelado'
        ORDER BY fecha_turno ASC
      `).all();
      if (turnos.length === 0) return { mensaje: 'Sin turnos para los próximos 7 días.' };
      return {
        total: turnos.length,
        turnos: turnos.map(t => ({
          id: t.id,
          paciente: t.nombre_paciente,
          fecha: fmt(t.fecha_turno),
          tipo: t.tipo_turno,
          estado: t.estado,
        })),
      };
    }

    case 'ver_turnos_paciente_admin': {
      const { busqueda } = args;
      const contacto = buscarContacto(busqueda);
      if (!contacto) return { mensaje: `No encontré paciente con "${busqueda}".` };
      const turnos = db.prepare(`
        SELECT * FROM turnos WHERE numero_telefono = ? ORDER BY fecha_turno DESC LIMIT 10
      `).all(contacto.numero_telefono);
      return {
        paciente: contacto.nombre || contacto.numero_telefono,
        total: turnos.length,
        turnos: turnos.map(t => ({
          id: t.id,
          fecha: fmt(t.fecha_turno),
          tipo: t.tipo_turno,
          estado: t.estado,
        })),
      };
    }

    case 'crear_turno_admin': {
      const { nombre_paciente, numero_telefono, fecha_turno, tipo_turno, notas } = args;
      const tel = numero_telefono || 'sin-tel';
      const res = db.prepare(`
        INSERT INTO turnos (numero_telefono, nombre_paciente, fecha_turno, tipo_turno, estado, notas)
        VALUES (?, ?, ?, ?, 'confirmado', ?)
      `).run(tel, nombre_paciente, fecha_turno, tipo_turno, notas || null);
      return {
        exito: true,
        id_turno: res.lastInsertRowid,
        mensaje: `Turno #${res.lastInsertRowid} creado para ${nombre_paciente} el ${fmt(fecha_turno)}.`,
      };
    }

    case 'cancelar_turno_admin': {
      const { id_turno } = args;
      const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id_turno);
      if (!turno) return { exito: false, mensaje: `No encontré el turno #${id_turno}.` };
      db.prepare("UPDATE turnos SET estado = 'cancelado' WHERE id = ?").run(id_turno);
      return { exito: true, mensaje: `Turno #${id_turno} (${turno.nombre_paciente}) cancelado.` };
    }

    case 'completar_turno': {
      const { id_turno } = args;
      const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id_turno);
      if (!turno) return { exito: false, mensaje: `No encontré el turno #${id_turno}.` };
      db.prepare("UPDATE turnos SET estado = 'completado' WHERE id = ?").run(id_turno);
      return { exito: true, mensaje: `Turno #${id_turno} (${turno.nombre_paciente}) marcado como completado.` };
    }

    case 'reprogramar_turno_admin': {
      const { id_turno, nueva_fecha } = args;
      const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id_turno);
      if (!turno) return { exito: false, mensaje: `No encontré el turno #${id_turno}.` };
      const ocupado = db.prepare(`
        SELECT id FROM turnos WHERE fecha_turno = ? AND estado != 'cancelado' AND id != ?
      `).get(nueva_fecha, id_turno);
      if (ocupado) return { exito: false, mensaje: 'Ese horario ya está ocupado. Elegí otro.' };
      db.prepare('UPDATE turnos SET fecha_turno = ? WHERE id = ?').run(nueva_fecha, id_turno);
      return { exito: true, mensaje: `Turno #${id_turno} reprogramado al ${fmt(nueva_fecha)}.` };
    }

    // ── STATS ────────────────────────────────────────────────────────────────

    case 'ver_stats_clinica': {
      const hoy = new Date().toISOString().split('T')[0];
      const mes = new Date().toISOString().slice(0, 7);
      const pacientes = db.prepare('SELECT COUNT(*) as n FROM contactos').get().n;
      const turnosHoy = db.prepare(`SELECT COUNT(*) as n FROM turnos WHERE date(fecha_turno) = date(?) AND estado != 'cancelado'`).get(hoy).n;
      const cotPendientes = db.prepare(`SELECT COUNT(*) as n FROM cotizaciones WHERE estado = 'enviada'`).get().n;
      const ingresosMes = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total FROM cotizaciones
        WHERE estado = 'aceptada' AND strftime('%Y-%m', creado_en) = ?
      `).get(mes).total;
      return {
        pacientes_totales: pacientes,
        turnos_hoy: turnosHoy,
        cotizaciones_pendientes: cotPendientes,
        ingresos_mes_usd: Number(ingresosMes).toFixed(2),
      };
    }

    case 'ver_ingresos_mes': {
      const mes = new Date().toISOString().slice(0, 7);
      const resultado = db.prepare(`
        SELECT
          COUNT(*) as cantidad,
          COALESCE(SUM(total), 0) as total
        FROM cotizaciones
        WHERE estado = 'aceptada' AND strftime('%Y-%m', creado_en) = ?
      `).get(mes);
      return {
        mes,
        cotizaciones_aceptadas: resultado.cantidad,
        ingresos_usd: Number(resultado.total).toFixed(2),
      };
    }

    case 'ver_pacientes_nuevos': {
      const mes = new Date().toISOString().slice(0, 7);
      const pacientes = db.prepare(`
        SELECT nombre, numero_telefono, creado_en
        FROM contactos
        WHERE strftime('%Y-%m', creado_en) = ?
        ORDER BY creado_en DESC
      `).all(mes);
      return {
        mes,
        total: pacientes.length,
        pacientes: pacientes.map(p => ({
          nombre: p.nombre || '(sin nombre)',
          telefono: p.numero_telefono,
          fecha: fmt(p.creado_en),
        })),
      };
    }

    case 'ver_proximos_confirmados': {
      const limite = args.limite || 10;
      const turnos = db.prepare(`
        SELECT * FROM turnos
        WHERE estado = 'confirmado' AND fecha_turno >= datetime('now', 'localtime')
        ORDER BY fecha_turno ASC
        LIMIT ?
      `).all(limite);
      if (turnos.length === 0) return { mensaje: 'No hay turnos confirmados próximos.' };
      return {
        total: turnos.length,
        turnos: turnos.map(t => ({
          id: t.id,
          paciente: t.nombre_paciente,
          fecha: fmt(t.fecha_turno),
          tipo: t.tipo_turno,
        })),
      };
    }

    // ── COTIZACIONES ─────────────────────────────────────────────────────────

    case 'ver_cotizaciones_pendientes': {
      const cotizaciones = db.prepare(`
        SELECT * FROM cotizaciones WHERE estado = 'enviada' ORDER BY creado_en DESC
      `).all();
      if (cotizaciones.length === 0) return { mensaje: 'No hay cotizaciones pendientes.' };
      return {
        total: cotizaciones.length,
        cotizaciones: cotizaciones.map(c => ({
          id: c.id,
          numero: c.numero_cotizacion,
          paciente: c.nombre_paciente,
          total_usd: Number(c.total).toFixed(2),
          enviada: fmt(c.creado_en),
        })),
      };
    }

    case 'cambiar_estado_cotizacion': {
      const { id_cotizacion, estado } = args;
      const cot = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id_cotizacion);
      if (!cot) return { exito: false, mensaje: `No encontré la cotización #${id_cotizacion}.` };
      db.prepare('UPDATE cotizaciones SET estado = ? WHERE id = ?').run(estado, id_cotizacion);
      return { exito: true, mensaje: `Cotización #${id_cotizacion} (${cot.numero_cotizacion}) → ${estado}.` };
    }

    // ── PACIENTES ────────────────────────────────────────────────────────────

    case 'buscar_paciente': {
      const { busqueda } = args;
      const contacto = buscarContacto(busqueda);
      if (!contacto) return { mensaje: `No encontré paciente con "${busqueda}".` };
      const totalTurnos = db.prepare(`SELECT COUNT(*) as n FROM turnos WHERE numero_telefono = ?`).get(contacto.numero_telefono).n;
      const totalCot = db.prepare(`SELECT COUNT(*) as n FROM cotizaciones WHERE numero_telefono = ?`).get(contacto.numero_telefono).n;
      const totalMensajes = db.prepare(`SELECT COUNT(*) as n FROM mensajes_whatsapp WHERE numero_telefono = ?`).get(contacto.numero_telefono).n;
      return {
        nombre: contacto.nombre || '(sin nombre)',
        telefono: contacto.numero_telefono,
        visitas: contacto.total_visitas || 0,
        notas: contacto.notas || 'Sin notas',
        es_admin: contacto.es_admin === 1,
        turnos: totalTurnos,
        cotizaciones: totalCot,
        mensajes: totalMensajes,
        primer_contacto: fmt(contacto.creado_en),
        ultima_actividad: fmt(contacto.ultima_actividad),
      };
    }

    case 'agregar_nota_paciente': {
      const { busqueda, nota } = args;
      const contacto = buscarContacto(busqueda);
      if (!contacto) return { exito: false, mensaje: `No encontré paciente con "${busqueda}".` };
      db.prepare('UPDATE contactos SET notas = ? WHERE numero_telefono = ?').run(nota, contacto.numero_telefono);
      return { exito: true, mensaje: `Nota guardada para ${contacto.nombre || contacto.numero_telefono}.` };
    }

    case 'ver_recordatorios': {
      const soloP = args.solo_pendientes !== false;
      const query = soloP
        ? `SELECT * FROM recordatorios WHERE completado = 0 ORDER BY creado_en DESC`
        : `SELECT * FROM recordatorios ORDER BY completado ASC, creado_en DESC`;
      const recs = db.prepare(query).all();
      if (recs.length === 0) return { mensaje: 'Sin recordatorios pendientes.' };
      return {
        total: recs.length,
        recordatorios: recs.map(r => ({
          id: r.id,
          titulo: r.titulo,
          descripcion: r.descripcion,
          tipo: r.tipo,
          completado: r.completado === 1,
        })),
      };
    }

    case 'crear_recordatorio': {
      const { titulo, descripcion, tipo } = args;
      const res = db.prepare(`
        INSERT INTO recordatorios (titulo, descripcion, tipo) VALUES (?, ?, ?)
      `).run(titulo, descripcion || null, tipo || 'pendiente');
      return { exito: true, id: res.lastInsertRowid, mensaje: `Recordatorio "${titulo}" creado.` };
    }

    // ── SISTEMA ──────────────────────────────────────────────────────────────

    case 'ver_estado_bot': {
      const config = db.prepare('SELECT bot_activo FROM configuracion_clinica LIMIT 1').get();
      const activo = config?.bot_activo === 1;
      return { bot_activo: activo, mensaje: activo ? '🟢 Anelis está activa.' : '⏸ Anelis está pausada.' };
    }

    case 'pausar_bot': {
      db.prepare('UPDATE configuracion_clinica SET bot_activo = 0').run();
      return { exito: true, mensaje: '⏸ Anelis pausada. Los mensajes no serán respondidos automáticamente.' };
    }

    case 'activar_bot': {
      db.prepare('UPDATE configuracion_clinica SET bot_activo = 1').run();
      return { exito: true, mensaje: '🟢 Anelis activada. Respuestas automáticas en funcionamiento.' };
    }

    case 'enviar_mensaje_paciente': {
      const { numero_telefono, mensaje } = args;
      if (!enviarMensajeFn) return { exito: false, mensaje: 'Función de envío no disponible.' };
      try {
        await enviarMensajeFn(numero_telefono, mensaje);
        return { exito: true, mensaje: `Mensaje enviado a ${numero_telefono}.` };
      } catch (err) {
        return { exito: false, mensaje: `Error al enviar: ${err.message}` };
      }
    }

    case 'consultar_precio_servicio': {
      const { nombre_servicio } = args;
      const servicios = db.prepare(`
        SELECT * FROM catalogo_servicios
        WHERE nombre LIKE ? AND activo = 1
        ORDER BY nombre
      `).all(`%${nombre_servicio}%`);
      if (servicios.length === 0) return { mensaje: `No encontré servicios con "${nombre_servicio}".` };
      return {
        total: servicios.length,
        servicios: servicios.map(s => ({
          id: s.id,
          nombre: s.nombre,
          precio_usd: Number(s.precio).toFixed(2),
          desde: s.es_precio_desde === 1,
          categoria: s.categoria,
        })),
      };
    }

    case 'actualizar_precio_servicio': {
      const { nombre_servicio, nuevo_precio } = args;
      const servicio = db.prepare(`
        SELECT * FROM catalogo_servicios WHERE nombre LIKE ? AND activo = 1 LIMIT 1
      `).get(`%${nombre_servicio}%`);
      if (!servicio) return { exito: false, mensaje: `No encontré servicio con "${nombre_servicio}".` };
      db.prepare('UPDATE catalogo_servicios SET precio = ? WHERE id = ?').run(nuevo_precio, servicio.id);
      return {
        exito: true,
        mensaje: `"${servicio.nombre}" actualizado a $${Number(nuevo_precio).toFixed(2)} USD.`,
      };
    }

    default:
      return { error: `Herramienta admin desconocida: ${nombre}` };
  }
}

module.exports = { HERRAMIENTAS_ADMIN, ejecutarHerramientaAdmin };
