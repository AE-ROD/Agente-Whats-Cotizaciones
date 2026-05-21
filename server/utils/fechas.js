// Utilidades para manejo de fechas en español

function formatearFecha(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatearFechaLarga(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatearFechaHora(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Devuelve array de horarios disponibles en un día dado los ocupados
function calcularHorariosDisponibles(turnosDelDia) {
  const horariosTodos = [];
  for (let h = 9; h < 18; h++) {
    horariosTodos.push(`${String(h).padStart(2, '0')}:00`);
    horariosTodos.push(`${String(h).padStart(2, '0')}:30`);
  }

  const ocupados = turnosDelDia
    .filter(t => t.estado !== 'cancelado')
    .map(t => {
      const d = new Date(t.fecha_turno);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

  return {
    disponibles: horariosTodos.filter(h => !ocupados.includes(h)),
    ocupados,
  };
}

module.exports = { formatearFecha, formatearFechaLarga, formatearFechaHora, calcularHorariosDisponibles };
