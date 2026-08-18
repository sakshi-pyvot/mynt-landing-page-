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

export default function Landing() {
  return (
    <>
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
    </>
  )
}
