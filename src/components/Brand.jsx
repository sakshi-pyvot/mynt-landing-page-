import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { cn } from '@/lib/utils'

// Brand marks. Pyvot wordmark + V mark are inline SVG (crisp, themeable);
// the Mynt "m" mark is the raster in public/logos/mynt-mark.png.

const MINT = '#33BE86'

export function PyvotLogo({ className = 'h-6', mono = false, title = 'Pyvot' }) {
  const ink = mono ? 'currentColor' : '#fff'
  const accent = mono ? 'currentColor' : MINT
  return (
    <svg viewBox={VIEWBOX} className={cn('w-auto', className)} role="img" aria-label={title} fill="none">
      {['p', 'y', 'vRight', 'o', 't'].map((k) => (
        <path key={k} d={PATHS[k]} fill={ink} />
      ))}
      <path d={PATHS.vLeft} fill={accent} />
      <path d={PATHS.underline} fill={accent} />
    </svg>
  )
}

export function PyvotMark({ className = 'h-6' }) {
  return (
    <svg viewBox="0 0 51 44" className={cn('w-auto', className)} role="img" aria-label="Pyvot" fill="none">
      <path d="M28.27 43.986c-1.443 0-2.885-.055-4.323.014-1.526.074-2.306-1.19-1.801-2.432 3.263-8.063 6.487-16.139 9.721-24.211L38.227 1.49c.49-1.227.888-1.486 2.267-1.486h8.543c1.6 0 2.34.997 1.776 2.414L34.708 42.638c-.412 1.025-.908 1.343-2.06 1.343-1.458.005-2.916.005-4.378.005Z" fill="#fff" />
      <path d="M.01 2.187C-.01.748.427.258 1.86.064 2.135.028 2.42.023 2.7.023l8.543.014c1.448.005 2.1.43 2.635 1.707l8.116 19.43c.368.877.746 1.749 1.114 2.626.294.701.343 1.408.064 2.128-1.355 3.493-2.699 6.992-4.054 10.48-.47 1.214-.966 2.414-1.452 3.623-.039.092-.078.185-.127.272-.231.42-.388.933-1.04.91-.643-.028-1.021-.425-1.242-.937-.652-1.518-1.285-3.041-1.904-4.569C9.333 25.83 5.216 15.986 1.281 6.073.893 5.1.525 4.117.162 3.134.044 2.801-.03 2.46.01 2.187Z" fill={MINT} />
    </svg>
  )
}

export function MyntMark({ className = 'h-7', withWord = true, wordClass = 'text-xl' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src="/logos/mynt-mark.png" alt="Mynt" className={cn('w-auto', className)} width="128" height="128" />
      {withWord && (
        <span className={cn('font-bold tracking-tight text-ink', wordClass)}>
          mynt<span className="text-mint">.</span>
        </span>
      )}
    </span>
  )
}

// "Mynt by Pyvot" lockup — used in nav / footer / hero eyebrow / 404
export function Lockup({ className = '', size = 'md' }) {
  const s = size === 'sm' ? { m: 'h-5', w: 'text-base', p: 'h-4' } : { m: 'h-7', w: 'text-xl', p: 'h-5' }
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <MyntMark className={s.m} wordClass={s.w} />
      <span className="h-5 w-px bg-line" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-mute">by</span>
        <PyvotLogo className={s.p} />
      </span>
    </span>
  )
}
