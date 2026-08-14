import { useEffect, useState } from 'react'
import { ScrollProvider, getLenis } from '@/lib/scroll'
import CustomCursor from '@/components/CustomCursor'
import Preloader from '@/components/Preloader'
import ProgressBar from '@/components/ProgressBar'
import Nav from '@/components/Nav'
import Hero from '@/components/sections/Hero'
import TrustMarquee from '@/components/sections/TrustMarquee'
import ExcelToDashboard from '@/components/sections/ExcelToDashboard'
import ProductCanvas from '@/components/sections/ProductCanvas'
import MyntAI from '@/components/sections/MyntAI'
import DetectChain from '@/components/sections/DetectChain'
import ProofBand from '@/components/sections/ProofBand'
import ExpertsSplit from '@/components/sections/ExpertsSplit'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/sections/Footer'

function Page() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading) getLenis()?.start()
  }, [loading])

  return (
    <div id="top">
      {loading && <Preloader onDone={() => setLoading(false)} />}
      <CustomCursor />
      <ProgressBar />
      <Nav />
      <main>
        <Hero />
        <TrustMarquee />
        <ExcelToDashboard />
        <ProductCanvas />
        <MyntAI />
        <DetectChain />
        <ProofBand />
        <ExpertsSplit />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ScrollProvider>
      <Page />
    </ScrollProvider>
  )
}
