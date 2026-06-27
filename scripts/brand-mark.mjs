// Shared Mindscape brand artwork for the build-time asset generators (app icons + iOS
// launch screens). Kept in sync with the animated React mark at
// src/widgets/palace-threshold/ui/PalaceThreshold.tsx — that component owns the on-screen
// mark, these scripts own the static raster/vector assets. One definition here so the icon
// and splash generators can never drift apart.

export const BRAND = {
  navyLight: '#1B36B0', // lifted navy — top-left of the icon ground
  navy: '#091A7A', // identity anchor (--p-navy-900)
  navyDeep: '#05103F', // deepened navy — bottom-right of the icon ground
  action: '#4F8EFF', // action-blue (--p-blue-500)
  sky: '#ADC8FF', // light-blue lines / atmosphere (--p-blue-300)
  white: '#FFFFFF',
}

/** The temple-threshold mark as an SVG fragment to drop inside a `viewBox="0 0 200 200"`.
 *  The locus (the igniting point of recall) is drawn last so callers can pair it with a
 *  glow. `simplified` drops the thin lower step that disappears at favicon sizes. */
export function markGroup({
  stroke,
  strokeWidth,
  locusFill = BRAND.white,
  locusR = 7,
  simplified = false,
} = {}) {
  const steps = simplified
    ? '<line x1="40" y1="166" x2="160" y2="166"/>'
    : '<line x1="40" y1="166" x2="160" y2="166"/><line x1="28" y1="178" x2="172" y2="178"/>'
  return `<g fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 64 L100 24 L160 64"/>
      <line x1="46" y1="64" x2="154" y2="64"/>
      <line x1="64" y1="64" x2="64" y2="166"/>
      <line x1="136" y1="64" x2="136" y2="166"/>
      <path d="M86 166 L86 126 A14 14 0 0 1 114 126 L114 166"/>
      ${steps}
    </g>
    <circle cx="100" cy="138" r="${locusR}" fill="${locusFill}"/>`
}
