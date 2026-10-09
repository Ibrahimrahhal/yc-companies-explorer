export function formatRelative(iso: string | null): string {
  if (!iso) return 'Never synced'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Never synced'
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function logoUrl(url: string | undefined): string | null {
  if (!url || url.includes('missing.png') || url.startsWith('/')) return null
  return url
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
