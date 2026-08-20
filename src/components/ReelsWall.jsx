import { cn } from '@/lib/utils'
import VideoLoop from './VideoLoop'

// Row of looping video cards (reels, motion graphics). Scrolls horizontally on
// mobile, grid on desktop. items: [{ src, poster, href, title, aspect }]
const COLS = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }

export default function ReelsWall({ items, className, aspect = 'aspect-[9/16]' }) {
  return (
    <div className={cn('flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:snap-none md:overflow-visible', COLS[Math.min(items.length, 4)], className)}>
      {items.map((it) => {
        const card = (
          <div className="lq-card relative overflow-hidden rounded-2xl border border-white/10">
            <VideoLoop src={it.src} poster={it.poster} label={it.title} className={cn(it.aspect || aspect)} />
            {it.title && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent p-3 pt-8">
                <span className="text-xs font-medium text-ink/90">{it.title}</span>
              </div>
            )}
          </div>
        )
        return it.href ? (
          <a key={it.src} href={it.href} target="_blank" rel="noreferrer" className="w-56 shrink-0 snap-start transition-transform hover:-translate-y-1 md:w-auto">
            {card}
          </a>
        ) : (
          <div key={it.src} className="w-56 shrink-0 snap-start md:w-auto">
            {card}
          </div>
        )
      })}
    </div>
  )
}
