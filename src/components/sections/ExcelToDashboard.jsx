import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// KPI cards: fly from spreadsheet scatter → dashboard slots, restyling mid-flight.
const CARDS = [
  { label: 'Gross Order Value', target: 1386756, prefix: '₹', delta: '↗ +2.0%', tone: 'text-mint', cell: 'B2', raw: 'gov_total' },
  { label: 'Total Orders', target: 3051, prefix: '', delta: '↗ +2.9%', tone: 'text-mint', cell: 'C7', raw: 'orders_cnt' },
  { label: 'Net Payout', target: 676171, prefix: '₹', delta: '↗ +3.2%', tone: 'text-mint', cell: 'F14', raw: 'net_payout' },
  { label: 'Ad Spend', target: 92574, prefix: '₹', delta: '↘ -8.5%', tone: 'text-coral', cell: 'D22', raw: 'ads_spend' },
  { label: 'Discounts', target: 307111, prefix: '₹', delta: '↘ +4.5%', tone: 'text-coral', cell: 'E9', raw: 'disc_total' },
  { label: 'Net Margin', target: 48.8, prefix: '', suffix: '%', decimals: 1, delta: '↗ +1.2%', tone: 'text-mint', cell: 'H3', raw: 'net_margin' },
]

// scatter offsets relative to each card's dashboard slot (desktop only)
const SCATTER = [
  { x: -520, y: -160, r: -12 },
  { x: 430, y: -230, r: 9 },
  { x: -390, y: 220, r: 7 },
  { x: 530, y: 130, r: -8 },
  { x: -150, y: -330, r: 5 },
  { x: 270, y: 300, r: -10 },
]

const PILLS = [
  { text: 'Zomato', tone: 'text-coral border-coral/40', pos: 'left-[8%] top-[22%]' },
  { text: 'Swiggy', tone: 'text-amber border-amber/40', pos: 'right-[10%] top-[30%]' },
  { text: 'Payout PDFs', tone: 'text-mute border-line', pos: 'left-[14%] bottom-[24%]' },
  { text: 'Email reports', tone: 'text-mute border-line', pos: 'right-[16%] bottom-[16%]' },
]

const BAR_HEIGHTS = [38, 30, 52, 20, 26, 34, 30, 44, 60, 190, 88, 44, 40, 36, 42, 55, 48, 40, 46, 52, 44, 40, 48, 58]

const LINE_PATH =
  'M 8 168 C 40 160, 60 150, 88 152 C 120 156, 140 172, 168 170 C 200 168, 220 150, 244 118 ' +
  'C 258 84, 262 30, 272 28 C 282 30, 292 120, 316 150 C 340 168, 380 158, 412 152 ' +
  'C 444 148, 470 160, 500 150 C 530 142, 560 150, 590 144 C 610 140, 622 146, 632 142'

const fmtVal = (v, spec) => {
  const n = spec.decimals ? Number(v.toFixed(spec.decimals)) : Math.round(v)
  return `${spec.prefix}${n.toLocaleString('en-IN', {
    minimumFractionDigits: spec.decimals || 0,
    maximumFractionDigits: spec.decimals || 0,
  })}${spec.suffix || ''}`
}

