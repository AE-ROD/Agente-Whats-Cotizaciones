# Diseño 3 — Dashboard Klin · Od. Franyelis Moreno

**Fecha:** 2026-05-23  
**Estado:** Aprobado — listo para implementar

---

## Decisiones de diseño

### Layout
**Opción elegida:** C — Hero banner + navigation pills

- Header fijo con logo `fm` + nombre de la clínica
- Hero banner prominente con saludo personalizado
- Pills de navegación horizontales (scrollables en mobile)
- Contenido en área principal debajo
- Bottom navigation bar en mobile (6 items)

### Paleta de colores — Sistema dinámico por hora

El hero banner cambia de gradiente automáticamente según la hora local del dispositivo. El resto del UI mantiene colores fijos.

| Momento | Rango | Gradiente | Descripción |
|---|---|---|---|
| ⛅ Buenos días | 6:00 – 12:59 | `#6B7FC4 → #ADBCEA` | Lavanda claro y fresco |
| ☀️ Buenas tardes | 13:00 – 19:59 | `#4A5A9C → #7885C8` | Lavanda medio, más profundo |
| 🌙 Buenas noches | 20:00 – 5:59 | `#0B1D3A → #1a3870` | Azul marino profundo |

**Colores fijos del sistema:**
- Fondo página: `#F8FAFC`
- Cards: `#FFFFFF` con borde `#E2E8F0`
- Texto principal: `#1E293B`
- Texto secundario: `#64748B`
- Pills activas: color primario del momento (`#6B7FC4` / `#4A5A9C` / `#0B1D3A`)
- Pills inactivas: fondo `#FFFFFF`, borde `#E2E8F0`, texto `#64748B`
- Acento en chips del hero: `#C8D5F5` (periwinkle claro)

### Tipografía
- **Logo fm:** Cormorant Garamond italic
- **Nombre clínica / titular saludo:** Cormorant Garamond italic
- **Todo lo demás:** Inter (300/400/500/600)

---

## Estructura del header

```
[Logo fm]  Od. Franyelis Moreno          [Estado WhatsApp]  [Inicio]
──────────────────────────────────────────────────────────────────────
[Inicio] [Mensajes] [Turnos] [Cotizaciones] [Contactos] [Recordatorios] [Config]
```

- Header `sticky top-0` en blanco con sombra sutil
- Logo `fm` en Cormorant Garamond italic, tamaño ~18px
- Nombre en Inter semibold 13px
- Estado WhatsApp como pill pequeña (verde si conectado)
- Nav pills scrollables horizontalmente en mobile

---

## Hero banner (TabInicio)

```
┌─────────────────────────────────────────────────────────┐
│  ⛅ Buenos días                               [fm faint] │
│  Doctora Franyelis                                       │
│  OD. FRANYELIS MORENO · ODONTÓLOGO GENERAL              │
│                                                          │
│  [📅 3 turnos hoy]  [📋 2 pendientes]                   │
└─────────────────────────────────────────────────────────┘
```

- `border-radius: 16px`
- Círculos decorativos en esquinas con `opacity: 0.06`
- Logo `fm` fantasma en esquina derecha `opacity: 0.12`
- Chips de info con `background: rgba(255,255,255,0.18)` y border sutil
- Texto de chips en `#C8D5F5` (periwinkle) para mañana/tarde; igual para noche

---

## Stat cards

4 cards en grid `2x2` (mobile) / `4x1` (desktop):

- Fondo blanco, borde `#E2E8F0`
- Barra de progreso sutil debajo del número
- Card de ingresos: fondo en color del momento (destacado)
- Estructura: label pequeño uppercase → número grande → barra

---

## Gráficos

- **Ingresos por mes:** AreaChart (recharts), línea y gradiente en color del momento
- **Turnos por estado:** PieChart donut (recharts), colores fijos en escala de grises azulados
- Grid `md:col-span-2` + `md:col-span-1`

---

## Ideas de contenido rotativas

- 24 ideas en banco, rotan 4 cada 6 horas
- Íconos Lucide unicolor (sin emojis)
- Header de la sección en color del momento
- Grid `2x2` con separadores sutiles
- Footer: "Rotan cada 6h · @franyelismorenoodonto"

---

## Navegación mobile

**Header:** logo `fm` + nombre + pill del tab activo  
**Bottom nav:** 6 tabs con ícono + label corto  
Pills de nav: scroll horizontal, no hay menú hamburguesa

---

## Archivos a crear / modificar

| Archivo | Acción |
|---|---|
| `client/src/pages/Dashboard.jsx` | Reescribir completo |
| `client/src/components/TabInicio.jsx` | Reescribir con hero dinámico |
| `client/src/components/TabMensajes.jsx` | Actualizar colores |
| `client/src/components/TabTurnos.jsx` | Actualizar colores |
| `client/src/components/TabCotizaciones.jsx` | Actualizar colores |
| `client/src/components/TabContactos.jsx` | Actualizar colores |
| `client/src/components/TabRecordatorios.jsx` | Actualizar colores |
| `client/src/components/TabConfiguracion.jsx` | Actualizar colores |
| `client/src/components/FmLogo.jsx` | Adaptar colores dinámicos |

---

## Lógica de color dinámico

```javascript
function usePaleta() {
  const h = new Date().getHours()
  if (h >= 6 && h < 13) return {
    saludo: 'Buenos días', emoji: '⛅',
    gradiente: 'linear-gradient(135deg, #6B7FC4 0%, #ADBCEA 100%)',
    primario: '#6B7FC4', chip: '#C8D5F5'
  }
  if (h >= 13 && h < 20) return {
    saludo: 'Buenas tardes', emoji: '☀️',
    gradiente: 'linear-gradient(135deg, #4A5A9C 0%, #7885C8 100%)',
    primario: '#4A5A9C', chip: '#C8D5F5'
  }
  return {
    saludo: 'Buenas noches', emoji: '🌙',
    gradiente: 'linear-gradient(135deg, #0B1D3A 0%, #1a3870 100%)',
    primario: '#0B1D3A', chip: '#C8D5F5'
  }
}
```

Este hook se usa en `Dashboard.jsx` y se pasa como prop o context a los componentes que necesiten el color activo (hero, pills activas, gráficos, header de ideas).

---

## Rama de git

`diseño-3` (nueva rama a crear antes de implementar)
