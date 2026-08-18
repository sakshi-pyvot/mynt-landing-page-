import CtaPair from '@/components/CtaPair'
import { Lockup } from '@/components/Brand'
import { SmartLink } from '@/components/ui'

const LINKS = [
  ['Home', '/'],
  ['Mynt product overview', '/mynt'],
  ['Services', '/services'],
  ['Case studies', '/case-studies'],
  ['Contact', '/contact'],
]

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-24">
      <div className="mint-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <Lockup className="justify-center" />
        <div className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-mute">404 · no such page</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">This page isn't in the data.</h1>
        <p className="mt-4 text-mute">The link may be old, or the page moved. Here is where most people were heading.</p>
        <ul className="mt-8 flex flex-wrap justify-center gap-2" role="list">
          {LINKS.map(([l, to]) => (
            <li key={to}>
              <SmartLink to={to} className="inline-flex rounded-full border border-line px-4 py-2 text-sm text-mute hover:border-mint/60 hover:text-mint">
                {l}
              </SmartLink>
            </li>
          ))}
        </ul>
        <CtaPair className="mt-10 justify-center" />
      </div>
    </section>
  )
}
