import { CONTACT } from './site'

// One submit path for every enquiry form. With VITE_FORMS_ENDPOINT set (Formspree /
// Web3Forms-style JSON endpoint) the data is POSTed; otherwise, or on failure, the
// enquiry is handed to the visitor's mail client with the fields in the body.
export const FORMS_ENDPOINT = import.meta.env.VITE_FORMS_ENDPOINT || ''

export async function submitForm(formEl, subject) {
  const data = Object.fromEntries(new FormData(formEl).entries())
  if (FORMS_ENDPOINT) {
    try {
      const res = await fetch(FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ subject, ...data }),
      })
      if (res.ok) return 'sent'
    } catch {
      // fall through to mailto
    }
  }
  const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')
  window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`
  return 'mailto'
}

export const STATUS_TEXT = {
  sending: 'Sending…',
  sent: 'Sent — we reply within one working day.',
  mailto: `Opened in your mail app — or write to ${CONTACT.email}.`,
}
