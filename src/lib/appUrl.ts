/** CFD app origin (VITE_DASHBOARD_URL). Target of the one-time handoff after login success and "Go to Dashboard". */
export const APP_URL =
  (import.meta.env.VITE_DASHBOARD_URL as string | undefined)?.replace(/\/$/, "") ?? "";
