/**
 * Hero artwork: an engineering drawing of a piston and connecting-rod
 * assembly that "draws itself" on load (respecting reduced-motion), with
 * dimension call-outs in the brand's mono type.
 */
const BONE = "rgba(242,240,235,0.88)";
const DIM = "rgba(242,240,235,0.38)";
const CENTER = "rgba(242,240,235,0.22)";
const EMBER = "#ff5b1a";

function Draw({ d, delay = 0, width = 1.4, color = BONE, dash }: { d: string; delay?: number; width?: number; color?: string; dash?: string }) {
  return (
    <path
      d={d}
      pathLength={1}
      className={dash ? undefined : "draw-path"}
      style={dash ? undefined : { animationDelay: `${delay}s` }}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Label({ x, y, children, anchor = "start", color = DIM }: { x: number; y: number; children: React.ReactNode; anchor?: "start" | "middle" | "end"; color?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontFamily="Arial, Tahoma, sans-serif" fontSize="11">
      {children}
    </text>
  );
}

export function HeroIllustration({ className }: { className?: string }) {
  const cx = 300;
  return (
    <svg viewBox="0 0 600 640" className={className} role="img" aria-label="نقشه فنی مجموعه پیستون و شاتون">
      <defs>
        <marker id="hero-arrow" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0.6L6 3L0 5.4z" fill={DIM} />
        </marker>
        <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5b1a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ff5b1a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* centre lines */}
      <Draw d={`M${cx} 18 V622`} color={CENTER} width={1} dash="14 5 3 5" />
      <Draw d="M90 300 H510" color={CENTER} width={1} dash="14 5 3 5" />
      <Draw d="M150 520 H450" color={CENTER} width={1} dash="14 5 3 5" />

      {/* piston crown & body */}
      <path d={`M${cx - 120} 96 q0 -18 18 -22 q102 -22 204 0 q18 4 18 22 v168 q0 10 -14 14 l-10 52 h-192 l-10 -52 q-14 -4 -14 -14 Z`} fill="url(#hero-fade)" />
      <Draw d={`M${cx - 120} 96 q0 -18 18 -22 q102 -22 204 0 q18 4 18 22 v168 q0 10 -14 14 l-10 52 h-192 l-10 -52 q-14 -4 -14 -14 Z`} width={1.8} />
      <Draw d={`M${cx - 76} 86 q76 20 152 0`} delay={0.2} width={1} />
      <Draw d={`M${cx - 120} 122 H${cx + 120}`} delay={0.35} width={2.4} color={EMBER} />
      <Draw d={`M${cx - 120} 146 H${cx + 120}`} delay={0.45} />
      <Draw d={`M${cx - 120} 170 H${cx + 120}`} delay={0.55} />
      <Draw d={`M${cx - 120} 178 H${cx + 120}`} delay={0.6} width={0.8} />

      {/* gudgeon pin */}
      <Draw d={`M${cx - 38} 236 a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0`} delay={0.5} width={1.6} />
      <Draw d={`M${cx - 24} 236 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0`} delay={0.7} width={1} />
      <Draw d={`M${cx - 106} 210 q18 52 0 104 M${cx + 106} 210 q-18 52 0 104`} delay={0.8} width={0.8} color={DIM} />

      {/* connecting rod */}
      <Draw d={`M${cx - 30} 268 L${cx - 46} 452 M${cx + 30} 268 L${cx + 46} 452`} delay={0.9} width={1.8} />
      <Draw d={`M${cx - 12} 290 L${cx - 20} 446 M${cx + 12} 290 L${cx + 20} 446`} delay={1.1} width={0.8} color={DIM} />
      <Draw d={`M${cx - 92} 470 q0 -26 46 -18 h92 q46 -8 46 18 v42 q0 70 -92 76 q-92 -6 -92 -76 Z`} delay={1.1} width={1.8} />
      <Draw d={`M${cx - 52} 520 a52 52 0 1 0 104 0 a52 52 0 1 0 -104 0`} delay={1.3} width={1.6} />
      <Draw d={`M${cx - 42} 520 a42 42 0 1 0 84 0 a42 42 0 1 0 -84 0`} delay={1.45} width={2.2} color={EMBER} />
      <Draw d={`M${cx - 100} 492 H${cx - 82} M${cx + 82} 492 H${cx + 100}`} delay={1.5} width={1.2} />
      <circle cx={cx - 70} cy="486" r="5" stroke={BONE} strokeWidth="1.2" fill="none" />
      <circle cx={cx + 70} cy="486" r="5" stroke={BONE} strokeWidth="1.2" fill="none" />

      {/* dimensions */}
      <g stroke={DIM} strokeWidth="0.8" fill="none">
        <path d={`M${cx - 120} 60 V40 M${cx + 120} 60 V40`} />
        <path d={`M${cx - 116} 46 H${cx + 116}`} markerStart="url(#hero-arrow)" markerEnd="url(#hero-arrow)" />
        <path d={`M${cx + 140} 74 H${cx + 176} M${cx + 140} 236 H${cx + 176}`} />
        <path d={`M${cx + 166} 78 V232`} markerStart="url(#hero-arrow)" markerEnd="url(#hero-arrow)" />
        <path d={`M${cx - 52} 600 V612 M${cx + 52} 600 V612`} />
        <path d={`M${cx - 48} 607 H${cx + 48}`} markerStart="url(#hero-arrow)" markerEnd="url(#hero-arrow)" />
      </g>
      <Label x={cx} y={36} anchor="middle">Ø 83.00</Label>
      <g transform={`translate(${cx + 186} 160) rotate(90)`}>
        <Label x={0} y={0} anchor="middle">37.65</Label>
      </g>
      <Label x={cx} y={630} anchor="middle">Ø 53.00</Label>

      {/* callouts */}
      <g stroke={DIM} strokeWidth="0.8">
        <path d={`M${cx - 120} 122 L${cx - 176} 122 L${cx - 196} 104`} fill="none" />
        <path d={`M${cx - 30} 236 L${cx - 180} 300`} fill="none" />
        <path d={`M${cx + 42} 520 L${cx + 170} 560`} fill="none" />
      </g>
      <circle cx={cx - 120} cy="122" r="3" fill={EMBER} />
      <circle cx={cx - 30} cy="236" r="3" fill={EMBER} />
      <circle cx={cx + 42} cy="520" r="3" fill={EMBER} />
      <Label x={cx - 198} y={98} anchor="end" color={BONE}>A · رینگ کمپرسی</Label>
      <Label x={cx - 198} y={114} anchor="end">CKS 1.75 mm</Label>
      <Label x={cx - 184} y={304} anchor="end" color={BONE}>B · گژن‌پین Ø22</Label>
      <Label x={cx - 184} y={320} anchor="end">پوشش DLC</Label>
      <Label x={cx + 174} y={566} color={BONE}>C · سر بزرگ شاتون</Label>
      <Label x={cx + 174} y={582}>یاتاقان سه‌لایه</Label>
    </svg>
  );
}
