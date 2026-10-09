import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { AppState, Startup } from '../shared/types'

const DEFAULT_STATE: AppState = {
  lastSyncedAt: null,
  companies: [],
  savedIds: [],
  seenIds: [],
  daily: null,
  changes: null,
  zoomFactor: 1
}

export class LocalStore {
  private dir: string
  private statePath: string
  private state: AppState

  constructor() {
    this.dir = join(app.getPath('userData'), 'yc-explorer-data')
    this.statePath = join(this.dir, 'state.json')
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true })
    }
    this.state = this.load()
  }

  getDataDir(): string {
    return this.dir
  }

  getState(): AppState {
    return this.state
  }

  getCompanies(): Startup[] {
    return this.state.companies
  }

  setCompanies(companies: Startup[]): void {
    this.state.companies = companies
    this.persist()
  }

  setChanges(changes: AppState['changes']): void {
    this.state.changes = changes
    this.persist()
  }

  setLastSyncedAt(iso: string): void {
    this.state.lastSyncedAt = iso
    this.persist()
  }

  setDaily(daily: AppState['daily']): void {
    this.state.daily = daily
    this.persist()
  }

  markSeen(ids: number[]): void {
    const set = new Set(this.state.seenIds)
    for (const id of ids) set.add(id)
    this.state.seenIds = Array.from(set)
    this.persist()
  }

  toggleSaved(id: number): boolean {
    const set = new Set(this.state.savedIds)
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    this.state.savedIds = Array.from(set)
    this.persist()
    return set.has(id)
  }

  getSavedIds(): number[] {
    return this.state.savedIds
  }

  getSeenIds(): number[] {
    return this.state.seenIds
  }

  getZoomFactor(): number {
    return this.state.zoomFactor || 1
  }

  setZoomFactor(factor: number): void {
    this.state.zoomFactor = factor
    this.persist()
  }

  private load(): AppState {
    if (!existsSync(this.statePath)) {
      return structuredClone(DEFAULT_STATE)
    }
    try {
      const raw = readFileSync(this.statePath, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppState>
      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        companies: parsed.companies ?? [],
        savedIds: parsed.savedIds ?? [],
        seenIds: parsed.seenIds ?? [],
        daily: parsed.daily ?? null,
        changes: parsed.changes ?? null,
        zoomFactor: typeof parsed.zoomFactor === 'number' ? parsed.zoomFactor : 1
      }
    } catch {
      return structuredClone(DEFAULT_STATE)
    }
  }

  private persist(): void {
    const tmp = `${this.statePath}.tmp`
    writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf-8')
    renameSync(tmp, this.statePath)
  }
}
