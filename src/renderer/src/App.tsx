import { useEffect, useState } from 'react'
import type { Bootstrap, FeedPage, Startup, SyncResult, ViewTab } from '../../shared/types'
import { StartupRow } from './components/StartupRow'
import { SavedGrid } from './components/SavedGrid'
import { UpdatesPanel } from './components/UpdatesPanel'
import { formatRelative } from './lib/format'

export default function App(): JSX.Element {
  const [tab, setTab] = useState<ViewTab>('today')
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [feed, setFeed] = useState<FeedPage | null>(null)
  const [saved, setSaved] = useState<Startup[]>([])
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [industry, setIndustry] = useState<string>('All')
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refreshBootstrap(): Promise<Bootstrap> {
    const data = await window.yc.getBootstrap()
    setBootstrap(data)
    return data
  }

  async function loadFeed(loadMore = false): Promise<void> {
    const page = await window.yc.getFeed(loadMore)
    setFeed(page)
  }

  async function loadSaved(): Promise<void> {
    const list = await window.yc.getSaved()
    setSaved(list)
    setSavedIds(new Set(list.map((s) => s.id)))
  }

  useEffect(() => {
    let mounted = true

    async function boot(): Promise<void> {
      try {
        setLoading(true)
        await refreshBootstrap()
        await Promise.all([loadFeed(false), loadSaved()])
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    boot()

    const off = window.yc.onSyncComplete(async (result: SyncResult) => {
      if (!mounted) return
      if (result.ok) {
        await refreshBootstrap()
        await loadFeed(false)
        setError(null)
      } else if (result.error) {
        setError(result.error)
      }
    })

    return () => {
      mounted = false
      off()
    }
  }, [])

  async function handleSync(): Promise<void> {
    setSyncing(true)
    setError(null)
    try {
      const result = await window.yc.sync(true)
      if (!result.ok) {
        setError(result.error ?? 'Sync failed')
      }
      await refreshBootstrap()
      await loadFeed(false)
      if (tab === 'saved') await loadSaved()
    } finally {
      setSyncing(false)
    }
  }

  async function handleToggleSave(id: number): Promise<void> {
    const result = await window.yc.toggleSave(id)
    setSavedIds(new Set(result.savedIds))
    if (tab === 'saved') {
      await loadSaved()
    }
    await refreshBootstrap()
  }

  function open(url: string): void {
    void window.yc.openExternal(url)
  }

  const industries = Array.from(
    new Set((feed?.startups ?? []).map((s) => s.industry).filter(Boolean))
  ).sort()

  const visible = (feed?.startups ?? []).filter(
    (s) => industry === 'All' || s.industry === industry
  )

  return (
    <div className="app-shell">
      <div className="announcement">
        <strong>YC Explorer</strong>
        <span>·</span>
        <span>Local-first feed favoring newest batches</span>
      </div>

      <header className="topbar">
        <div className="brand">
          YC Explorer
          <span>Alpha</span>
        </div>

        <nav className="nav-tabs" aria-label="Primary">
          {(
            [
              ['today', 'Today'],
              ['saved', 'Saved'],
              ['updates', 'Updates']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`nav-tab${tab === id ? ' active' : ''}`}
              onClick={() => {
                setTab(id)
                if (id === 'saved') void loadSaved()
                if (id === 'updates') void refreshBootstrap()
              }}
            >
              {label}
              {id === 'saved' && bootstrap ? ` (${bootstrap.savedCount})` : ''}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <span className="meta-label">
            {syncing ? 'Syncing…' : `Synced ${formatRelative(bootstrap?.lastSyncedAt ?? null)}`}
          </span>
          <button type="button" className="btn-primary" onClick={() => void handleSync()} disabled={syncing}>
            {syncing ? 'Refreshing' : 'Refresh feed'}
          </button>
        </div>
      </header>

      <main>
        {error ? (
          <p className="empty" style={{ color: 'var(--color-error)' }}>
            Sync issue: {error}. Cached local data still works.
          </p>
        ) : null}

        {tab === 'today' ? (
          <>
            <section className="hero">
              <div className="hero-kicker">Startups of the day · {bootstrap?.today ?? '—'}</div>
              <h1>Explore what&apos;s new in YC.</h1>
              <p>
                A quiet daily stack of companies, weighted toward the newest batches. Finish the
                set, load more, and keep a local shortlist — everything persists on disk.
              </p>
            </section>

            <section className="band">
              <div>
                <h2>Today&apos;s deck</h2>
                <p>
                  {feed
                    ? `Showing ${feed.cursor} of ${feed.totalToday} curated companies. Newer batches stay at the front of the ranking.`
                    : 'Building today’s feed…'}
                </p>
              </div>
              <div className="band-stats">
                <div className="stat">
                  <strong>{bootstrap?.companyCount?.toLocaleString() ?? '—'}</strong>
                  <span>Cached companies</span>
                </div>
                <div className="stat">
                  <strong>{feed?.remaining ?? '—'}</strong>
                  <span>Left in today’s pool</span>
                </div>
                <div className="stat">
                  <strong>{bootstrap?.savedCount ?? 0}</strong>
                  <span>Saved</span>
                </div>
              </div>
            </section>

            {loading && !feed ? <div className="loading">Loading local feed…</div> : null}

            {feed && feed.startups.length === 0 ? (
              <div className="empty">
                No companies cached yet. Hit Refresh feed to pull the YC directory.
              </div>
            ) : null}

            {feed && feed.startups.length > 0 ? (
              <>
                <div className="filters">
                  <button
                    type="button"
                    className={`btn-outline coral${industry === 'All' ? ' active' : ''}`}
                    onClick={() => setIndustry('All')}
                  >
                    All
                  </button>
                  {industries.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`btn-outline coral${industry === name ? ' active' : ''}`}
                      onClick={() => setIndustry(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <div className="feed">
                  {visible.map((startup, index) => (
                    <StartupRow
                      key={startup.id}
                      startup={startup}
                      saved={savedIds.has(startup.id)}
                      index={index}
                      onToggleSave={(id) => void handleToggleSave(id)}
                      onOpen={open}
                    />
                  ))}
                </div>

                <div className="footer-bar">
                  <div>
                    <strong style={{ display: 'block', marginBottom: 6 }}>
                      {feed.hasMore ? 'Keep going' : 'Caught up'}
                    </strong>
                    <p>
                      {feed.hasMore
                        ? `${feed.remaining} unseen companies left — newer batches stay first.`
                        : 'You’ve seen the current directory. Refresh to pull updates, or wait for new YC listings.'}
                    </p>
                  </div>
                  {feed.hasMore ? (
                    <button type="button" className="btn-primary" onClick={() => void loadFeed(true)}>
                      Load more
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={() => void handleSync()}>
                      Refresh directory
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {tab === 'saved' ? (
          <>
            <section className="hero">
              <div className="hero-kicker">Shortlist</div>
              <h1>Saved startups.</h1>
              <p>Your pinned companies live in local JSON under the app data directory.</p>
            </section>
            <SavedGrid
              startups={saved}
              onToggleSave={(id) => void handleToggleSave(id)}
              onOpen={open}
            />
          </>
        ) : null}

        {tab === 'updates' ? (
          <>
            <section className="hero">
              <div className="hero-kicker">Feed status</div>
              <h1>What changed.</h1>
              <p>
                Data source: YC OSS daily mirror. Local cache:{' '}
                <button type="button" className="btn-secondary" onClick={() => void window.yc.openDataDir()}>
                  open data folder
                </button>
              </p>
            </section>
            <UpdatesPanel changes={bootstrap?.changes ?? null} onOpen={open} />
          </>
        ) : null}
      </main>
    </div>
  )
}
