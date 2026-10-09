import type { Startup } from '../../../shared/types'

interface Props {
  startups: Startup[]
  onToggleSave: (id: number) => void
  onOpen: (url: string) => void
}

export function SavedGrid({ startups, onToggleSave, onOpen }: Props): JSX.Element {
  if (!startups.length) {
    return (
      <div className="empty">
        No saved startups yet. Save companies from Today&apos;s feed to build your shortlist.
      </div>
    )
  }

  return (
    <div className="saved-grid">
      {startups.map((s, i) => (
        <article key={s.id} className="product-card" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="meta-row">
            <span className="chip">{s.batch}</span>
            {s.industry ? <span className="chip muted">{s.industry}</span> : null}
          </div>
          <h3>{s.name}</h3>
          <p>{s.one_liner || s.long_description || 'No description.'}</p>
          <div className="meta-row">
            <button type="button" className="btn-outline active" onClick={() => onToggleSave(s.id)}>
              Unsave
            </button>
            {s.website ? (
              <button type="button" className="btn-secondary" onClick={() => onOpen(s.website)}>
                Open
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
