export default function FmLogo({ size = 48, color = '#c9994a', className = '' }) {
  const r = size * 0.48
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-label="Logo FM">
      {/* Círculo exterior */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.82}
        fill="none" stroke={color} strokeWidth={size * 0.018} />

      {/* Letras "fm" en fuente elegante */}
      <text
        x={cx - size * 0.04}
        y={cy + size * 0.1}
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize={size * 0.38}
        fill={color}
        letterSpacing="-1"
      >
        fm
      </text>

      {/* Pequeña muela decorativa */}
      <text
        x={cx + size * 0.34}
        y={cy - size * 0.06}
        textAnchor="middle"
        fontSize={size * 0.15}
        fill={color}
      >
        🦷
      </text>
    </svg>
  )
}
