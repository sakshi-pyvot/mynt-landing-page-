export default function Footer() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-12 md:flex-row md:items-center">
        <div>
          <div className="text-lg font-bold">
            mynt<span className="text-mint">.</span>{' '}
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-mute">
              by Pyvot
            </span>
          </div>
          <p className="mt-2 max-w-xs text-xs text-mute">
            Restaurant intelligence — marketplace, payout, ad and outlet data turned
            into decisions.
          </p>
        </div>

        <div className="flex gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mute">
              Pyvot
            </span>
            <a href="https://pyvot.in/about-us/" target="_blank" rel="noreferrer" className="text-mute hover:text-ink">About</a>
            <a href="https://pyvot.in/services/" target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Services</a>
            <a href="https://pyvot.in/case-studies/" target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Case Studies</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mute">
              Contact
            </span>
            <a href="https://pyvot.in/contact-us/" target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Book a demo</a>
            <a href="https://pyvot.in/career/" target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Careers</a>
            <a href="https://pyvot.in/privacy-policy/" target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Privacy</a>
          </div>
        </div>
      </div>
      <div className="border-t border-line/40 py-5 text-center text-xs text-mute">
        © 2026 Pyvot Consultancy & Analytics Pvt. Ltd. All rights reserved.
      </div>
    </footer>
  )
}
