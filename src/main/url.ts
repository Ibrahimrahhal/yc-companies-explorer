/**
 * Validates whether a raw URL string is safe to open in the operating system's default browser.
 * Only HTTP and HTTPS URLs with a valid hostname are permitted.
 */
export function isSafeExternalUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname)
    )
  } catch {
    return false
  }
}

/**
 * Safely passes a validated URL to the external opener function (e.g. Electron's shell.openExternal).
 * Rejects unsafe protocols and catches any invocation errors to avoid unhandled rejections.
 */
export async function openSafeExternal(
  rawUrl: unknown,
  opener: (url: string) => Promise<void>
): Promise<boolean> {
  if (!isSafeExternalUrl(rawUrl)) {
    return false
  }

  try {
    await opener((rawUrl as string).trim())
    return true
  } catch {
    return false
  }
}
