import { useEffect, useState } from 'react'
import { ScrollProvider, getLenis } from '@/lib/scroll'
import CustomCursor from '@/components/CustomCursor'
import PyvotLoader from '@/components/PyvotLoader'
import { markLoaded } from '@/lib/loaded'
import ProgressBar from '@/components/ProgressBar'
import Nav from '@/components/Nav'
import Hero from '@/components/sections/Hero'
import TrustMarquee from '@/components/sections/TrustMarquee'
import ExcelToDashboard from '@/components/sections/ExcelToDashboard'
import ProductCanvas from '@/components/sections/ProductCanvas'
import MyntAI from '@/components/sections/MyntAI'
import DetectChain from '@/components/sections/DetectChain'
import ProofBand from '@/components/sections/ProofBand'
import ClientVoices from '@/components/sections/ClientVoices'
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
      {loading && <PyvotLoader onDone={() => { setLoading(false); markLoaded() }} />}
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
        <ClientVoices />
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
