import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ScrollProvider, RouteScroll } from '@/lib/scroll'
import CustomCursor from '@/components/CustomCursor'
import PyvotLoader from '@/components/PyvotLoader'
import { markLoaded } from '@/lib/loaded'
import ProgressBar from '@/components/ProgressBar'
import Nav from '@/components/Nav'
import Footer from '@/components/sections/Footer'
import Landing from '@/pages/Landing'

const Mynt = lazy(() => import('@/pages/Mynt'))
const Guides = lazy(() => import('@/pages/Guides'))
const Services = lazy(() => import('@/pages/Services'))
const About = lazy(() => import('@/pages/About'))
const Join = lazy(() => import('@/pages/Join'))
const CaseStudies = lazy(() => import('@/pages/CaseStudies'))
const Contact = lazy(() => import('@/pages/Contact'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const TITLES = {
  '/': 'Mynt — Restaurant Intelligence by Pyvot',
  '/mynt': 'Mynt — Product Overview & Trust',
  '/mynt/guides': 'Mynt Guides / Help Centre',
  '/services': 'Services — Pyvot Experts',
  '/about': 'About Pyvot',
  '/join': 'Join Pyvot',
  '/case-studies': 'Case Studies — Pyvot',
  '/contact': 'Contact — Mynt by Pyvot',
}

function Layout({ loading, onLoaded }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!loading) markLoaded()
  }, [loading])

  useEffect(() => {
    document.title = TITLES[pathname] || 'Mynt by Pyvot'
  }, [pathname])

  return (
    <div id="top">
      {/* shared displacement filter for .lq-pill liquid-glass lenses */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="lq-lens" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.02" numOctaves="2" seed="11" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.4" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {loading && <PyvotLoader onDone={onLoaded} />}
      <CustomCursor />
      <ProgressBar />
      <Nav />
      <main>
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/mynt" element={<Mynt />} />
            <Route path="/mynt/guides" element={<Guides />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/join" element={<Join />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {/* after <main> so its layout effect runs AFTER page pin effects —
          the pre-paint hash snap then sees post-pin offsets */}
      <RouteScroll />
      <Footer />
    </div>
  )
}

export default function App() {
  // the intro loader only runs on a cold start at "/"
  const [loading, setLoading] = useState(() => window.location.pathname === '/')
  return (
    <ScrollProvider paused={loading}>
      <Layout loading={loading} onLoaded={() => setLoading(false)} />
    </ScrollProvider>
  )
}
