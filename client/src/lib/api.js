// Cliente de API centralizado

const BASE_URL = '/api'

async function fetchApi(ruta, opciones = {}) {
  const url = `${BASE_URL}${ruta}`
  const respuesta = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opciones.headers },
    ...opciones,
  })

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(error.error || `Error ${respuesta.status}`)
  }

  return respuesta.json()
}

// Mensajes
export const api = {
  mensajes: {
    listar: () => fetchApi('/mensajes'),
    eliminar: (numero) => fetchApi(`/mensajes/${encodeURIComponent(numero)}`, { method: 'DELETE' }),
  },

  turnos: {
    listar: () => fetchApi('/turnos'),
    porFecha: (fecha) => fetchApi(`/turnos/${fecha}`),
    crear: (datos) => fetchApi('/turnos', { method: 'POST', body: JSON.stringify(datos) }),
    actualizar: (id, datos) => fetchApi(`/turnos/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  },

  cotizaciones: {
    listar: (params = {}) => {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'todos' && v !== 'todas'))
      ).toString()
      return fetchApi(`/cotizaciones${query ? `?${query}` : ''}`)
    },
    obtener: (id) => fetchApi(`/cotizaciones/${id}`),
    crear: (datos) => fetchApi('/cotizaciones', { method: 'POST', body: JSON.stringify(datos) }),
    actualizarEstado: (id, estado) =>
      fetchApi(`/cotizaciones/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
    eliminar: (id) => fetchApi(`/cotizaciones/${id}`, { method: 'DELETE' }),
    urlHtml: (id) => `${BASE_URL}/cotizaciones/${id}/html`,
  },

  catalogo: {
    listar: (params = {}) => {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      ).toString()
      return fetchApi(`/catalogo${query ? `?${query}` : ''}`)
    },
    actualizar: (id, datos) =>
      fetchApi(`/cotizaciones/catalogo/servicios/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  },

  configuracion: {
    obtener: () => fetchApi('/configuracion'),
    actualizar: (datos) => fetchApi('/configuracion', { method: 'PUT', body: JSON.stringify(datos) }),
  },

  contactos: {
    listar: (params = {}) => {
      const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString()
      return fetchApi(`/contactos${query ? `?${query}` : ''}`)
    },
    obtener: (numero) => fetchApi(`/contactos/${encodeURIComponent(numero)}`),
    actualizar: (numero, datos) => fetchApi(`/contactos/${encodeURIComponent(numero)}`, { method: 'PATCH', body: JSON.stringify(datos) }),
    eliminar: (numero) => fetchApi(`/contactos/${encodeURIComponent(numero)}`, { method: 'DELETE' }),
  },

  whatsapp: {
    estado: () => fetchApi('/whatsapp/estado'),
    qr: () => fetchApi('/whatsapp/qr'),
    toggleBot: (activo) => fetchApi('/whatsapp/bot', { method: 'PUT', body: JSON.stringify({ activo }) }),
  },
}
