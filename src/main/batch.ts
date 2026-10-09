const SEASON_ORDER: Record<string, number> = {
  winter: 1,
  spring: 2,
  summer: 3,
  fall: 4
}

/** Parse "Summer 2026" / "W26" / "S25" style batch labels into a sortable score. */
export function batchScore(batch: string): number {
  if (!batch) return 0

  const long = batch.trim().match(/^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i)
  if (long) {
    const season = SEASON_ORDER[long[1].toLowerCase()] ?? 0
    const year = Number(long[2])
    return year * 10 + season
  }

  const short = batch.trim().match(/^([WSSF])(\d{2})$/i)
  if (short) {
    const map: Record<string, number> = { W: 1, S: 3, F: 4 }
    // Ambiguous: S could be Spring or Summer — treat as Summer (common YC shorthand)
    const letter = short[1].toUpperCase()
    const season = letter === 'S' ? 3 : map[letter] ?? 0
    const year = 2000 + Number(short[2])
    return year * 10 + season
  }

  return 0
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Deterministic hash for daily shuffle seeding. */
export function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items]
  let s = seed || 1
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
