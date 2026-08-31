export interface PaymentLinkState {
  status: string | null;
  shortUrl: string | null;
  expiresAt?: string | null;
}

export function isUsablePaymentLink(
  link: PaymentLinkState | null | undefined,
  now = Date.now(),
): link is PaymentLinkState & { shortUrl: string } {
  if (!link || (link.status !== "created" && link.status !== "partially_paid")) {
    return false;
  }
  if (typeof link.shortUrl !== "string" || link.shortUrl.trim().length === 0) {
    return false;
  }
  if (link.expiresAt === null || link.expiresAt === undefined) {
    return true;
  }
  const expiry = new Date(link.expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > now;
}
