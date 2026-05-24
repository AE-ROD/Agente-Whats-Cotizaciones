// Servicio de IA — Anelis, la asistente virtual de la clínica dental
// Usa Groq (Llama 3) como proveedor gratuito, compatible con el SDK de OpenAI

const OpenAI = require('openai');
const { db, generarNumeroCotizacion } = require('../db');
const { calcularHorariosDisponibles } = require('../utils/fechas');
const { HERRAMIENTAS_ADMIN, ejecutarHerramientaAdmin } = require('./admin-tools');

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return _openai;
}

// Definición de herramientas para function calling
const HERRAMIENTAS = [
  {
    type: 'function',
    function: {
      name: 'consultar_disponibilidad',
      description: 'Consulta los horarios disponibles para agendar turnos en una fecha específica.',
      parameters: {
        type: 'object',
        properties: {
          fecha: {
            type: 'string',
            description: 'Fecha a consultar en formato YYYY-MM-DD',
          },
        },
        required: ['fecha'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ver_turnos_paciente',
      description: 'Devuelve todos los turnos activos (no cancelados) de un paciente.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: {
            type: 'string',
            description: 'Número de teléfono del paciente',
          },
        },
        required: ['numero_telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'agendar_turno',
      description: 'Agenda un nuevo turno para el paciente, verificando disponibilidad.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: { type: 'string' },
          nombre_paciente: { type: 'string' },
          fecha_turno: { type: 'string', description: 'Fecha y hora en formato ISO 8601' },
          tipo_turno: { type: 'string', description: 'Tipo de consulta odontológica' },
          notas: { type: 'string', description: 'Notas adicionales (opcional)' },
        },
        required: ['numero_telefono', 'nombre_paciente', 'fecha_turno', 'tipo_turno'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancelar_turno',
      description: 'Cancela un turno existente por su ID.',
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
      name: 'reprogramar_turno',
      description: 'Reprograma un turno existente a una nueva fecha y hora.',
      parameters: {
        type: 'object',
        properties: {
          id_turno: { type: 'integer', description: 'ID del turno a reprogramar' },
          nueva_fecha: { type: 'string', description: 'Nueva fecha y hora en formato ISO 8601' },
        },
        required: ['id_turno', 'nueva_fecha'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_nombre_paciente',
      description: 'Guarda el nombre del paciente. Llamar apenas el paciente proporcione su nombre.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: { type: 'string' },
          nombre: { type: 'string', description: 'Nombre completo del paciente' },
        },
        required: ['numero_telefono', 'nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_catalogo',
      description: 'Consulta el catálogo de servicios disponibles con sus precios. Usar SIEMPRE antes de mencionar precios o generar una cotización.',
      parameters: {
        type: 'object',
        properties: {
          sede: {
            type: 'string',
            enum: ['principal', 'secundaria', 'ambas'],
            description: "Sede para la cual consultar el catálogo. Usar 'ambas' si no está claro.",
          },
          categoria: {
            type: 'string',
            description: "Filtrar por categoría específica (opcional). Ej: 'Restauraciones', 'Extracciones'",
          },
        },
        required: ['sede'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generar_cotizacion_ia',
      description: 'Crea y guarda una cotización de servicios para el paciente. Usar solo después de confirmar los servicios con el paciente.',
      parameters: {
        type: 'object',
        properties: {
          numero_telefono: { type: 'string' },
          nombre_paciente: { type: 'string' },
          sede: {
            type: 'string',
            enum: ['principal', 'secundaria'],
            description: 'Sede de atención',
          },
          servicios: {
            type: 'array',
            description: 'Lista de servicios a incluir en la cotización',
            items: {
              type: 'object',
              properties: {
                servicio_id: {
                  type: 'integer',
                  description: 'ID del servicio del catálogo (obtenido con consultar_catalogo)',
                },
                cantidad: { type: 'integer', default: 1 },
              },
              required: ['servicio_id'],
            },
          },
          validez_dias: {
            type: 'integer',
            default: 15,
            description: 'Días de validez de la cotización',
          },
          notas: {
            type: 'string',
            description: 'Observaciones adicionales (opcional)',
          },
        },
        required: ['numero_telefono', 'nombre_paciente', 'sede', 'servicios'],
      },
    },
  },
];

// Implementaciones de las herramientas
function ejecutarHerramienta(nombre, args, config) {
  switch (nombre) {
    case 'registrar_nombre_paciente': {
      const { numero_telefono, nombre } = args;
      db.prepare(`
        INSERT INTO contactos (numero_telefono, nombre)
        VALUES (?, ?)
        ON CONFLICT(numero_telefono) DO UPDATE SET nombre = ?, actualizado_en = datetime('now', 'localtime')
      `).run(numero_telefono, nombre, nombre);
      return { exito: true };
    }

    case 'consultar_disponibilidad': {
      const { fecha } = args;
      const turnos = db.prepare(`
        SELECT * FROM turnos
        WHERE date(fecha_turno) = date(?) AND estado != 'cancelado'
      `).all(fecha);
      const { disponibles, ocupados } = calcularHorariosDisponibles(turnos);
      return {
        fecha,
        horarios_disponibles: disponibles,
        horarios_ocupados: ocupados,
        total_disponibles: disponibles.length,
      };
    }

    case 'ver_turnos_paciente': {
      const { numero_telefono } = args;
      const turnos = db.prepare(`
        SELECT * FROM turnos
        WHERE numero_telefono = ? AND estado != 'cancelado'
        ORDER BY fecha_turno ASC
      `).all(numero_telefono);
      return { turnos, total: turnos.length };
    }

    case 'agendar_turno': {
      const { numero_telefono, nombre_paciente, fecha_turno, tipo_turno, notas } = args;

      // Verificar disponibilidad
      const turnoExistente = db.prepare(`
        SELECT id FROM turnos
        WHERE fecha_turno = ? AND estado != 'cancelado'
      `).get(fecha_turno);

      if (turnoExistente) {
        return { exito: false, mensaje: 'El horario ya está ocupado. Por favor elegí otro.' };
      }

      const resultado = db.prepare(`
        INSERT INTO turnos (numero_telefono, nombre_paciente, fecha_turno, tipo_turno, estado, notas)
        VALUES (?, ?, ?, ?, 'confirmado', ?)
      `).run(numero_telefono, nombre_paciente, fecha_turno, tipo_turno, notas || null);

      return {
        exito: true,
        id_turno: resultado.lastInsertRowid,
        mensaje: `Turno agendado exitosamente para el ${new Date(fecha_turno).toLocaleString('es-AR')}.`,
      };
    }

    case 'cancelar_turno': {
      const { id_turno } = args;
      const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id_turno);
      if (!turno) return { exito: false, mensaje: 'Turno no encontrado.' };

      db.prepare("UPDATE turnos SET estado = 'cancelado' WHERE id = ?").run(id_turno);
      return { exito: true, mensaje: `Turno #${id_turno} cancelado correctamente.` };
    }

    case 'reprogramar_turno': {
      const { id_turno, nueva_fecha } = args;
      const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(id_turno);
      if (!turno) return { exito: false, mensaje: 'Turno no encontrado.' };

      // Verificar disponibilidad en nueva fecha
      const ocupado = db.prepare(`
        SELECT id FROM turnos WHERE fecha_turno = ? AND estado != 'cancelado' AND id != ?
      `).get(nueva_fecha, id_turno);

      if (ocupado) {
        return { exito: false, mensaje: 'El nuevo horario ya está ocupado. Por favor elegí otro.' };
      }

      db.prepare('UPDATE turnos SET fecha_turno = ? WHERE id = ?').run(nueva_fecha, id_turno);
      return {
        exito: true,
        mensaje: `Turno reprogramado al ${new Date(nueva_fecha).toLocaleString('es-AR')}.`,
      };
    }

    case 'consultar_catalogo': {
      const { sede, categoria } = args;

      let query = `
        SELECT * FROM catalogo_servicios
        WHERE activo = 1
        AND (sede = ? OR sede = 'ambas')
      `;
      const params = [sede === 'ambas' ? 'principal' : sede];

      // Si es ambas, mostrar todos
      if (sede === 'ambas') {
        query = `SELECT * FROM catalogo_servicios WHERE activo = 1`;
        params.length = 0;
      }

      if (categoria) {
        query += ` AND categoria = ?`;
        params.push(categoria);
      }

      query += ` ORDER BY categoria, nombre`;

      const servicios = db.prepare(query).all(...params);

      // Agrupar por categoría
      const porCategoria = {};
      for (const s of servicios) {
        if (!porCategoria[s.categoria]) porCategoria[s.categoria] = [];
        porCategoria[s.categoria].push({
          id: s.id,
          nombre: s.nombre,
          precio: s.precio,
          es_precio_desde: s.es_precio_desde === 1,
          sede: s.sede,
        });
      }

      return { catalogo: porCategoria, total_servicios: servicios.length };
    }

    case 'generar_cotizacion_ia': {
      const { numero_telefono, nombre_paciente, sede, servicios, validez_dias = 15, notas } = args;

      // Obtener config de la clínica para el nombre
      const clinicaConfig = db.prepare('SELECT nombre_clinica FROM configuracion_clinica LIMIT 1').get();
      const nombreClinica = clinicaConfig?.nombre_clinica || 'Klin';

      // Verificar que todos los servicios existan y estén activos
      const itemsValidos = [];
      for (const s of servicios) {
        const servicio = db.prepare(`
          SELECT * FROM catalogo_servicios WHERE id = ? AND activo = 1
        `).get(s.servicio_id);

        if (!servicio) {
          return { exito: false, mensaje: `Servicio ID ${s.servicio_id} no encontrado en el catálogo.` };
        }

        const cantidad = s.cantidad || 1;
        itemsValidos.push({
          servicio,
          cantidad,
          subtotal: servicio.precio * cantidad,
        });
      }

      // Calcular total
      const total = itemsValidos.reduce((acc, i) => acc + i.subtotal, 0);

      // Generar número de cotización (atómico con transacción)
      let numeroCotizacion;
      const crearCotizacion = db.transaction(() => {
        numeroCotizacion = generarNumeroCotizacion();

        const res = db.prepare(`
          INSERT INTO cotizaciones
            (numero_cotizacion, numero_telefono, nombre_paciente, sede, estado, validez_dias, notas, total, generada_por_ia)
          VALUES (?, ?, ?, ?, 'enviada', ?, ?, ?, 1)
        `).run(numeroCotizacion, numero_telefono, nombre_paciente, sede, validez_dias, notas || null, total);

        const cotizacionId = res.lastInsertRowid;

        for (const item of itemsValidos) {
          db.prepare(`
            INSERT INTO items_cotizacion (cotizacion_id, nombre_servicio, categoria, precio_unitario, cantidad, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(cotizacionId, item.servicio.nombre, item.servicio.categoria, item.servicio.precio, item.cantidad, item.subtotal);
        }

        return cotizacionId;
      });

      const cotizacionId = crearCotizacion();

      // Generar texto formateado para WhatsApp
      const fechaFormateada = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const nombreSede = sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria';

      let lineasServicios = '';
      for (const item of itemsValidos) {
        lineasServicios += `• ${item.servicio.nombre} (x${item.cantidad}): *$${item.subtotal.toFixed(2)}*\n`;
      }

      const textoWhatsApp = `📋 *COTIZACIÓN ${numeroCotizacion}*
_${nombreClinica}_

━━━━━━━━━━━━━━━━━━━━
👤 *Paciente:* ${nombre_paciente}
📍 *Sede:* ${nombreSede}
📅 *Fecha:* ${fechaFormateada}

*SERVICIOS INCLUIDOS:*
${lineasServicios}
━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: $${total.toFixed(2)} USD*
━━━━━━━━━━━━━━━━━━━━
⏱ _Válida por ${validez_dias} días_

Respondé *ACEPTAR* para confirmar o *RECHAZAR* para cancelar.

📌 _Cotización referencial, sujeta a evaluación clínica. Valores en USD._`;

      console.log(`[OpenAI] Cotización generada por IA: ${numeroCotizacion} — ${nombre_paciente} — $${total.toFixed(2)} USD`);

      return {
        exito: true,
        cotizacion_id: cotizacionId,
        numero_cotizacion: numeroCotizacion,
        total,
        texto_whatsapp: textoWhatsApp,
      };
    }

    default:
      return { error: `Herramienta desconocida: ${nombre}` };
  }
}

async function procesarMensaje(numeroTelefono, mensajeUsuario, historial, config, enviarMensajeFn) {
  const nombreClinica = config?.nombre_clinica || 'Klin';

  // Obtener contexto del contacto
  const contacto = db.prepare('SELECT * FROM contactos WHERE numero_telefono = ?').get(numeroTelefono);

  // ── Flujo ADMIN ─────────────────────────────────────────────────────────
  if (contacto?.es_admin === 1) {
    return procesarMensajeAdmin(numeroTelefono, mensajeUsuario, historial, config, contacto, enviarMensajeFn);
  }

  // ── Flujo PACIENTE (sin cambios) ─────────────────────────────────────────
  const esPrimerContacto = !contacto;
  const nombrePaciente = contacto?.nombre || null;
  const totalVisitas = contacto?.total_visitas || 0;

  const contextosPaciente = esPrimerContacto
    ? 'PACIENTE NUEVO — primera vez que contacta.'
    : `Paciente conocido: ${nombrePaciente || 'nombre no registrado'} — ${totalVisitas} visita(s) previas.`;

  const systemPrompt = `Sos Anelis, asistente de ${nombreClinica}. Profesional, amable y MUY concisa.

ESTILO (obligatorio):
- Máximo 3-4 líneas por mensaje. Sin párrafos largos.
- Español rioplatense (vos, no usted)
- Emojis solo si aportan (máximo 1-2)
- Una sola pregunta por mensaje

PACIENTE ACTUAL: ${contextosPaciente}
${nombrePaciente ? `- Llamalo por su nombre: ${nombrePaciente}` : '- No sabés su nombre: presentate brevemente y preguntáselo. Apenas lo diga, llamá registrar_nombre_paciente.'}

CLÍNICA:
- Dirección: ${config?.direccion || 'Consultar por mensaje'}
- Tel: ${config?.telefono || 'Consultar por mensaje'}
- Horarios: ${config?.horarios || 'Lunes a Viernes 9:00-18:00'}
- Info: ${config?.sobre_clinica || 'Clínica dental de confianza'}

SERVICIOS DISPONIBLES (no inventes precios, usá consultar_catalogo):
${(config?.servicios || 'Restauraciones, Extracciones, Limpieza dental, Blanqueamiento, Prótesis')
  .split(',').map(s => `• ${s.trim()}`).join('\n')}

REGLAS:
- Turnos: pedí nombre, fecha y tipo (una pregunta a la vez)
- Cotización:
  1. consultar_catalogo para ver precios reales
  2. Confirmá los servicios
  3. generar_cotizacion_ia para crear
  4. Respondé SOLO con el campo texto_whatsapp que devuelve la herramienta, exacto, sin agregar nada
- Si no podés resolver algo: "Te comunico con el equipo. 🙏"`;

  // Construir mensajes con historial
  const mensajes = [
    { role: 'system', content: systemPrompt },
    ...historial.map(m => ({
      role: m.remitente === 'usuario' ? 'user' : 'assistant',
      content: m.contenido_mensaje,
    })),
    { role: 'user', content: mensajeUsuario },
  ];

  let respuestaFinal = '';
  let iteraciones = 0;
  const MAX_ITERACIONES = 10;
  let textoWhatsappCotizacion = null;
  let cotizacionIdGenerado = null;

  // Bucle de function calling
  while (iteraciones < MAX_ITERACIONES) {
    iteraciones++;

    const completion = await getOpenAI().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: mensajes,
      tools: HERRAMIENTAS,
      tool_choice: 'auto',
    });

    const mensaje = completion.choices[0].message;
    mensajes.push(mensaje);

    // Si no hay tool calls, es la respuesta final
    if (!mensaje.tool_calls || mensaje.tool_calls.length === 0) {
      // Si se generó una cotización, usar su texto formateado en lugar de la respuesta del modelo
      respuestaFinal = textoWhatsappCotizacion || mensaje.content || '';
      break;
    }

    // Ejecutar cada tool call
    for (const toolCall of mensaje.tool_calls) {
      const nombre = toolCall.function.name;
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      console.log(`[OpenAI] Ejecutando herramienta: ${nombre}`, args);
      const resultado = ejecutarHerramienta(nombre, args, config);

      if (nombre === 'generar_cotizacion_ia' && resultado.exito && resultado.texto_whatsapp) {
        textoWhatsappCotizacion = resultado.texto_whatsapp;
        cotizacionIdGenerado = resultado.cotizacion_id;
      }

      mensajes.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(resultado),
      });
    }
  }

  if (!respuestaFinal) {
    respuestaFinal = 'Lo siento, no pude procesar tu solicitud. ¿Podés repetirla?';
  }

  console.log(`[OpenAI] Respuesta generada para ${numeroTelefono} en ${iteraciones} iteraciones`);
  return { respuesta: respuestaFinal, cotizacionId: cotizacionIdGenerado };
}

// ── Flujo ADMIN ──────────────────────────────────────────────────────────────

async function procesarMensajeAdmin(numeroTelefono, mensajeUsuario, historial, config, contacto, enviarMensajeFn) {
  const nombreClinica = config?.nombre_clinica || 'Klin';
  const nombreAdmin = contacto?.nombre || 'Admin';

  const systemPrompt = `Sos Anelis, asistente de gestión de ${nombreClinica}.
Estás hablando con ${nombreAdmin}, un administrador autorizado.

ESTILO (obligatorio):
- Respuestas directas y ejecutivas. Sin saludos largos.
- Listados con números o guiones cuando hay varios ítems.
- Español rioplatense (vos, no usted).
- Confirmá siempre cuando ejecutés una acción (✅ / ❌).
- Si el admin pide algo, hacelo. No preguntes de más.

CAPACIDADES:
Podés consultar y modificar turnos, stats, cotizaciones, pacientes, recordatorios y configuración del bot.
Usá las herramientas disponibles para responder con datos reales.

CLÍNICA: ${nombreClinica}`;

  const mensajes = [
    { role: 'system', content: systemPrompt },
    ...historial.map(m => ({
      role: m.remitente === 'usuario' ? 'user' : 'assistant',
      content: m.contenido_mensaje,
    })),
    { role: 'user', content: mensajeUsuario },
  ];

  let respuestaFinal = '';
  let iteraciones = 0;
  const MAX_ITERACIONES = 10;

  while (iteraciones < MAX_ITERACIONES) {
    iteraciones++;

    const completion = await getOpenAI().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: mensajes,
      tools: HERRAMIENTAS_ADMIN,
      tool_choice: 'auto',
    });

    const mensaje = completion.choices[0].message;
    mensajes.push(mensaje);

    if (!mensaje.tool_calls || mensaje.tool_calls.length === 0) {
      respuestaFinal = mensaje.content || '';
      break;
    }

    for (const toolCall of mensaje.tool_calls) {
      const nombre = toolCall.function.name;
      let args;
      try { args = JSON.parse(toolCall.function.arguments); } catch { args = {}; }

      console.log(`[Admin] Herramienta: ${nombre}`, args);
      const resultado = await ejecutarHerramientaAdmin(nombre, args, config, enviarMensajeFn);

      mensajes.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(resultado),
      });
    }
  }

  if (!respuestaFinal) respuestaFinal = 'No pude procesar la solicitud. Intentá de nuevo.';

  console.log(`[Admin] Respuesta para ${numeroTelefono} en ${iteraciones} iteraciones`);
  return { respuesta: respuestaFinal, cotizacionId: null };
}

module.exports = { procesarMensaje };
