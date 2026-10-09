import type { DailyChanges, Startup, SyncResult } from '../shared/types'
import type { LocalStore } from './storage'
import { ensureDailyFeed, rebuildDailyFeed } from './feed'

const COMPANIES_URL = 'https://yc-oss.github.io/api/companies/all.json'
const CHANGES_URL = 'https://yc-oss.github.io/api/changes/latest.json'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'YC-Explorer/0.1'
    }
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`)
  }
  return (await res.json()) as T
}

export async function syncYC(
  store: LocalStore,
  options: { refreshFeed?: boolean } = {}
): Promise<SyncResult> {
  try {
    const [companies, changes] = await Promise.all([
      fetchJson<Startup[]>(COMPANIES_URL),
      fetchJson<DailyChanges>(CHANGES_URL).catch(() => null)
    ])

    if (!Array.isArray(companies) || companies.length === 0) {
      throw new Error('Company feed returned empty')
    }

    store.setCompanies(companies)
    if (changes) store.setChanges(changes)

    const now = new Date().toISOString()
    store.setLastSyncedAt(now)

    if (options.refreshFeed) {
      rebuildDailyFeed(store)
    } else {
      ensureDailyFeed(store)
    }

    return {
      ok: true,
      companyCount: companies.length,
      lastSyncedAt: now,
      addedToday: changes?.summary.added ?? 0
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      companyCount: store.getCompanies().length,
      lastSyncedAt: store.getState().lastSyncedAt ?? '',
      addedToday: 0,
      error: message
    }
  }
}

export function shouldAutoSync(store: LocalStore): boolean {
  const last = store.getState().lastSyncedAt
  if (!last) return true
  const age = Date.now() - new Date(last).getTime()
  return age > 1000 * 60 * 60 * 6 // 6 hours
}
