import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// elements the custom cursor should grow over — shared with the Guide reader,
// which forwards hover state out of the article iframe
export const HOVER_SELECTOR = 'a, button, [data-magnetic], input, select, textarea, [role=button]'
