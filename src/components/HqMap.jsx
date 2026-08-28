// HQ map: free Google Maps embed (no API key) — always-current streets and
// buildings around Ergo Tower. Pinned by exact coordinates so the marker is the
// office, not whichever business Google matches by name. Dark look comes from
// the .hq-embed CSS invert filter.
const HQ = '22.57092,88.43273' // Ergo Tower, Plot A1-4, Block EP & GP, Sector V

export default function HqMap({ className }) {
  return (
    <div className={className}>
      <iframe
        src={`https://maps.google.com/maps?q=${HQ}&z=16&output=embed`}
        title="Pyvot HQ — Ergo Tower, Sector V, Kolkata"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="hq-embed h-full w-full border-0"
      />
    </div>
  )
}
