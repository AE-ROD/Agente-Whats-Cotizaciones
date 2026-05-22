// Genera el HTML completo y autocontenido del documento cotización para impresión

function generarHtmlCotizacion(cotizacion, items, config) {
  const nombreClinica = config?.nombre_clinica || 'Klin';
  const direccion = config?.direccion || '';
  const telefono = config?.telefono || '';
  const email = config?.email || '';

  const nombreSede = cotizacion.sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria';

  const fecha = new Date(cotizacion.creado_en);
  const fechaFormateada = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Calcular fecha de vencimiento
  let fechaVencimiento = '';
  if (cotizacion.validez_dias) {
    const venc = new Date(cotizacion.creado_en);
    venc.setDate(venc.getDate() + cotizacion.validez_dias);
    fechaVencimiento = venc.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Agrupar ítems por categoría
  const itemsPorCategoria = {};
  for (const item of items) {
    if (!itemsPorCategoria[item.categoria]) {
      itemsPorCategoria[item.categoria] = [];
    }
    itemsPorCategoria[item.categoria].push(item);
  }

  // Generar filas de la tabla
  let filasHTML = '';
  let filaPar = false;
  for (const [categoria, serviciosCategoria] of Object.entries(itemsPorCategoria)) {
    filasHTML += `
      <tr>
        <td colspan="4" style="background:#f0f4f5;font-weight:700;color:#063740;padding:8px 12px;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">
          ${categoria}
        </td>
      </tr>
    `;
    for (const item of serviciosCategoria) {
      const bgFila = filaPar ? '#f9fafb' : '#ffffff';
      filaPar = !filaPar;
      filasHTML += `
        <tr style="background:${bgFila};">
          <td style="padding:10px 12px;font-size:13px;color:#1a1a1a;">${item.nombre_servicio}</td>
          <td style="padding:10px 12px;font-size:13px;color:#555;text-align:center;">${item.cantidad}</td>
          <td style="padding:10px 12px;font-size:13px;color:#555;text-align:right;">$${Number(item.precio_unitario).toFixed(2)}</td>
          <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#063740;text-align:right;">$${Number(item.subtotal).toFixed(2)}</td>
        </tr>
      `;
    }
  }

  const notasHTML = cotizacion.notas
    ? `<div style="margin-top:20px;padding:14px;background:#fffbeb;border-left:4px solid #a8781a;border-radius:4px;">
         <p style="font-size:12px;font-weight:700;color:#a8781a;margin:0 0 6px;">OBSERVACIONES</p>
         <p style="font-size:13px;color:#555;margin:0;">${cotizacion.notas}</p>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización ${cotizacion.numero_cotizacion} — ${nombreClinica}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Cormorant+Garamond:wght@400;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Lato', Arial, sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
    }

    .documento {
      max-width: 800px;
      margin: 30px auto;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }

    /* Header */
    .header {
      background: #063740;
      padding: 28px 36px 0;
      color: #fff;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
    }
    .clinica-nombre {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .clinica-sub {
      font-size: 12px;
      color: #a0c4cc;
      margin-top: 4px;
    }
    .cotizacion-num {
      text-align: right;
    }
    .cotizacion-label {
      font-size: 11px;
      color: #a0c4cc;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .cotizacion-valor {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin-top: 4px;
    }
    .header-divider {
      height: 3px;
      background: #a8781a;
      margin: 0 -36px;
    }
    .header-info {
      padding: 14px 0;
      display: flex;
      gap: 24px;
      font-size: 12px;
      color: #a0c4cc;
    }
    .header-info span { color: #fff; font-weight: 700; }

    /* Datos */
    .datos-section {
      padding: 24px 36px;
      display: flex;
      gap: 32px;
      border-bottom: 1px solid #e8ecee;
    }
    .datos-col { flex: 1; }
    .datos-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .datos-valor {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .datos-sub {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    /* Tabla de servicios */
    .tabla-section { padding: 0 36px 24px; }
    .tabla-titulo {
      font-size: 11px;
      font-weight: 700;
      color: #063740;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 20px 0 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead tr {
      background: #063740;
      color: #fff;
    }
    thead th {
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) {
      text-align: right;
    }
    thead th:nth-child(2) { text-align: center; }

    /* Total */
    .total-row {
      background: #fef3c7;
      border-top: 2px solid #a8781a;
    }
    .total-row td {
      padding: 14px 12px;
      font-size: 16px;
      font-weight: 700;
      color: #063740;
    }
    .total-row td:last-child { text-align: right; color: #a8781a; }

    /* Validez */
    .validez-section { padding: 0 36px 24px; }
    .validez-box {
      background: #f0f4f5;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 12px;
      color: #555;
      margin-top: 20px;
    }
    .validez-box strong { color: #063740; }

    /* Footer */
    .footer {
      background: #063740;
      padding: 16px 36px;
      text-align: center;
      color: #a0c4cc;
      font-size: 11px;
    }
    .footer span { color: #fff; font-weight: 700; }

    /* Print */
    @media print {
      body { background: #fff; }
      .documento { box-shadow: none; margin: 0; max-width: 100%; }
    }
    @page {
      size: A4;
      margin: 0.8cm;
    }
  </style>
</head>
<body>
  <div class="documento">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="clinica-nombre">${nombreClinica}</div>
          <div class="clinica-sub">Odontología de confianza</div>
        </div>
        <div class="cotizacion-num">
          <div class="cotizacion-label">Cotización N°</div>
          <div class="cotizacion-valor">${cotizacion.numero_cotizacion}</div>
        </div>
      </div>
      <div class="header-divider"></div>
      <div class="header-info">
        <div>📅 <span>${fechaFormateada}</span></div>
        ${fechaVencimiento ? `<div>⏱ Válida hasta: <span>${fechaVencimiento}</span></div>` : ''}
        <div>📍 <span>${nombreSede}</span></div>
      </div>
    </div>

    <!-- Datos del paciente y clínica -->
    <div class="datos-section">
      <div class="datos-col">
        <div class="datos-label">Paciente</div>
        <div class="datos-valor">${cotizacion.nombre_paciente}</div>
        <div class="datos-sub">Tel: ${cotizacion.numero_telefono}</div>
      </div>
      <div class="datos-col">
        <div class="datos-label">Clínica</div>
        <div class="datos-valor">${nombreClinica}</div>
        <div class="datos-sub">${direccion}</div>
      </div>
      <div class="datos-col">
        <div class="datos-label">Contacto</div>
        <div class="datos-valor">${telefono}</div>
        <div class="datos-sub">${email}</div>
      </div>
    </div>

    <!-- Tabla de servicios -->
    <div class="tabla-section">
      <div class="tabla-titulo">Servicios incluidos</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Servicio</th>
            <th style="text-align:center;">Cant.</th>
            <th style="text-align:right;">P. Unitario</th>
            <th style="text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${filasHTML}
          <tr class="total-row">
            <td colspan="3" style="text-align:right;padding-right:16px;font-size:13px;letter-spacing:0.5px;">TOTAL USD</td>
            <td>$${Number(cotizacion.total).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Observaciones y validez -->
    <div class="validez-section">
      ${notasHTML}
      <div class="validez-box">
        ${cotizacion.validez_dias
          ? `<strong>Validez:</strong> Esta cotización es válida por <strong>${cotizacion.validez_dias} días</strong> a partir de la fecha de emisión (hasta ${fechaVencimiento}).`
          : '<strong>Sin fecha de vencimiento.</strong>'
        }
        <br>
        <strong>Nota:</strong> Cotización referencial, sujeta a evaluación clínica. Valores expresados en dólares estadounidenses (USD).
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>${nombreClinica}</span> | ${direccion} | ${telefono} | ${email}
    </div>
  </div>
</body>
</html>`;
}

module.exports = { generarHtmlCotizacion };
