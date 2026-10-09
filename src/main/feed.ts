import type { AppState, FeedPage, Startup } from '../shared/types'
import { batchScore, hashSeed, seededShuffle, todayKey } from './batch'
import type { LocalStore } from './storage'

const PAGE_SIZE = 8
const PACK_SIZE = 24

function rankCompanies(companies: Startup[]): Startup[] {
  return [...companies].sort((a, b) => {
    const batchDiff = batchScore(b.batch) - batchScore(a.batch)
    if (batchDiff !== 0) return batchDiff

    const launchDiff = (b.launched_at || 0) - (a.launched_at || 0)
    if (launchDiff !== 0) return launchDiff

    const statusRank = (s: Startup) => (s.status === 'Active' ? 1 : 0)
    return statusRank(b) - statusRank(a)
  })
}

function pickNext(
  companies: Startup[],
  skipIds: Iterable<number>,
  count: number,
  seed: number
): Startup[] {
  const skip = new Set(skipIds)
  const ranked = rankCompanies(companies)
  const unseen = ranked.filter((c) => !skip.has(c.id))
  const pool = unseen.length > 0 ? unseen : ranked.filter((c) => !skip.has(c.id))
  const source = pool.length > 0 ? pool : ranked
  if (source.length === 0) return []

  const cutoff = batchScore(source.find((c) => batchScore(c.batch) > 0)?.batch ?? '')
  const favored = source.filter((c) => cutoff === 0 || batchScore(c.batch) >= cutoff - 20)
  const candidates = (favored.length >= count ? favored : source).slice(0, Math.max(count * 5, 60))
  return seededShuffle(candidates, seed).slice(0, count)
}

function unseenRemaining(store: LocalStore, extraSkip: number[] = []): number {
  const skip = new Set([...store.getSeenIds(), ...extraSkip])
  return store.getCompanies().filter((c) => !skip.has(c.id)).length
}

function materialize(store: LocalStore, ids: number[], cursor: number, date: string): FeedPage {
  const byId = new Map(store.getCompanies().map((c) => [c.id, c]))
  const visibleIds = ids.slice(0, cursor)
  store.markSeen(visibleIds)

  const startups = visibleIds
    .map((id) => byId.get(id))
    .filter((c): c is Startup => Boolean(c))

  const remainingInDeck = Math.max(0, ids.length - cursor)
  const leftoverUnseen = unseenRemaining(store, ids)

  return {
    date,
    startups,
    cursor,
    totalToday: ids.length,
    hasMore: remainingInDeck > 0 || leftoverUnseen > 0,
    remaining: remainingInDeck + leftoverUnseen
  }
}

export function rebuildDailyFeed(store: LocalStore): void {
  const date = todayKey()
  const next = pickNext(
    store.getCompanies(),
    store.getSeenIds(),
    PACK_SIZE,
    hashSeed(`yc-explorer:${date}:${Date.now()}`)
  )
  store.setDaily({
    date,
    startupIds: next.map((c) => c.id),
    cursor: 0
  })
}

export function ensureDailyFeed(store: LocalStore): void {
  const state = store.getState()
  const date = todayKey()
  if (state.daily?.date === date && state.daily.startupIds.length > 0) {
    return
  }

  const next = pickNext(
    state.companies,
    state.seenIds,
    PACK_SIZE,
    hashSeed(`yc-explorer:${date}`)
  )
  store.setDaily({
    date,
    startupIds: next.map((c) => c.id),
    cursor: 0
  })
}

function extendPool(store: LocalStore): void {
  const state = store.getState()
  const daily = state.daily
  if (!daily) return

  const skip = [...state.seenIds, ...daily.startupIds]
  const extra = pickNext(
    state.companies,
    skip,
    PACK_SIZE,
    hashSeed(`yc-explorer:${daily.date}:more:${daily.startupIds.length}`)
  )

  if (extra.length === 0) return

  store.setDaily({
    ...daily,
    startupIds: [...daily.startupIds, ...extra.map((c) => c.id)]
  })
}

export function getFeedPage(store: LocalStore, loadMore = false): FeedPage {
  ensureDailyFeed(store)
  let state = store.getState()
  let daily = state.daily!

  if (loadMore && daily.cursor >= daily.startupIds.length) {
    extendPool(store)
    state = store.getState()
    daily = state.daily!
  }

  let cursor = daily.cursor
  if (loadMore) {
    cursor = Math.min(cursor + PAGE_SIZE, daily.startupIds.length)
  } else if (cursor === 0) {
    cursor = Math.min(PAGE_SIZE, daily.startupIds.length)
  }

  store.setDaily({ ...daily, cursor })
  return materialize(store, store.getState().daily!.startupIds, cursor, daily.date)
}

export function getSavedStartups(store: LocalStore): Startup[] {
  const state = store.getState()
  const byId = new Map(state.companies.map((c) => [c.id, c]))
  return state.savedIds
    .map((id) => byId.get(id))
    .filter((c): c is Startup => Boolean(c))
}

export type { AppState }
