const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'clinica.db');

const db = new Database(DB_PATH);

// Habilitar claves foráneas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function inicializarDB() {
  db.exec(`
    -- Tabla de mensajes de WhatsApp
    CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_telefono TEXT NOT NULL,
      contenido_mensaje TEXT NOT NULL,
      remitente TEXT NOT NULL CHECK(remitente IN ('usuario', 'asistente')),
      tipo_mensaje TEXT NOT NULL DEFAULT 'texto',
      respuesta_ia TEXT,
      procesado INTEGER DEFAULT 0,
      recibido_en DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    -- Tabla de turnos
    CREATE TABLE IF NOT EXISTS turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_telefono TEXT NOT NULL,
      nombre_paciente TEXT,
      fecha_turno DATETIME,
      tipo_turno TEXT,
      estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'confirmado', 'cancelado', 'completado')),
      notas TEXT,
      creado_en DATETIME DEFAULT (datetime('now', 'localtime')),
      actualizado_en DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TRIGGER IF NOT EXISTS trg_turnos_actualizado
    AFTER UPDATE ON turnos
    BEGIN
      UPDATE turnos SET actualizado_en = datetime('now', 'localtime') WHERE id = NEW.id;
    END;

    -- Tabla de configuración de la clínica
    CREATE TABLE IF NOT EXISTS configuracion_clinica (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_clinica TEXT DEFAULT 'Klin',
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      horarios TEXT,
      servicios TEXT,
      sobre_clinica TEXT,
      webhook_url TEXT,
      creado_en DATETIME DEFAULT (datetime('now', 'localtime')),
      actualizado_en DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TRIGGER IF NOT EXISTS trg_config_actualizado
    AFTER UPDATE ON configuracion_clinica
    BEGIN
      UPDATE configuracion_clinica SET actualizado_en = datetime('now', 'localtime') WHERE id = NEW.id;
    END;

    -- Tabla de cotizaciones
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_cotizacion TEXT UNIQUE NOT NULL,
      numero_telefono TEXT NOT NULL,
      nombre_paciente TEXT NOT NULL,
      sede TEXT NOT NULL DEFAULT 'principal' CHECK(sede IN ('principal', 'secundaria')),
      estado TEXT NOT NULL DEFAULT 'borrador'
        CHECK(estado IN ('borrador', 'enviada', 'aceptada', 'rechazada')),
      validez_dias INTEGER DEFAULT 15,
      notas TEXT,
      total REAL DEFAULT 0,
      generada_por_ia INTEGER DEFAULT 0,
      creado_en DATETIME DEFAULT (datetime('now', 'localtime')),
      actualizado_en DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TRIGGER IF NOT EXISTS trg_cotizaciones_actualizado
    AFTER UPDATE ON cotizaciones
    BEGIN
      UPDATE cotizaciones SET actualizado_en = datetime('now', 'localtime') WHERE id = NEW.id;
    END;

    -- Trigger para generar numero_cotizacion automáticamente
    CREATE TRIGGER IF NOT EXISTS trg_numero_cotizacion
    BEFORE INSERT ON cotizaciones
    BEGIN
      SELECT RAISE(ABORT, 'numero_cotizacion requerido')
      WHERE NEW.numero_cotizacion IS NULL OR NEW.numero_cotizacion = '';
    END;

    -- Tabla de ítems de cotización
    CREATE TABLE IF NOT EXISTS items_cotizacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cotizacion_id INTEGER NOT NULL,
      nombre_servicio TEXT NOT NULL,
      categoria TEXT NOT NULL,
      precio_unitario REAL NOT NULL,
      cantidad INTEGER DEFAULT 1,
      subtotal REAL NOT NULL,
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
    );

    -- Catálogo de servicios
    CREATE TABLE IF NOT EXISTS catalogo_servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      sede TEXT NOT NULL CHECK(sede IN ('principal', 'secundaria', 'ambas')),
      precio REAL NOT NULL,
      es_precio_desde INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Insertar configuración por defecto si no existe
  const configExiste = db.prepare('SELECT id FROM configuracion_clinica LIMIT 1').get();
  if (!configExiste) {
    db.prepare(`
      INSERT INTO configuracion_clinica
        (nombre_clinica, direccion, telefono, email, horarios, servicios, sobre_clinica)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Klin',
      'Av. Corrientes 1234, Piso 3, Buenos Aires, Argentina',
      '+54 11 4567-8900',
      'info@clinicasonrisa.com.ar',
      'Lunes a Viernes: 9:00 - 18:00 | Sábados: 9:00 - 13:00',
      'Restauraciones, Extracciones, Limpieza dental, Blanqueamiento, Prótesis dentales, Ortodoncia',
      'Clínica dental de confianza con más de 15 años de experiencia. Contamos con dos sedes para mejor atención de nuestros pacientes. Nuestro equipo de profesionales se dedica a brindar la mejor atención odontológica con tecnología de punta.'
    );
  }

  // Insertar catálogo inicial si está vacío
  const catalogoExiste = db.prepare('SELECT id FROM catalogo_servicios LIMIT 1').get();
  if (!catalogoExiste) {
    const M = 2.5; // Multiplicador para prótesis

    const SERVICIOS_INICIALES = [
      // ─── SEDE PRINCIPAL ───────────────────────────
      // Restauraciones
      { nombre: 'Caries pequeña',                   categoria: 'Restauraciones',           sede: 'principal',  precio: 8,           es_precio_desde: 0 },
      { nombre: 'Caries mediana',                   categoria: 'Restauraciones',           sede: 'principal',  precio: 10,          es_precio_desde: 0 },
      { nombre: 'Caries grande',                    categoria: 'Restauraciones',           sede: 'principal',  precio: 12,          es_precio_desde: 0 },
      { nombre: 'Caries extra grande',              categoria: 'Restauraciones',           sede: 'principal',  precio: 18,          es_precio_desde: 0 },
      { nombre: 'Restauración con fibra de vidrio', categoria: 'Restauraciones',           sede: 'principal',  precio: 40,          es_precio_desde: 0 },
      // Extracciones
      { nombre: 'Extracción simple',                categoria: 'Extracciones',             sede: 'principal',  precio: 10,          es_precio_desde: 0 },
      { nombre: 'Extracción compleja',              categoria: 'Extracciones',             sede: 'principal',  precio: 15,          es_precio_desde: 0 },
      { nombre: 'Extracción de cordales',           categoria: 'Extracciones',             sede: 'principal',  precio: 25,          es_precio_desde: 0 },
      // Preventivo & Estética
      { nombre: 'Limpieza dental',                  categoria: 'Preventivo & Estética',    sede: 'principal',  precio: 15,          es_precio_desde: 0 },
      { nombre: 'Blanqueamiento (2 sesiones)',       categoria: 'Preventivo & Estética',    sede: 'principal',  precio: 30,          es_precio_desde: 0 },
      // Prótesis Consultorio (sede principal)
      { nombre: 'Impresión dental',                 categoria: 'Prótesis (Consultorio)',   sede: 'principal',  precio: 10  * M,     es_precio_desde: 0 },
      { nombre: 'Prótesis 1-2 piezas',              categoria: 'Prótesis (Consultorio)',   sede: 'principal',  precio: 70  * M,     es_precio_desde: 0 },
      { nombre: 'Prótesis 3-5 piezas',              categoria: 'Prótesis (Consultorio)',   sede: 'principal',  precio: 85  * M,     es_precio_desde: 0 },
      { nombre: 'Prótesis 6-8 piezas',              categoria: 'Prótesis (Consultorio)',   sede: 'principal',  precio: 105 * M,     es_precio_desde: 0 },
      { nombre: 'Prótesis 9 piezas',                categoria: 'Prótesis (Consultorio)',   sede: 'principal',  precio: 140 * M,     es_precio_desde: 0 },
      { nombre: 'Prótesis total (consultorio)',      categoria: 'Prótesis (Consultorio)',   sede: 'principal',  precio: 180 * M,     es_precio_desde: 0 },

      // ─── SEDE SECUNDARIA ──────────────────────────
      { nombre: 'Consulta general',                 categoria: 'Servicios Generales',      sede: 'secundaria', precio: 10,          es_precio_desde: 0 },
      { nombre: 'Limpieza dental',                  categoria: 'Servicios Generales',      sede: 'secundaria', precio: 15,          es_precio_desde: 0 },
      { nombre: 'Restauración',                     categoria: 'Servicios Generales',      sede: 'secundaria', precio: 15,          es_precio_desde: 1 },
      { nombre: 'Blanqueamiento',                   categoria: 'Servicios Generales',      sede: 'secundaria', precio: 40,          es_precio_desde: 0 },
      { nombre: 'Extracción simple',                categoria: 'Servicios Generales',      sede: 'secundaria', precio: 15,          es_precio_desde: 1 },

      // ─── AMBAS SEDES (Prótesis Premium x2.5) ─────
      // Prótesis Parcial en Acrílico
      { nombre: 'Prótesis parcial acrílico 1 pieza',   categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 112.5 * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 2 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 112.5 * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 3 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 125   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 4 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 125   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 5 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 145   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 6 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 145   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 7 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 155   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 8 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 155   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 9 piezas',  categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 175   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 10 piezas', categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 187.5 * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 11 piezas', categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 212.5 * M, es_precio_desde: 0 },
      { nombre: 'Prótesis parcial acrílico 12 piezas', categoria: 'Prótesis Parcial (Acrílico)',  sede: 'ambas', precio: 225   * M, es_precio_desde: 0 },
      // Prótesis Total Acrílico
      { nombre: 'Prótesis total superior-inferior',    categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 250  * M, es_precio_desde: 0 },
      { nombre: 'Transparente extra',                   categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 37.5 * M, es_precio_desde: 0 },
      { nombre: 'Malla prefabricada extra',              categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 37.5 * M, es_precio_desde: 0 },
      { nombre: 'Férula rígida acrílico',               categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 100  * M, es_precio_desde: 0 },
      { nombre: 'Férula blanda',                        categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 62.5 * M, es_precio_desde: 0 },
      { nombre: 'Férula acetato',                       categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 62.5 * M, es_precio_desde: 0 },
      { nombre: 'Rebasado total',                       categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 100  * M, es_precio_desde: 0 },
      { nombre: 'Rebasado parcial',                     categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 62.5 * M, es_precio_desde: 0 },
      { nombre: 'Reparación de prótesis',               categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 50   * M, es_precio_desde: 0 },
      { nombre: 'Rodete de mordida',                    categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 17.5 * M, es_precio_desde: 0 },
      { nombre: 'Vaciado de impresión c/u',             categoria: 'Prótesis Total (Acrílico)',    sede: 'ambas', precio: 25   * M, es_precio_desde: 0 },
      // Prótesis Flexible Valplast
      { nombre: 'Prótesis flexible Valplast 1-3 piezas',   categoria: 'Prótesis Flexible (Valplast)', sede: 'ambas', precio: 225   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis flexible Valplast 4-6 piezas',   categoria: 'Prótesis Flexible (Valplast)', sede: 'ambas', precio: 262.5 * M, es_precio_desde: 0 },
      { nombre: 'Prótesis flexible Valplast 7-9 piezas',   categoria: 'Prótesis Flexible (Valplast)', sede: 'ambas', precio: 300   * M, es_precio_desde: 0 },
      { nombre: 'Prótesis flexible Valplast 10-13 piezas', categoria: 'Prótesis Flexible (Valplast)', sede: 'ambas', precio: 375   * M, es_precio_desde: 0 },
    ];

    const insertServicio = db.prepare(`
      INSERT INTO catalogo_servicios (nombre, categoria, sede, precio, es_precio_desde)
      VALUES (@nombre, @categoria, @sede, @precio, @es_precio_desde)
    `);

    const insertarTodos = db.transaction(() => {
      for (const s of SERVICIOS_INICIALES) {
        insertServicio.run({ ...s, es_precio_desde: s.es_precio_desde || 0 });
      }
    });

    insertarTodos();
    console.log(`[DB] Catálogo inicial insertado: ${SERVICIOS_INICIALES.length} servicios`);
  }

  // Tabla de contactos (nombres de pacientes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contactos (
      numero_telefono TEXT PRIMARY KEY,
      nombre TEXT,
      creado_en DATETIME DEFAULT (datetime('now', 'localtime')),
      actualizado_en DATETIME DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Migraciones
  try { db.exec('ALTER TABLE configuracion_clinica ADD COLUMN bot_activo INTEGER DEFAULT 1'); } catch (_) {}
  try { db.exec('ALTER TABLE contactos ADD COLUMN total_visitas INTEGER DEFAULT 1'); } catch (_) {}
  try { db.exec('ALTER TABLE contactos ADD COLUMN notas TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE contactos ADD COLUMN ultima_actividad DATETIME'); } catch (_) {}

  console.log('[DB] Base de datos inicializada correctamente');
}

// Función para generar número de cotización
function generarNumeroCotizacion() {
  const año = new Date().getFullYear();
  const resultado = db.prepare(`
    SELECT MAX(CAST(SUBSTR(numero_cotizacion, -5) AS INTEGER)) as ultimo
    FROM cotizaciones
    WHERE numero_cotizacion LIKE 'COT-${año}-%'
  `).get();
  const ultimo = resultado.ultimo || 0;
  const siguiente = ultimo + 1;
  return `COT-${año}-${String(siguiente).padStart(5, '0')}`;
}

module.exports = { db, inicializarDB, generarNumeroCotizacion };
