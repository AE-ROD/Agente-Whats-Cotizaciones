# Sistema Dental — Turnos + Cotizaciones con WhatsApp IA

Sistema de gestión completo para clínicas dentales con un **agente IA de recepción por WhatsApp** y un **dashboard web** para el personal.

## Características

- 🤖 **Agente IA (Sarah)** que atiende pacientes por WhatsApp con GPT-4o
- 📅 **Gestión de turnos** — agendar, consultar, cancelar y reprogramar
- 💰 **Cotizaciones automáticas** — presupuestos generados por IA durante la conversación
- 📊 **Dashboard web** — panel de administración con React + Tailwind
- 📄 **PDF de cotizaciones** — documentos profesionales imprimibles
- 🗄️ **SQLite autocontenido** — sin servicios externos, zero-config

---

## Requisitos previos

- Node.js 18+ (recomendado Node.js 20 o 22)
- Cuenta de OpenAI con acceso a GPT-4o
- Cuenta de Twilio con WhatsApp Sandbox activado

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd agente-whats-cotizaciones

# 2. Instalar dependencias (servidor + cliente)
npm run setup

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY
```

---

## Configuración de variables de entorno

Crear el archivo `.env` en la raíz del proyecto:

```env
# Requerido: API Key de OpenAI
OPENAI_API_KEY=sk-...

# Opcional: puerto del servidor (default 3001)
PORT=3001

# Opcional: URL pública en producción (para mostrar webhook URL)
PUBLIC_URL=https://miapp.railway.app
```

---

## Configuración de Twilio WhatsApp Sandbox

1. Ir a [Twilio Console](https://console.twilio.com) → Messaging → Try it out → Send a WhatsApp message
2. Activar el sandbox siguiendo las instrucciones
3. En "When a message comes in", configurar la URL del webhook:
   ```
   https://tu-dominio.com/api/webhook/whatsapp
   ```
4. En desarrollo, usar [ngrok](https://ngrok.com) para exponer el puerto local:
   ```bash
   ngrok http 3001
   # Copiar la URL https de ngrok como webhook en Twilio
   ```

---

## Levantar en desarrollo

```bash
npm run dev
```

Esto levanta simultáneamente:
- Servidor Express en `http://localhost:3001`
- Frontend Vite en `http://localhost:5173`

---

## Build para producción

```bash
npm run build   # Compila el frontend
npm start       # Levanta el servidor (sirve el frontend compilado)
```

---

## Flujo de cotizaciones por WhatsApp

1. **Paciente escribe:** "Hola, ¿cuánto sale una prótesis parcial de 3 piezas?"
2. **Sarah (IA) consulta el catálogo** con `consultar_catalogo` y responde con precios reales
3. **Paciente confirma:** "Sí, quiero esa cotización a nombre de Juan García"
4. **Sarah genera la cotización** con `generar_cotizacion_ia` y envía el resumen formateado
5. **Paciente responde:** `ACEPTAR` o `RECHAZAR`
6. **Sistema actualiza** el estado de la cotización automáticamente
7. **Dashboard muestra** la cotización con el estado actualizado en tiempo real

---

## Estructura del proyecto

```
.
├── server/
│   ├── index.js                  # Servidor Express principal
│   ├── db.js                     # Base de datos SQLite + esquema + datos iniciales
│   ├── routes/
│   │   ├── webhook.js            # Webhook de Twilio (WhatsApp)
│   │   ├── mensajes.js           # API de mensajes
│   │   ├── turnos.js             # API de turnos
│   │   ├── cotizaciones.js       # API de cotizaciones y catálogo
│   │   └── configuracion.js      # API de configuración
│   ├── services/
│   │   ├── openai.js             # Servicio IA con function calling (7 herramientas)
│   │   └── twilio.js             # Envío de mensajes WhatsApp
│   └── utils/
│       ├── fechas.js             # Utilidades de fechas en español
│       └── cotizacion-html.js    # Generador de HTML para cotizaciones
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx       # Página de inicio
│       │   └── Dashboard.jsx     # Panel de administración
│       └── components/
│           ├── TabMensajes.jsx
│           ├── TabTurnos.jsx
│           ├── TabCotizaciones.jsx
│           ├── VisorCotizacion.jsx
│           ├── FormularioCotizacion.jsx
│           └── TabConfiguracion.jsx
├── .env.example
└── package.json
```

---

## Preguntas frecuentes

**¿Dónde se guarda la base de datos?**
En el archivo `clinica.db` en la raíz del proyecto. Se crea automáticamente al primer arranque.

**¿Puedo cambiar los precios del catálogo?**
Sí, desde el Dashboard → Configuración → Catálogo de Servicios. Los cambios se reflejan inmediatamente en el agente IA.

**¿Qué pasa si el paciente no responde ACEPTAR/RECHAZAR?**
La cotización queda en estado "enviada". Podés cambiarla manualmente desde el Dashboard.

**¿El agente puede agendar turnos automáticamente?**
Sí. Si el paciente pide un turno por WhatsApp, Sarah pedirá los datos necesarios y lo agendará directamente.

**¿Cómo funciona el rate limiting?**
El webhook limita a 30 mensajes por minuto por número de teléfono para evitar abusos.
