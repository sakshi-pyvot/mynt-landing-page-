// Single source of truth for site structure, contact details and socials.
// Nav + footer + contact page all read from here.

export const CONTACT = {
  email: 'contact@pyvot.in',
  phones: ['+91 98366 66745', '+91 82407 91854'],
  phoneHrefs: ['tel:+919836666745', 'tel:+918240791854'],
  whatsapp: 'https://wa.me/919836666745',
  address: ['5th Floor, Ergo Tower', 'Plot No. A1-4, Block EP & GP', 'Street Number 23, GP Block, Sector V', 'Bidhannagar, Salt Lake City, Kolkata', 'West Bengal 700091, India'],
  maps: 'https://www.google.com/maps/search/?api=1&query=Ergo+Tower+Plot+A1-4+Block+EP+GP+Street+23+Sector+V+Salt+Lake+Kolkata+700091',
}

export const SOCIALS = [
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/pyvot.in/' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/pyvotindia' },
  { key: 'whatsapp', label: 'WhatsApp', href: CONTACT.whatsapp },
  { key: 'mail', label: 'Email', href: `mailto:${CONTACT.email}` },
]

// CTA targets used by CtaPair everywhere. "Get started" goes straight to Mynt signup (same tab).
export const CTA = {
  start: 'https://pyvotmynt.in/signup',
  expert: '/contact?intent=mynt',
}

// Top navigation. `items` → dropdown panel; plain `to` → direct link.
export const NAV = [
  {
    label: 'Mynt',
    title: 'Mynt by Pyvot',
    intro: 'Restaurant intelligence — every platform, payout and outlet in one place.',
    items: [
      { label: 'Data', to: '/#data', hint: 'From spreadsheets to one command centre' },
      { label: 'Product', to: '/#product', hint: 'Overview, ads, refunds, discounts' },
      { label: 'Mynt AI', to: '/#ai', hint: 'Ask why. Get the driver and the action.' },
      { label: 'Product Overview', to: '/mynt', hint: 'What Mynt does, end to end' },
      { label: 'Trust & Security', to: '/mynt#trust', hint: 'How your data is handled' },
      { label: 'Mynt Guides / Help Centre', to: '/mynt/guides', hint: 'Set-up, metrics, how-tos' },
    ],
    cta: { label: 'Get started with Mynt', to: CTA.start },
  },
  {
    label: 'Services',
    intro: 'Software finds the opportunity. People make it happen.',
    items: [
      { label: 'Mynt by Pyvot', to: '/mynt', hint: 'The intelligence layer' },
      { label: 'Online Ordering Aggregator Consulting', to: '/services#online-ordering', hint: 'Zomato · Swiggy growth & economics' },
      { label: 'Dining Aggregator Consulting', to: '/services#dining', hint: 'Dine-in performance & brand experience' },
      { label: 'Social Media Management', to: '/services#social-media', hint: 'Strategy, shoots, reels, community' },
    ],
    cta: { label: 'Talk to an expert', to: CTA.expert },
  },
  {
    label: 'About',
    title: 'About Pyvot',
    intro: 'We spent years inside the restaurant industry. Then we built what was missing.',
    items: [
      { label: 'Our Story', to: '/about', hint: '20+ years around restaurants' },
      { label: 'Our Philosophy', to: '/about#philosophy', hint: 'Growth is a system' },
      { label: 'Our Team', to: '/about#team', hint: 'Leadership, tech, consulting, creative' },
      { label: 'Why Choose Us', to: '/about#why-us', hint: 'Four reasons operators stay' },
      { label: 'Why Join Us', to: '/join', hint: 'How we work, life at Pyvot' },
      { label: 'Open Positions', to: '/join#open-positions', hint: 'Roles + application' },
    ],
    cta: { label: 'See open roles', to: '/join#open-positions' },
  },
  {
    label: 'Customers',
    intro: 'Built on outcomes, not presentations.',
    items: [
      { label: 'Success Stories', to: '/#voices', hint: 'Client voices — owners on film' },
      { label: 'Case Studies', to: '/case-studies', hint: 'Quantified results, brand by brand' },
    ],
    cta: { label: 'Talk to an expert', to: CTA.expert },
  },
  { label: 'Contact', to: '/contact' },
]

export const FOOTER = [
  {
    title: 'Mynt',
    links: [
      { label: 'Product Overview', to: '/mynt' },
      { label: 'Trust & Security', to: '/mynt#trust' },
      { label: 'Mynt Guides / Help Centre', to: '/mynt/guides' },
      { label: 'Mynt AI', to: '/#ai' },
      { label: 'Get started with Mynt', to: CTA.start },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Mynt by Pyvot', to: '/mynt' },
      { label: 'Online Ordering Aggregator Consulting', to: '/services#online-ordering' },
      { label: 'Dining Aggregator Consulting', to: '/services#dining' },
      { label: 'Social Media Management', to: '/services#social-media' },
      { label: 'Talk to an expert', to: CTA.expert },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Success Stories', to: '/#voices' },
      { label: 'Case Studies', to: '/case-studies' },
      { label: 'Join Us', to: '/join' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
]
