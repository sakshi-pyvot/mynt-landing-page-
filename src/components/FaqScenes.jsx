import { motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

// Animated topic illustrations for the Help Centre FAQ frame — abstract, on-palette,
// no product screenshots. Each scene is a 320×180 SVG; motion is skipped under
// prefers-reduced-motion (the static composition still reads).

const MINT = '#2fd39a'
const INK = '#e9edf3'
const MUTE = '#8f99a8'
const LINE = '#2a3544'
const CARD = '#141924'
const CORAL = '#f0524e'
const AMBER = '#f5a623'

const loop = (duration, extra = {}) => ({ duration, repeat: Infinity, ease: 'easeInOut', ...extra })
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.18em', fontSize: 8, fill: MUTE }

function Svg({ children }) {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="fq-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={MINT} stopOpacity="0.28" />
          <stop offset="1" stopColor={MINT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="95" rx="150" ry="80" fill="url(#fq-glow)" />
      {children}
    </svg>
  )
}

// 1 · Gmail permissions — envelope, a read-only scan, a lock that never opens
export function GmailScene({ rm }) {
  return (
    <Svg>
      <rect x="95" y="40" width="130" height="84" rx="10" fill={CARD} stroke={LINE} />
      <path d="M95 50l65 44 65-44" fill="none" stroke={MINT} strokeWidth="1.5" strokeOpacity="0.8" />
      <path d="M95 124l48-40M225 124l-48-40" fill="none" stroke={LINE} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="118" y={86 + i * 9} width={80 - i * 22} height="3" rx="1.5" fill={LINE} />
      ))}
      <motion.rect
        x="95"
        width="130"
        height="18"
        fill={MINT}
        opacity="0.18"
        initial={{ y: 40 }}
        animate={rm ? undefined : { y: [40, 106, 40], opacity: [0, 0.22, 0] }}
        transition={loop(3.2)}
      />
      <motion.circle cx="222" cy="116" r="18" fill="none" stroke={MINT} animate={rm ? undefined : { r: [18, 34], opacity: [0.6, 0] }} transition={loop(2.4, { ease: 'easeOut' })} />
      <circle cx="222" cy="116" r="18" fill={MINT} />
      <rect x="214" y="114" width="16" height="12" rx="2" fill="#06251a" />
      <path d="M217 114v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#06251a" strokeWidth="2" />
    </Svg>
  )
}

// 2 · How often sync — an orbit that never stops, payout emails landing in the tray
export function SyncScene({ rm }) {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const t = (i / 24) * Math.PI * 2
    return [160 + 108 * Math.cos(t), 66 + 34 * Math.sin(t)]
  })
  return (
    <Svg>
      <ellipse cx="160" cy="66" rx="108" ry="34" fill="none" stroke={LINE} strokeDasharray="3 5" />
      <motion.circle r="5" fill={MINT} animate={rm ? { cx: pts[0][0], cy: pts[0][1] } : { cx: pts.map((p) => p[0]), cy: pts.map((p) => p[1]) }} transition={loop(6, { ease: 'linear' })} />
      <motion.circle r="12" fill={MINT} opacity="0.2" animate={rm ? { cx: pts[0][0], cy: pts[0][1] } : { cx: pts.map((p) => p[0]), cy: pts.map((p) => p[1]) }} transition={loop(6, { ease: 'linear' })} />
      <rect x="110" y="108" width="100" height="26" rx="6" fill={CARD} stroke={LINE} />
      <path d="M110 114h100" stroke={MINT} strokeOpacity="0.5" />
      {[0, 1, 2].map((i) => (
        <motion.g key={i} initial={{ y: 60, opacity: 0 }} animate={rm ? { y: 84 + i * 4, opacity: 1 } : { y: [50, 108, 108], opacity: [0, 1, 0] }} transition={loop(6, { ease: 'easeIn', delay: i * 2 })}>
          <rect x={138 + i * 14} y="0" width="30" height="20" rx="3" fill="#0f1419" stroke={MINT} strokeOpacity="0.7" />
          <path d={`M${138 + i * 14} 4l15 9 15-9`} fill="none" stroke={MINT} strokeOpacity="0.7" />
        </motion.g>
      ))}
    </Svg>
  )
}

