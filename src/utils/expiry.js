const SOON_DAYS = 3

export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= SOON_DAYS) return 'soon'
  return 'ok'
}
