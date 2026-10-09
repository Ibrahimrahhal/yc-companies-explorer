import type { Bootstrap } from '../../../shared/types'

interface Props {
  changes: Bootstrap['changes']
  onOpen: (url: string) => void
}

export function UpdatesPanel({ changes, onOpen }: Props): JSX.Element {
  if (!changes) {
    return <div className="empty">Sync once to pull the latest YC directory changes.</div>
  }

  const added = changes.added ?? []
  const updated = changes.updated ?? []

  return (
    <>
      <div className="band">
        <div>
          <h2>Directory pulse</h2>
          <p>
            Latest change summary from the YC OSS feed. New companies and field updates land here
            after each sync.
          </p>
        </div>
        <div className="band-stats">
          <div className="stat">
            <strong>{changes.summary.added}</strong>
            <span>Added</span>
          </div>
          <div className="stat">
            <strong>{changes.summary.updated}</strong>
            <span>Updated</span>
          </div>
          <div className="stat">
            <strong>{changes.summary.current_total}</strong>
            <span>Total companies</span>
          </div>
        </div>
      </div>

      {added.length > 0 ? (
        <>
          <p className="hero-kicker">Newly listed</p>
          <div className="update-list">
            {added.map((s) => (
              <div key={s.id} className="update-row">
                <span className="date">{s.batch}</span>
                <div>
                  <strong>{s.name}</strong>
                  <div style={{ color: 'var(--color-body-muted)', marginTop: 4 }}>
                    {s.one_liner || 'New company'}
                  </div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => onOpen(s.url)}>
                  View
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {updated.length > 0 ? (
        <>
          <p className="hero-kicker" style={{ marginTop: 40 }}>
            Recently updated
          </p>
          <div className="update-list">
            {updated.map((s) => (
              <div key={s.id} className="update-row">
                <span className="date">{s.batch}</span>
                <div>
                  <strong>{s.name}</strong>
                  <div className="fields" style={{ marginTop: 6 }}>
                    {s.changed_fields.join(' · ')}
                  </div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => onOpen(s.url)}>
                  View
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}
