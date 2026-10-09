import type { Startup } from '../../../shared/types'
import { initials, logoUrl } from '../lib/format'

interface Props {
  startup: Startup
  saved: boolean
  index: number
  onToggleSave: (id: number) => void
  onOpen: (url: string) => void
}

export function StartupRow({ startup, saved, index, onToggleSave, onOpen }: Props): JSX.Element {
  const logo = logoUrl(startup.small_logo_thumb_url)

  return (
    <article className="startup-row" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      {logo ? (
        <img className="logo" src={logo} alt="" loading="lazy" />
      ) : (
        <div className="logo placeholder" aria-hidden>
          {initials(startup.name)}
        </div>
      )}

      <div className="startup-body">
        <h3>{startup.name}</h3>
        <p className="one-liner">{startup.one_liner || 'No one-liner yet.'}</p>
        <div className="meta-row">
          <span className="chip">{startup.batch || 'Unknown batch'}</span>
          {startup.industry ? <span className="chip muted">{startup.industry}</span> : null}
          {startup.status ? <span className="chip stone">{startup.status}</span> : null}
          {startup.isHiring ? <span className="chip stone">Hiring</span> : null}
          {startup.team_size != null ? (
            <span className="chip muted">Team {startup.team_size}</span>
          ) : null}
        </div>
        {startup.long_description ? <p className="long-desc">{startup.long_description}</p> : null}
      </div>

      <div className="startup-actions">
        <button
          type="button"
          className={`btn-outline${saved ? ' active' : ''}`}
          onClick={() => onToggleSave(startup.id)}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
        {startup.website ? (
          <button type="button" className="btn-secondary" onClick={() => onOpen(startup.website)}>
            Website
          </button>
        ) : null}
        {startup.url ? (
          <button type="button" className="btn-secondary" onClick={() => onOpen(startup.url)}>
            YC page
          </button>
        ) : null}
      </div>
    </article>
  )
}
