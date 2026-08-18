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
      {loading && <PyvotLoader onDone={onLoaded} />}
      <RouteScroll />
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
