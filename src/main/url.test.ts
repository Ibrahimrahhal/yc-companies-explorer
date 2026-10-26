import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isSafeExternalUrl, openSafeExternal } from './url.ts'

describe('isSafeExternalUrl', () => {
  it('allows valid HTTPS URLs', () => {
    assert.strictEqual(isSafeExternalUrl('https://www.ycombinator.com'), true)
    assert.strictEqual(isSafeExternalUrl('https://example.com/startups?batch=W24#about'), true)
  })

  it('allows valid HTTP URLs', () => {
    assert.strictEqual(isSafeExternalUrl('http://example.com'), true)
    assert.strictEqual(isSafeExternalUrl('http://localhost:3000'), true)
  })

  it('normalizes scheme case variations', () => {
    assert.strictEqual(isSafeExternalUrl('HTTPS://EXAMPLE.COM'), true)
    assert.strictEqual(isSafeExternalUrl('Http://Example.Com/path'), true)
  })

  it('handles surrounding whitespace gracefully', () => {
    assert.strictEqual(isSafeExternalUrl('   https://example.com   '), true)
  })

  it('rejects file URLs', () => {
    assert.strictEqual(isSafeExternalUrl('file:///etc/passwd'), false)
    assert.strictEqual(isSafeExternalUrl('file:///C:/Windows/System32/calc.exe'), false)
  })

  it('rejects javascript URLs', () => {
    assert.strictEqual(isSafeExternalUrl('javascript:alert(1)'), false)
    assert.strictEqual(isSafeExternalUrl('JAVASCRIPT:void(0)'), false)
  })

  it('rejects data URLs', () => {
    assert.strictEqual(isSafeExternalUrl('data:text/html,<script>alert(1)</script>'), false)
  })

  it('rejects custom protocols', () => {
    assert.strictEqual(isSafeExternalUrl('custom-protocol://action'), false)
    assert.strictEqual(isSafeExternalUrl('ms-msdt:/id PCWDiagnostic'), false)
    assert.strictEqual(isSafeExternalUrl('powershell://script'), false)
    assert.strictEqual(isSafeExternalUrl('mailto:test@example.com'), false)
    assert.strictEqual(isSafeExternalUrl('tel:+1234567890'), false)
    assert.strictEqual(isSafeExternalUrl('calc:'), false)
  })

  it('rejects malformed or scheme-only URLs', () => {
    assert.strictEqual(isSafeExternalUrl('not-a-url'), false)
    assert.strictEqual(isSafeExternalUrl('https://'), false)
    assert.strictEqual(isSafeExternalUrl('http://'), false)
    assert.strictEqual(isSafeExternalUrl('://empty-scheme'), false)
    assert.strictEqual(isSafeExternalUrl('http:///'), false)
  })

  it('rejects empty strings, whitespace, and non-string inputs', () => {
    assert.strictEqual(isSafeExternalUrl(''), false)
    assert.strictEqual(isSafeExternalUrl('   '), false)
    assert.strictEqual(isSafeExternalUrl(null), false)
    assert.strictEqual(isSafeExternalUrl(undefined), false)
    assert.strictEqual(isSafeExternalUrl(123), false)
    assert.strictEqual(isSafeExternalUrl({}), false)
  })
})

describe('openSafeExternal', () => {
  it('invokes opener with trimmed URL when URL is valid', async () => {
    const opened: string[] = []
    const mockOpener = async (url: string): Promise<void> => {
      opened.push(url)
    }

    const success = await openSafeExternal('  https://ycombinator.com  ', mockOpener)
    assert.strictEqual(success, true)
    assert.deepStrictEqual(opened, ['https://ycombinator.com'])
  })

  it('does NOT invoke opener for unsafe schemes or malformed URLs', async () => {
    const opened: string[] = []
    const mockOpener = async (url: string): Promise<void> => {
      opened.push(url)
    }

    const unsafeUrls = [
      'file:///C:/calc.exe',
      'javascript:alert(1)',
      'data:text/plain,hello',
      'calc:',
      'https://',
      ''
    ]

    for (const url of unsafeUrls) {
      const success = await openSafeExternal(url, mockOpener)
      assert.strictEqual(success, false)
    }

    assert.strictEqual(opened.length, 0)
  })

  it('catches opener errors and returns false without throwing', async () => {
    const failingOpener = async (): Promise<void> => {
      throw new Error('OS failed to open application')
    }

    const result = await openSafeExternal('https://example.com', failingOpener)
    assert.strictEqual(result, false)
  })
})