// 3 · Recent data — the week filling in, the last days still on their way
export function CalendarScene({ rm }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <Svg>
      <text x="160" y="36" textAnchor="middle" style={mono}>THIS WEEK</text>
      {days.map((d, i) => {
        const x = 40 + i * 36
        const pending = i >= 5
        return (
          <g key={i}>
            <motion.rect
              x={x}
              y="50"
              width="28"
              height="52"
              rx="6"
              fill={pending ? 'transparent' : CARD}
              stroke={pending ? MUTE : LINE}
              strokeDasharray={pending ? '3 3' : undefined}
              animate={!rm && !pending ? { fill: [CARD, CARD, 'rgba(47,211,154,0.22)', 'rgba(47,211,154,0.22)'] } : undefined}
              transition={loop(7, { times: [0, 0.1 + i * 0.1, 0.16 + i * 0.1, 1], ease: 'linear' })}
            />
            <text x={x + 14} y="120" textAnchor="middle" style={{ ...mono, fill: pending ? MUTE : INK }}>{d}</text>
            {pending ? (
              <motion.circle cx={x + 14} cy="76" r="3" fill={MUTE} animate={rm ? undefined : { opacity: [0.2, 1, 0.2] }} transition={loop(1.6, { delay: i * 0.4 })} />
            ) : (
              <motion.path d={`M${x + 8} 77l4 4 8-8`} fill="none" stroke={MINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 1 }} animate={rm ? undefined : { pathLength: [0, 0, 1, 1], opacity: [0, 0, 1, 1] }} transition={loop(7, { times: [0, 0.1 + i * 0.1, 0.2 + i * 0.1, 1], ease: 'linear' })} />
            )}
          </g>
        )
      })}
      <motion.g animate={rm ? undefined : { y: [0, -3, 0] }} transition={loop(1.8)}>
        <path d="M234 40l-6-10h12z" fill={MINT} />
        <text x="234" y="24" textAnchor="middle" style={{ ...mono, fill: MINT }}>LAST UPDATED</text>
      </motion.g>
    </Svg>
  )
}

// 4 · Outlet mapping — two platform IDs, one shop
export function MappingScene({ rm }) {
  const pins = [
    { y: 44, c: CORAL, label: 'ZOMATO ID' },
    { y: 108, c: AMBER, label: 'SWIGGY ID' },
  ]
  return (
    <Svg>
      {pins.map((p, i) => (
        <g key={i}>
          <motion.path d={`M78 ${p.y} C 140 ${p.y}, 170 80, 226 80`} fill="none" stroke={p.c} strokeOpacity="0.55" strokeWidth="1.5" initial={{ pathLength: 1 }} animate={rm ? undefined : { pathLength: [0, 1, 1] }} transition={loop(3.6, { times: [0, 0.5, 1], delay: i * 0.5, ease: 'easeInOut' })} />
          <motion.circle r="3.5" fill={p.c} animate={rm ? { cx: 78, cy: p.y } : { cx: [78, 120, 170, 226], cy: [p.y, p.y + (80 - p.y) * 0.25, p.y + (80 - p.y) * 0.8, 80] }} transition={loop(3.6, { delay: i * 0.5, ease: 'easeInOut' })} />
          <circle cx="60" cy={p.y} r="14" fill={CARD} stroke={p.c} />
          <circle cx="60" cy={p.y} r="4" fill={p.c} />
          <text x="60" y={p.y + 28} textAnchor="middle" style={mono}>{p.label}</text>
        </g>
      ))}
      <motion.circle cx="250" cy="80" r="30" fill="none" stroke={MINT} animate={rm ? undefined : { r: [30, 44], opacity: [0.5, 0] }} transition={loop(2.8, { ease: 'easeOut' })} />
      <circle cx="250" cy="80" r="30" fill={CARD} stroke={MINT} />
      <path d="M236 86v-12l14-8 14 8v12z" fill="none" stroke={MINT} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="246" y="78" width="8" height="8" fill={MINT} />
      <text x="250" y="124" textAnchor="middle" style={{ ...mono, fill: MINT }}>YOUR OUTLET</text>
    </Svg>
  )
}

// 5 · Tokens — a stack that breathes, the top coin catches the light
export function TokensScene({ rm }) {
  return (
    <Svg>
      {[0, 1, 2, 3].map((i) => (
        <motion.g key={i} animate={rm ? undefined : { y: [0, -3 - i, 0] }} transition={loop(2.6, { delay: i * 0.12 })}>
          <ellipse cx="160" cy={110 - i * 11} rx="44" ry="13" fill={CARD} stroke={MINT} strokeOpacity="0.7" />
          <rect x="116" y={99 - i * 11} width="88" height="11" fill={CARD} />
          <path d={`M116 ${99 - i * 11}v11`} stroke={MINT} strokeOpacity="0.7" />
          <path d={`M204 ${99 - i * 11}v11`} stroke={MINT} strokeOpacity="0.7" />
          <ellipse cx="160" cy={99 - i * 11} rx="44" ry="13" fill={i === 3 ? MINT : CARD} stroke={MINT} strokeOpacity="0.9" />
        </motion.g>
      ))}
      <motion.g animate={rm ? undefined : { y: [0, -6, 0] }} transition={loop(2.6, { delay: 0.36 })}>
        <text x="160" y="70" textAnchor="middle" style={{ ...mono, fontSize: 10, fill: '#06251a', letterSpacing: '0.1em', fontWeight: 700 }}>MYNT</text>
        <motion.ellipse cx="160" cy="66" rx="44" ry="13" fill="#fff" opacity="0" animate={rm ? undefined : { opacity: [0, 0.35, 0] }} transition={loop(2.6, { delay: 0.6 })} />
      </motion.g>
    </Svg>
  )
}

