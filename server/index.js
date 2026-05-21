require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { inicializarDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true,
}));

// Parser para Twilio (x-www-form-urlencoded) y JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rutas de la API
const webhookRouter = require('./routes/webhook');
const mensajesRouter = require('./routes/mensajes');
const turnosRouter = require('./routes/turnos');
const cotizacionesRouter = require('./routes/cotizaciones');
const configuracionRouter = require('./routes/configuracion');

app.use('/api/webhook', webhookRouter);
app.use('/api/mensajes', mensajesRouter);
app.use('/api/turnos', turnosRouter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/catalogo', (req, res, next) => {
  // Redirigir /api/catalogo a /api/cotizaciones/catalogo/servicios
  req.url = '/catalogo/servicios' + (req.url === '/' ? '' : req.url);
  cotizacionesRouter(req, res, next);
});
app.use('/api/configuracion', configuracionRouter);

// Ruta de estado de la API
app.get('/api/status', (req, res) => {
  const urlPublica = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
  res.json({
    estado: 'activo',
    version: '1.0.0',
    webhook_url: `${urlPublica}/api/webhook/whatsapp`,
    timestamp: new Date().toISOString(),
  });
});

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Inicializar DB y arrancar servidor
inicializarDB();

app.listen(PORT, () => {
  const urlPublica = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
  console.log(`[Servidor] Corriendo en ${urlPublica}`);
  console.log(`[Servidor] Webhook URL: ${urlPublica}/api/webhook/whatsapp`);
  console.log(`[Servidor] Dashboard: http://localhost:${PORT}`);
});
