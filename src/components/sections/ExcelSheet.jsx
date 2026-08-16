import { useEffect, useRef } from 'react'
import { reducedMotion } from '@/lib/utils'

// Full-bleed fake spreadsheet. Numbers tick live via direct DOM writes (no
// React re-render); changed cells flash mint (up) / coral (down).
const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']
const ROWS = 40
const HEADERS = ['outlet_id', 'platform', 'gov', 'orders', 'ads', 'charges', 'disc', 'refund', 'payout', 'margin', 'aov', 'cancel', 'net', 'delta']

// deterministic pseudo-random so SSR/hydration and re-renders agree
const seed = (i) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const cellText = (r, c) => {
  if (r === 0) return HEADERS[c] ?? ''
  const s = seed(r * 31 + c * 7)
  switch (c) {
    case 0: return `OUT-${String(100 + r).padStart(3, '0')}`
    case 1: return s > 0.5 ? 'zomato' : 'swiggy'
    case 9: return `${(30 + s * 40).toFixed(1)}%`
    case 11: return `${(s * 3).toFixed(1)}%`
    case 13: return `${s > 0.5 ? '+' : '-'}${(s * 20).toFixed(1)}%`
    default: return String(Math.round(s * 900000 + 1000))
  }
}

export default function ExcelSheet({ highlight = [] }) {
  const gridRef = useRef(null)

  useEffect(() => {
    if (reducedMotion()) return undefined
    const grid = gridRef.current
    // only numeric body cells tick
    const numeric = Array.from(grid.querySelectorAll('[data-num="1"]'))
    const timers = new Set()
    const id = setInterval(() => {
      for (let k = 0; k < 10; k++) {
        const el = numeric[(Math.random() * numeric.length) | 0]
        const cur = parseInt(el.textContent.replace(/[^\d]/g, ''), 10) || 1000
        const up = Math.random() > 0.45
        const next = Math.max(1000, Math.round(cur * (up ? 1 + Math.random() * 0.08 : 1 - Math.random() * 0.08)))
        el.textContent = String(next)
        el.style.color = up ? '#1f9d6d' : '#d13b37'
        el.style.fontWeight = '600'
        const t = setTimeout(() => {
          el.style.color = ''
          el.style.fontWeight = ''
          timers.delete(t)
        }, 650)
        timers.add(t)
      }
    }, 140)
    return () => {
      clearInterval(id)
      timers.forEach(clearTimeout)
    }
  }, [])

  const hl = new Set(highlight)

  return (
    <div
      ref={gridRef}
      className="pointer-events-none select-none bg-[#f6f7f9] font-mono text-[11px] leading-none text-[#3a4354]"
      style={{
        display: 'grid',
        gridTemplateColumns: `36px repeat(${COLS.length}, 118px)`,
        gridAutoRows: '26px',
        width: 'max-content',
      }}
    >
      {/* column header row */}
      <div className="sticky top-0 border-b border-r border-[#c9ced8] bg-[#e7eaf0]" />
      {COLS.map((c) => (
        <div
          key={c}
          className="flex items-center justify-center border-b border-r border-[#c9ced8] bg-[#e7eaf0] font-semibold text-[#5b6472]"
        >
          {c}
        </div>
      ))}
      {Array.from({ length: ROWS }, (_, r) => (
        <RowCells key={r} r={r} hl={hl} />
      ))}
    </div>
  )
}

function RowCells({ r, hl }) {
  return (
    <>
      <div className="flex items-center justify-center border-b border-r border-[#c9ced8] bg-[#e7eaf0] font-semibold text-[#5b6472]">
        {r + 1}
      </div>
      {COLS.map((c, ci) => {
        const key = `${c}${r + 1}`
        const isHeader = r === 0
        const isNum = !isHeader && ci >= 2 && ![9, 11, 13].includes(ci)
        return (
          <div
            key={key}
            data-num={isNum ? '1' : undefined}
            className={
              'flex items-center border-b border-r border-[#dfe3ea] px-2 ' +
              (isHeader ? 'bg-[#eef1f6] font-semibold text-[#2b3341]' : '') +
              (ci >= 2 && !isHeader ? ' justify-end tabular-nums' : '') +
              (hl.has(key) ? ' outline outline-2 -outline-offset-2 outline-[#2fd39a] bg-[#e6faf2]' : '')
            }
          >
            {cellText(r, ci)}
          </div>
        )
      })}
    </>
  )
}
