// Genera el HTML de cotización — Diseño Od. Franyelis Moreno

function generarHtmlCotizacion(cotizacion, items, config) {
  const nombreClinica = config?.nombre_clinica || 'Od. Franyelis Moreno';
  const direccion     = config?.direccion || '';
  const telefono      = config?.telefono  || '';
  const email         = config?.email     || '';
  const instagram     = '@franyelismorenoodonto';

  const nombreSede    = cotizacion.sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria';
  const fechaEmision  = new Date(cotizacion.creado_en).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

  let fechaVencimiento = '';
  if (cotizacion.validez_dias) {
    const v = new Date(cotizacion.creado_en);
    v.setDate(v.getDate() + cotizacion.validez_dias);
    fechaVencimiento = v.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // Agrupar ítems por categoría
  const porCategoria = {};
  for (const item of items) {
    if (!porCategoria[item.categoria]) porCategoria[item.categoria] = [];
    porCategoria[item.categoria].push(item);
  }

  // Filas de la tabla
  let filasHTML = '';
  let par = false;
  for (const [cat, servicios] of Object.entries(porCategoria)) {
    filasHTML += `
      <tr>
        <td colspan="4" style="background:#edf5f0;color:#3d6b52;font-weight:700;font-size:10px;
          padding:7px 14px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #d4e8dc;">
          ${cat}
        </td>
      </tr>`;
    for (const item of servicios) {
      filasHTML += `
        <tr style="background:${par ? '#f9fbfa' : '#fff'};">
          <td style="padding:10px 14px;font-size:13px;color:#1f2937;border-bottom:1px solid #f0f4f2;">${item.nombre_servicio}</td>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;text-align:center;border-bottom:1px solid #f0f4f2;">${item.cantidad}</td>
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;text-align:right;border-bottom:1px solid #f0f4f2;">$${Number(item.precio_unitario).toFixed(2)}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#3d6b52;text-align:right;border-bottom:1px solid #f0f4f2;">$${Number(item.subtotal).toFixed(2)}</td>
        </tr>`;
      par = !par;
    }
  }

  const notasHTML = cotizacion.notas
    ? `<div style="margin:0 0 16px;padding:12px 16px;background:#fdf0f2;border-left:3px solid #c97b84;border-radius:6px;">
         <p style="font-size:10px;font-weight:700;color:#c97b84;margin:0 0 4px;letter-spacing:0.8px;text-transform:uppercase;">Observaciones</p>
         <p style="font-size:12px;color:#6b7280;margin:0;">${cotizacion.notas}</p>
       </div>`
    : '';

  // SVG del logo "fm" como marca de agua — fiel al logo real
  const logoWatermark = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 180"
      style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
             width:420px;height:auto;opacity:0.09;pointer-events:none;z-index:0;">
      <!-- Letra f -->
      <path d="M 52 48 C 52 38, 58 28, 70 26 C 80 24, 88 30, 86 40
               L 84 80 L 100 80 L 98 90 L 84 90 L 78 148"
        stroke="#3d6b52" stroke-width="4.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Barra del f -->
      <path d="M 60 72 L 100 68"
        stroke="#3d6b52" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Letra m -->
      <path d="M 116 88 L 112 148"
        stroke="#3d6b52" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M 116 88 C 122 72, 148 66, 158 82 C 164 92, 162 112, 160 148"
        stroke="#3d6b52" stroke-width="4.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 158 88 C 165 72, 190 66, 200 82 C 207 92, 205 112, 203 148"
        stroke="#3d6b52" stroke-width="4.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Línea base decorativa -->
      <path d="M 60 155 C 120 162, 220 160, 310 156 C 380 153, 430 146, 460 136
               C 475 130, 482 122, 478 114 C 474 107, 466 107, 461 112"
        stroke="#3d6b52" stroke-width="3" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Floritura final -->
      <path d="M 461 112 C 456 105, 450 100, 454 110 C 458 120, 466 118, 462 108"
        stroke="#3d6b52" stroke-width="2.5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 462 108 C 458 100, 452 96, 456 104"
        stroke="#3d6b52" stroke-width="2" fill="none"
        stroke-linecap="round"/>
    </svg>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Cotización ${cotizacion.numero_cotizacion}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #f0f4f2;
      color: #1f2937;
    }

    .pagina {
      max-width: 794px;
      margin: 32px auto;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(90,138,110,0.12);
      position: relative;
    }

    /* ── Header ─────────────────────────────────────── */
    .header {
      background: #5a8a6e;
      padding: 32px 40px 24px;
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 180px; height: 180px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -20px; left: 30%;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
    }
    .logo-zona { display: flex; flex-direction: column; gap: 4px; }
    .logo-fm {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-size: 62px;
      font-weight: 400;
      color: #fff;
      line-height: 1;
      letter-spacing: -1px;
    }
    .logo-fm span {
      display: block;
      width: 78px;
      height: 1.5px;
      background: rgba(255,255,255,0.5);
      margin-top: 4px;
      border-radius: 2px;
    }
    .clinica-nombre {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.85);
      margin-top: 8px;
    }
    .clinica-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      letter-spacing: 1px;
      margin-top: 3px;
    }
    .numero-zona { text-align: right; }
    .numero-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
    }
    .numero-valor {
      font-family: 'Cormorant Garamond', serif;
      font-size: 34px;
      font-weight: 600;
      color: #fff;
      margin-top: 4px;
    }
    .numero-fecha {
      font-size: 12px;
      color: rgba(255,255,255,0.75);
      margin-top: 5px;
    }

    /* Franja blush decorativa */
    .franja {
      height: 3px;
      background: linear-gradient(to right, #c97b84, #e8aab0, #c97b84);
      margin-top: 20px;
    }

    /* ── Datos del paciente ──────────────────────────── */
    .datos {
      display: flex;
      gap: 0;
      border-bottom: 1px solid #e5eee8;
    }
    .dato-col {
      flex: 1;
      padding: 20px 40px;
      border-right: 1px solid #e5eee8;
    }
    .dato-col:last-child { border-right: none; }
    .dato-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .dato-valor {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
    .dato-sub {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 3px;
    }

    /* ── Tabla servicios ─────────────────────────────── */
    .tabla-wrap {
      padding: 24px 40px 28px;
      position: relative;
    }
    .tabla-titulo {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #5a8a6e;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tabla-titulo::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5eee8;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #5a8a6e; }
    thead th {
      padding: 9px 14px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
    }
    thead th:last-child,
    thead th:nth-child(3) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    .total-row td {
      padding: 13px 14px;
      font-size: 14px;
      font-weight: 700;
      border-top: 2px solid #5a8a6e;
    }
    .total-row td:first-child {
      color: #6b7280;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding-right: 0;
    }
    .total-row td:last-child {
      text-align: right;
      color: #5a8a6e;
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px;
    }

    /* ── Sección inferior ────────────────────────────── */
    .inferior { padding: 0 40px 28px; }

    .validez-box {
      background: #edf5f0;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.6;
      border-left: 3px solid #5a8a6e;
    }
    .validez-box strong { color: #3d6b52; }

    .sede-pill {
      display: inline-block;
      background: #edf5f0;
      color: #3d6b52;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 14px;
    }

    /* ── Footer ──────────────────────────────────────── */
    .footer {
      background: #3d6b52;
      padding: 14px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-logo {
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 28px;
      color: rgba(255,255,255,0.95);
    }
    .footer-info {
      font-size: 12px;
      color: rgba(255,255,255,0.88);
      text-align: right;
      line-height: 1.7;
      font-weight: 500;
    }

    @media print {
      body { background: #fff; }
      .pagina { box-shadow: none; margin: 0; border-radius: 0; max-width: 100%; }
    }
    @page { size: A4; margin: 0.5cm; }
  </style>
</head>
<body>
  <div class="pagina">

    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="logo-zona">
          <div class="logo-fm">fm<span></span></div>
          <div class="clinica-nombre">Od. Franyelis Moreno</div>
          <div class="clinica-sub">Odontólogo General</div>
        </div>
        <div class="numero-zona">
          <div class="numero-label">Cotización</div>
          <div class="numero-valor">${cotizacion.numero_cotizacion}</div>
          <div class="numero-fecha">${fechaEmision}</div>
        </div>
      </div>
      <div class="franja"></div>
    </div>

    <!-- Datos -->
    <div class="datos">
      <div class="dato-col">
        <div class="dato-label">Paciente</div>
        <div class="dato-valor">${cotizacion.nombre_paciente}</div>
        <div class="dato-sub">${cotizacion.numero_telefono}</div>
      </div>
      <div class="dato-col">
        <div class="dato-label">Clínica</div>
        <div class="dato-valor">${nombreClinica}</div>
        <div class="dato-sub">${direccion || instagram}</div>
      </div>
      <div class="dato-col">
        <div class="dato-label">Contacto</div>
        <div class="dato-valor">${telefono || instagram}</div>
        <div class="dato-sub">${email || ''}</div>
      </div>
    </div>

    <!-- Tabla con marca de agua -->
    <div class="tabla-wrap">
      ${logoWatermark}
      <div class="tabla-titulo">Servicios incluidos</div>
      <div class="sede-pill">${nombreSede}</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Servicio</th>
            <th style="text-align:center;">Cant.</th>
            <th style="text-align:right;">P. Unit.</th>
            <th style="text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${filasHTML}
          <tr class="total-row">
            <td colspan="3">Total USD</td>
            <td>$${Number(cotizacion.total).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Inferior -->
    <div class="inferior">
      ${notasHTML}
      <div class="validez-box">
        ${cotizacion.validez_dias
          ? `<strong>Validez:</strong> Esta cotización es válida por <strong>${cotizacion.validez_dias} días</strong>${fechaVencimiento ? ` (hasta el ${fechaVencimiento})` : ''}.`
          : ''
        }
        ${cotizacion.validez_dias ? '<br>' : ''}
        <strong>Nota:</strong> Cotización referencial, sujeta a evaluación clínica. Valores en dólares estadounidenses (USD).
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">fm</div>
      <div class="footer-info">
        ${instagram}<br>
        ${telefono ? telefono + (email ? ' · ' : '') : ''}${email || ''}
      </div>
    </div>

  </div>
</body>
</html>`;
}

module.exports = { generarHtmlCotizacion };
