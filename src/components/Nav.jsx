import { useState } from 'react'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CtaPair from './CtaPair'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#data', label: 'Data' },
  { href: '#product', label: 'Product' },
  { href: '#ai', label: 'Mynt AI' },
  { href: '#voices', label: 'Clients' },
  { href: '#experts', label: 'Experts' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useGSAP(() => {
    ScrollTrigger.create({
      start: 50,
      end: 'max',
      onToggle: (self) => setScrolled(self.isActive),
    })
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'glass border-b border-line/60' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-ink">
            mynt<span className="text-mint">.</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-mute">
            by Pyvot
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-mute transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <CtaPair size="sm" className="hidden sm:flex" />
        <a
          href="#cta"
          className="inline-flex h-10 items-center rounded-full bg-mint px-4 text-sm font-semibold text-[#06251a] sm:hidden"
        >
          Get started
        </a>
      </nav>
    </header>
  )
}
