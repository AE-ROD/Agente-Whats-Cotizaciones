// Generador de PDF para cotizaciones usando pdfkit

const PDFDocument = require('pdfkit');

const COLOR_PRIMARIO = '#063740';
const COLOR_ORO = '#a8781a';

async function generarPdfCotizacion(cotizacion, items, config) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const nombreClinica = config?.nombre_clinica || 'Klin';
    const sede = cotizacion.sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria';
    const fecha = new Date(cotizacion.creado_en).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    // ── Header ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(COLOR_PRIMARIO);

    doc.fillColor('white')
      .fontSize(22).font('Helvetica-Bold')
      .text(nombreClinica, 50, 22);

    doc.fontSize(9).font('Helvetica')
      .text('Odontología de confianza', 50, 50);

    doc.fontSize(9)
      .text(`Cotización N°`, 380, 30)
      .fontSize(14).font('Helvetica-Bold')
      .text(cotizacion.numero_cotizacion, 380, 44);

    // ── Datos del paciente ───────────────────────────────────────────────
    let y = 110;

    doc.fillColor('#444').fontSize(8).font('Helvetica-Bold')
      .text('PACIENTE', 50, y)
      .text('SEDE', 260, y)
      .text('FECHA', 380, y)
      .text('VALIDEZ', 470, y);

    y += 14;

    doc.fillColor('#111').fontSize(11).font('Helvetica-Bold')
      .text(cotizacion.nombre_paciente, 50, y);

    doc.fontSize(9).font('Helvetica').fillColor('#444')
      .text(sede, 260, y)
      .text(fecha, 380, y)
      .text(`${cotizacion.validez_dias} días`, 470, y);

    y += 12;
    doc.fillColor('#666').fontSize(8).text(cotizacion.numero_telefono, 50, y);

    y += 24;

    // Línea separadora
    doc.strokeColor(COLOR_PRIMARIO).lineWidth(1.5)
      .moveTo(50, y).lineTo(545, y).stroke();

    y += 16;

    // ── Tabla de servicios ───────────────────────────────────────────────
    // Header de tabla
    doc.rect(50, y, 495, 22).fill(COLOR_PRIMARIO);
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
      .text('SERVICIO', 60, y + 7)
      .text('CANT.', 370, y + 7, { width: 45, align: 'center' })
      .text('P. UNIT.', 415, y + 7, { width: 65, align: 'right' })
      .text('SUBTOTAL', 480, y + 7, { width: 60, align: 'right' });
    y += 22;

    // Agrupar por categoría
    const porCategoria = {};
    for (const item of items) {
      if (!porCategoria[item.categoria]) porCategoria[item.categoria] = [];
      porCategoria[item.categoria].push(item);
    }

    let fondo = false;
    for (const [categoria, servicios] of Object.entries(porCategoria)) {
      // Sub-header de categoría
      doc.rect(50, y, 495, 18).fill('#e4eef0');
      doc.fillColor(COLOR_PRIMARIO).fontSize(7.5).font('Helvetica-Bold')
        .text(categoria.toUpperCase(), 60, y + 5);
      y += 18;

      for (const item of servicios) {
        if (fondo) doc.rect(50, y, 495, 20).fill('#f8f8f8');
        doc.fillColor('#222').fontSize(9).font('Helvetica')
          .text(item.nombre_servicio, 60, y + 5, { width: 300 })
          .text(String(item.cantidad), 370, y + 5, { width: 45, align: 'center' })
          .text(`$${Number(item.precio_unitario).toFixed(2)}`, 415, y + 5, { width: 65, align: 'right' })
          .text(`$${Number(item.subtotal).toFixed(2)}`, 480, y + 5, { width: 60, align: 'right' });
        y += 20;
        fondo = !fondo;
      }
    }

    y += 12;

    // Fila total
    doc.rect(350, y, 195, 30).fill(COLOR_PRIMARIO);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL USD', 360, y + 9)
      .text(`$${Number(cotizacion.total).toFixed(2)}`, 480, y + 9, { width: 60, align: 'right' });

    y += 50;

    // Nota
    doc.strokeColor('#ccc').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 10;
    doc.fillColor('#888').fontSize(7.5).font('Helvetica-Oblique')
      .text(
        'Cotización referencial, sujeta a evaluación clínica. Los valores son en USD y están sujetos a cambio.',
        50, y, { width: 495, align: 'center' }
      );

    doc.end();
  });
}

module.exports = { generarPdfCotizacion };
