# Admin WhatsApp — Contactos con control del dashboard vía IA

**Fecha:** 2026-05-23  
**Estado:** Aprobado — listo para implementar

---

## Resumen

Los contactos marcados como **admin** en el dashboard pueden controlar el sistema enviándole mensajes a la IA por WhatsApp. El agente se llama **Anelis** (renombrado de Sarah). Los pacientes normales no tienen cambios.

---

## Cambios por capa

### 1. Base de datos (`server/db.js`)

```sql
ALTER TABLE contactos ADD COLUMN es_admin INTEGER NOT NULL DEFAULT 0;
```

Migración segura con `IF NOT EXISTS` / columna opcional.

---

### 2. Backend — `server/services/openai.js`

**Renombrar "Sarah" → "Anelis"** en el system prompt de pacientes.

**Bifurcación en `procesarMensaje`:**

```
¿contacto.es_admin === 1?
  └─ sí → systemPromptAdmin + HERRAMIENTAS_ADMIN
  └─ no → systemPromptPaciente (actual, sin cambios)
```

**System prompt admin:**
- Nombre: Anelis, asistente de gestión de Klin
- Tono: directo, ejecutivo, sin saludos largos
- Respuestas cortas tipo resumen: listas, números, fechas
- Sin restricciones de "una pregunta a la vez"

---

### 3. Backend — `server/services/admin-tools.js` (archivo nuevo)

Exporta `HERRAMIENTAS_ADMIN` (array de tools para Groq) y `ejecutarHerramientaAdmin(nombre, args, config)`.

#### Herramientas (23 total)

**Agenda (7)**
| Herramienta | Descripción |
|-------------|-------------|
| `ver_turnos_dia` | Lista turnos de hoy o de una fecha dada |
| `ver_turnos_semana` | Lista turnos de los próximos 7 días |
| `ver_turnos_paciente_admin` | Turnos de un paciente por nombre o teléfono |
| `crear_turno_admin` | Crea turno para cualquier paciente |
| `cancelar_turno_admin` | Cancela turno por ID |
| `completar_turno` | Marca turno como completado por ID |
| `reprogramar_turno_admin` | Cambia fecha/hora de un turno por ID |

**Stats (4)**
| Herramienta | Descripción |
|-------------|-------------|
| `ver_stats_clinica` | Resumen general: pacientes, turnos hoy, cot. pendientes, ingresos |
| `ver_ingresos_mes` | Ingresos del mes actual en USD |
| `ver_pacientes_nuevos` | Cantidad y lista de pacientes nuevos del mes |
| `ver_proximos_confirmados` | Próximos turnos con estado "confirmado" |

**Cotizaciones (2)**
| Herramienta | Descripción |
|-------------|-------------|
| `ver_cotizaciones_pendientes` | Lista cotizaciones en estado "enviada" o "pendiente" |
| `cambiar_estado_cotizacion` | Cambia estado de una cotización por ID |

**Pacientes (4)**
| Herramienta | Descripción |
|-------------|-------------|
| `buscar_paciente` | Busca por nombre o teléfono, devuelve info + stats |
| `agregar_nota_paciente` | Agrega/reemplaza notas de un contacto |
| `ver_recordatorios` | Lista recordatorios pendientes o de la semana |
| `crear_recordatorio` | Crea un recordatorio para un paciente |

**Sistema (6)**
| Herramienta | Descripción |
|-------------|-------------|
| `ver_estado_bot` | Devuelve si el bot está activo o pausado |
| `pausar_bot` | Desactiva respuestas automáticas |
| `activar_bot` | Activa respuestas automáticas |
| `enviar_mensaje_paciente` | Envía mensaje de WhatsApp a un número vía Baileys |
| `consultar_precio_servicio` | Busca precio de un servicio en el catálogo |
| `actualizar_precio_servicio` | Actualiza precio de un servicio por nombre o ID |

---

### 4. Backend — `server/routes/contactos.js`

El endpoint `PATCH /api/contactos/:numero` ya existe. Agregar `es_admin` al listado de campos actualizables:

```js
const CAMPOS = ['nombre', 'notas', 'es_admin']
```

---

### 5. Frontend — `client/src/components/TabContactos.jsx`

**TarjetaContacto — fila principal:**
- Si `c.es_admin`: mostrar badge `Admin` (fondo `${paleta.primario}18`, texto `paleta.primario`)
- Avatar: borde sutil con `paleta.primario` cuando es admin

**TarjetaContacto — panel expandido:**
- Nueva sección "Acceso Admin" con toggle switch
- Cuando ON: fondo del toggle = `paleta.primario`
- Descripción: "Puede controlar el dashboard desde WhatsApp"

**Stats bar:**
- Agregar card `Admins` con count de contactos con `es_admin = 1`
- Grid pasa de 3 a 4 columnas

---

## Flujo completo

```
Admin escribe por WhatsApp
       ↓
webhook recibe mensaje
       ↓
procesarMensaje() carga contacto del DB
       ↓
contacto.es_admin === 1?
  ├─ NO → flujo paciente normal (Anelis recepcionista)
  └─ SÍ → flujo admin (Anelis gestión)
              ↓
         system prompt ejecutivo
              ↓
         Groq invoca herramienta admin
              ↓
         ejecutarHerramientaAdmin()
              ↓
         respuesta tipo resumen al admin
```

---

## Nombre del agente

**Anelis** (reemplaza "Sarah" en todos los system prompts y referencias en `openai.js`)

---

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `server/db.js` | Agregar columna `es_admin` con migración segura |
| `server/services/openai.js` | Bifurcación admin/paciente + renombrar Sarah→Anelis |
| `server/services/admin-tools.js` | **Nuevo** — 23 herramientas + ejecutores |
| `server/routes/contactos.js` | Agregar `es_admin` a campos actualizables |
| `client/src/components/TabContactos.jsx` | Toggle + badge admin + stat card |
