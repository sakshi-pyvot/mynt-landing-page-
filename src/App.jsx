import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
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
const Guide = lazy(() => import('@/pages/Guide'))
const Services = lazy(() => import('@/pages/Services'))
const About = lazy(() => import('@/pages/About'))
const Join = lazy(() => import('@/pages/Join'))
const CaseStudies = lazy(() => import('@/pages/CaseStudies'))
const Contact = lazy(() => import('@/pages/Contact'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// ported pyvotmynt.in funnel (mynt-landing-onboarding) — auth + onboarding
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const DataProcessing = lazy(() => import('@/pages/DataProcessing'))

const FUNNEL_PATHS = ['/login', '/signup', '/onboarding', '/processing']

// same guard logic as the onboarding app's inline ternaries
function RequireAuth({ to, children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to={to} replace />
}

// funnel-root re-points the tokens the marketing theme also owns (card, radius)
const Funnel = ({ children }) => <div className="funnel-root">{children}</div>

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
    document.title = TITLES[pathname] || (pathname.startsWith('/mynt/guides/') ? TITLES['/mynt/guides'] : 'Mynt by Pyvot')
  }, [pathname])

  // funnel pages ship their own chrome — hide the marketing shell there
  const funnel = FUNNEL_PATHS.includes(pathname)

  return (
    <div id="top">
      {loading && <PyvotLoader onDone={onLoaded} />}
      {!funnel && <CustomCursor />}
      {!funnel && <ProgressBar />}
      {!funnel && <Nav />}
      <main>
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/mynt" element={<Mynt />} />
            <Route path="/mynt/guides" element={<Guides />} />
            <Route path="/mynt/guides/:id" element={<Guide />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/join" element={<Join />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Funnel><Login /></Funnel>} />
            <Route path="/signup" element={<Funnel><Signup /></Funnel>} />
            <Route
              path="/onboarding"
              element={<RequireAuth to="/signup"><Funnel><Onboarding /></Funnel></RequireAuth>}
            />
            <Route
              path="/processing"
              element={<RequireAuth to="/login"><Funnel><DataProcessing /></Funnel></RequireAuth>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {/* after <main> so its layout effect runs AFTER page pin effects —
          the pre-paint hash snap then sees post-pin offsets */}
      <RouteScroll />
      {!funnel && <Footer />}
      <SonnerToaster />
    </div>
  )
}

export default function App() {
  // the intro loader only runs on a cold start at "/"
  const [loading, setLoading] = useState(() => window.location.pathname === '/')
  return (
    <AuthProvider>
      <TooltipProvider>
        <ScrollProvider paused={loading}>
          <Layout loading={loading} onLoaded={() => setLoading(false)} />
        </ScrollProvider>
      </TooltipProvider>
    </AuthProvider>
  )
}