// 6 · What consumes tokens — coins travelling to the three features
export function SpendScene({ rm }) {
  const tracks = [
    { y: 40, label: 'AI ASSISTANT' },
    { y: 80, label: 'REPORTS' },
    { y: 120, label: 'NOTIFICATIONS' },
  ]
  return (
    <Svg>
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx="52" cy={94 - i * 9} rx="24" ry="8" fill={i === 2 ? MINT : CARD} stroke={MINT} strokeOpacity="0.8" />
      ))}
      {tracks.map((t, i) => (
        <g key={i}>
          <path d={`M78 82 C 130 82, 130 ${t.y}, 200 ${t.y}`} fill="none" stroke={LINE} strokeWidth="1.5" />
          <motion.circle r="4" fill={MINT} animate={rm ? { cx: 78, cy: 82 } : { cx: [78, 130, 200], cy: [82, (82 + t.y) / 2, t.y], opacity: [0, 1, 0] }} transition={loop(2.4, { delay: i * 0.8, ease: 'easeInOut' })} />
          <motion.rect x="200" y={t.y - 12} width="92" height="24" rx="12" fill={CARD} stroke={MINT} strokeOpacity="0.5" animate={rm ? undefined : { strokeOpacity: [0.4, 1, 0.4], fill: [CARD, 'rgba(47,211,154,0.2)', CARD] }} transition={loop(2.4, { delay: i * 0.8 + 1.0, times: [0.4, 0.55, 1] })} />
          <text x="246" y={t.y + 3} textAnchor="middle" style={{ ...mono, fill: INK }}>{t.label}</text>
        </g>
      ))}
      <text x="52" y="120" textAnchor="middle" style={mono}>BALANCE</text>
    </Svg>
  )
}

// 7 · Licences — a year ring filling around one outlet's licence
export function LicenceScene({ rm }) {
  const R = 46
  const segs = Array.from({ length: 12 }, (_, i) => {
    const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 0.82) / 12) * Math.PI * 2 - Math.PI / 2
    return `M${100 + R * Math.cos(a0)} ${82 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${100 + R * Math.cos(a1)} ${82 + R * Math.sin(a1)}`
  })
  return (
    <Svg>
      {segs.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={LINE} strokeWidth="6" strokeLinecap="round" />
          <motion.path d={d} fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round" initial={{ opacity: 1 }} animate={rm ? undefined : { opacity: [0, 0, 1, 1, 0] }} transition={loop(8, { times: [0, i / 12 * 0.7, i / 12 * 0.7 + 0.04, 0.92, 1], ease: 'linear' })} />
        </g>
      ))}
      <text x="100" y="78" textAnchor="middle" style={{ ...mono, fontSize: 16, fill: INK, letterSpacing: '0.04em', fontWeight: 700 }}>12</text>
      <text x="100" y="94" textAnchor="middle" style={mono}>MONTHS</text>
      <rect x="182" y="50" width="112" height="66" rx="8" fill={CARD} stroke={LINE} />
      <rect x="192" y="60" width="40" height="5" rx="2.5" fill={MINT} />
      <rect x="192" y="72" width="80" height="4" rx="2" fill={LINE} />
      <rect x="192" y="82" width="64" height="4" rx="2" fill={LINE} />
      <rect x="192" y="96" width="52" height="12" rx="6" fill="rgba(47,211,154,0.18)" stroke={MINT} strokeOpacity="0.6" />
      <text x="218" y="104.5" textAnchor="middle" style={{ ...mono, fill: MINT, fontSize: 7 }}>1 OUTLET</text>
      <motion.circle cx="282" cy="62" r="5" fill={MINT} animate={rm ? undefined : { opacity: [0.4, 1, 0.4] }} transition={loop(1.6)} />
    </Svg>
  )
}

// article id → scene; anything unmapped falls back to the sync orbit
const SCENES = {
  '02-gmail-permissions': GmailScene,
  '05-how-often-sync': SyncScene,
  '01-why-todays-recent-data-not-showing': CalendarScene,
  '01-what-is-outlet-mapping-and-why-required': MappingScene,
  '01-what-are-mynt-tokens': TokensScene,
  '02-which-mynt-features-consume-tokens': SpendScene,
  '01-understanding-mynt-pricing-annual-outlet-licences': LicenceScene,
}

export default function FaqScene({ id }) {
  const Scene = SCENES[id] || SyncScene
  return <Scene rm={reducedMotion()} />
}