export default function ExcelToDashboard() {
  const root = useRef(null)

  useGSAP(
    () => {
      gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=3200',
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
          defaults: { ease: 'power2.inOut' },
        })

        // beat 1 → 2: dashboard chrome arrives, copy swaps
        tl.fromTo('.dash-chrome', { opacity: 0, y: 46, scale: 0.965 }, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 1)
          .to('.copy-1', { opacity: 0, y: -18, duration: 0.4 }, 1)
          .fromTo('.copy-2', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, 1.25)

        // beat 2: cards fly from scatter into their slots, restyling mid-flight
        tl.fromTo(
          '.fly-card',
          {
            x: (i) => SCATTER[i].x,
            y: (i) => SCATTER[i].y,
            rotation: (i) => SCATTER[i].r,
            scale: 0.94,
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.2,
            stagger: { each: 0.12 },
            ease: 'power2.inOut',
          },
          1.6,
        )
          .fromTo(
            '.raw-face',
            { opacity: 1 },
            { opacity: 0, duration: 0.3, stagger: { each: 0.12 } },
            2.15,
          )
          .fromTo(
            '.clean-face',
            { opacity: 0 },
            { opacity: 1, duration: 0.3, stagger: { each: 0.12 } },
            2.15,
          )

        // beat 2 → 3: sheet dies, dashboard wakes
        tl.to('.sheet', { opacity: 0.05, duration: 0.7 }, 3.4)
          .to('.sheet-pill', { opacity: 0, y: -14, duration: 0.4, stagger: 0.05 }, 3.3)
          .to('.dash-bg', { boxShadow: '0 0 80px rgba(47,211,154,0.18)', borderColor: 'rgba(47,211,154,0.5)', duration: 0.6 }, 3.6)

        // count-ups
        gsap.utils.toArray('.count-val').forEach((el, i) => {
          const spec = CARDS[i]
          const o = { v: 0 }
          const apply = () => {
            el.textContent = fmtVal(o.v, spec)
          }
          tl.to(o, { v: 0.0001, duration: 0.01, onUpdate: apply }, 0.02)
          tl.to(o, { v: spec.target, duration: 0.8, ease: 'power1.out', onUpdate: apply }, 3.9)
        })
        tl.fromTo('.clean-delta', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.05 }, 4.4)

        // chart wakes: line draws, bars grow, live badge pulses
        tl.fromTo('.sales-line', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut' }, 4.5)
          .fromTo('.spend-bar', { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.025, transformOrigin: '50% 100%' }, 4.6)
          .fromTo('.chart-grid', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 4.5)
          .fromTo('.live-badge', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 5.2)
      })
    },
    { scope: root },
  )

  return (
    <section id="data" ref={root} className="relative overflow-hidden">
      <div className="relative flex h-screen min-h-[720px] flex-col items-center justify-center">
        {/* spreadsheet world (desktop scroll story only) */}
        <div className="sheet excel-grid absolute inset-0 hidden [transform:perspective(1200px)_rotateX(4deg)_scale(1.04)] md:block" />
        {PILLS.map((p) => (
          <div
            key={p.text}
            className={`sheet-pill absolute ${p.pos} hidden rounded-full border ${p.tone} glass px-4 py-1.5 font-mono text-xs md:block`}
          >
            {p.text}
          </div>
        ))}

        {/* copy */}
        <div className="relative z-20 mb-8 h-16 w-full px-6 text-center">
          <h2 className="copy-1 absolute inset-x-0 hidden text-2xl font-bold tracking-tight md:block md:text-4xl">
            Your data lives in spreadsheets.
          </h2>
          <h2 className="copy-2 inset-x-0 text-2xl font-bold tracking-tight md:absolute md:opacity-0 md:text-4xl">
            Mynt puts every number <span className="text-mint">where it belongs.</span>
          </h2>
        </div>

        {/* dashboard */}
        <div className="relative z-10 w-full max-w-4xl px-4">
          <div className="dash-frame relative rounded-2xl p-4 md:p-5">
            {/* frame chrome (border/bg) arrives with the rest of the chrome */}
            <div className="dash-bg dash-chrome absolute inset-0 rounded-2xl border border-line bg-surface/80 backdrop-blur-sm" />
            <div className="dash-chrome relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    mynt<span className="text-mint">.</span>
                  </span>
                  <span className="text-xs text-mute">Command Centre</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="live-badge flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-mint">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> Live
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 text-[10px] text-mute">
                    May 1 – May 31
                  </span>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
              {CARDS.map((c) => (
                <div key={c.label} className="relative h-[92px]">
                  {/* slot outline (part of chrome) */}
                  <div className="dash-chrome absolute inset-0 rounded-xl border border-dashed border-line/60" />
                  {/* flying card */}
                  <div className="fly-card absolute inset-0">
                    {/* spreadsheet face */}
                    <div className="raw-face absolute inset-0 hidden rotate-0 rounded-sm border border-[#b9c0cc] bg-[#eef1f6] p-2.5 font-mono text-[#3a4354] opacity-0 shadow-lg md:block">
                      <div className="text-[9px] text-[#8892a2]">{c.cell}</div>
                      <div className="mt-0.5 truncate text-[11px]">{c.raw}</div>
                      <div className="text-sm font-bold">{c.target}</div>
                    </div>
                    {/* mynt face */}
                    <div className="clean-face absolute inset-0 rounded-xl border border-line bg-card p-3">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-mute">
                        {c.label}
                      </div>
                      <div className="count-val mt-1 text-lg font-bold text-ink md:text-xl">
                        {fmtVal(c.target, c)}
                      </div>
                      <div className={`clean-delta text-[11px] font-medium ${c.tone}`}>{c.delta}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* chart panel */}
            <div className="dash-chrome relative mt-3 rounded-xl border border-line bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Ad Spend vs Sales</span>
                <div className="flex items-center gap-3 text-[10px] text-mute">
                  <span className="flex items-center gap-1">
                    <span className="h-0.5 w-4 rounded bg-mint" /> Sales
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-[2px] bg-grape" /> Ad Spend
                  </span>
                </div>
              </div>
              <svg viewBox="0 0 640 220" className="h-28 w-full md:h-36" preserveAspectRatio="none">
                <g className="chart-grid" stroke="rgba(143,153,168,0.15)" strokeDasharray="3 5">
                  <line x1="0" y1="55" x2="640" y2="55" />
                  <line x1="0" y1="110" x2="640" y2="110" />
                  <line x1="0" y1="165" x2="640" y2="165" />
                </g>
                {BAR_HEIGHTS.map((h, i) => (
                  <rect
                    key={i}
                    className="spend-bar"
                    x={10 + i * 26}
                    y={205 - h * 0.55}
                    width="9"
                    height={h * 0.55}
                    rx="2"
                    fill="#a78bfa"
                    opacity="0.75"
                  />
                ))}
                <path
                  className="sales-line"
                  d={LINE_PATH}
                  pathLength="1"
                  strokeDasharray="1"
                  fill="none"
                  stroke="#2fd39a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
