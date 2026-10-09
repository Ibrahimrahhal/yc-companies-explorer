export interface Startup {
  id: number
  name: string
  slug: string
  former_names: string[]
  small_logo_thumb_url: string
  website: string
  all_locations: string
  long_description: string
  one_liner: string
  team_size: number | null
  industry: string
  subindustry: string
  launched_at: number
  tags: string[]
  tags_highlighted: string[]
  top_company: boolean
  isHiring: boolean
  nonprofit: boolean
  batch: string
  status: string
  industries: string[]
  regions: string[]
  stage: string
  app_video_public: boolean
  demo_day_video_public: boolean
  url: string
  api: string
}

export interface DailyChanges {
  generated_at: string
  summary: {
    previous_total: number
    current_total: number
    added: number
    removed: number
    updated: number
  }
  added: Startup[]
  removed: Array<Pick<Startup, 'id' | 'name' | 'slug' | 'batch' | 'url'>>
  updated: Array<{
    id: number
    name: string
    slug: string
    batch: string
    url: string
    changed_fields: string[]
  }>
}

export interface AppState {
  lastSyncedAt: string | null
  companies: Startup[]
  savedIds: number[]
  seenIds: number[]
  daily: {
    date: string
    startupIds: number[]
    cursor: number
  } | null
  changes: DailyChanges | null
  zoomFactor: number
}

export interface FeedPage {
  date: string
  startups: Startup[]
  cursor: number
  totalToday: number
  hasMore: boolean
  remaining: number
}

export interface SyncResult {
  ok: boolean
  companyCount: number
  lastSyncedAt: string
  addedToday: number
  error?: string
}

export type ViewTab = 'today' | 'saved' | 'updates'

export interface Bootstrap {
  lastSyncedAt: string | null
  companyCount: number
  savedCount: number
  dataDir: string
  today: string
  changes: {
    generated_at: string
    summary: {
      previous_total: number
      current_total: number
      added: number
      removed: number
      updated: number
    }
    added: Startup[]
    updated: Array<{
      id: number
      name: string
      slug: string
      batch: string
      url: string
      changed_fields: string[]
    }>
  } | null
}
