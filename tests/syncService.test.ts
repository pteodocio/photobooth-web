import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncService } from '../src/services/syncService'

describe('SyncService Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('generates clean video retrieval URLs without exposing raw backend session id', () => {
    const rawSessionId = 'session_12345'
    const token = SyncService.encodeVideoToken(rawSessionId)
    expect(token).not.toContain('session_')

    const decoded = SyncService.decodeVideoToken(token)
    expect(decoded).toBe(rawSessionId)

    const videoUrl = SyncService.getVideoPageUrl(rawSessionId)
    expect(videoUrl).toContain('?v=' + token)
    expect(videoUrl).not.toContain('session_12345')
  })

  it('fetches session strip via mock fallback when offline', async () => {
    const data = await SyncService.fetchSession('session_test_999')
    expect(data).toBeDefined()
    expect(data?.sessionId).toBe('session_test_999')
    expect(data?.compositeUrl).toBeDefined()
  })

  it('stores and retrieves session data with video in local cache', async () => {
    const videoBlob = new Blob(['mock-video-bytes'], { type: 'video/webm' })
    const sessionId = 'session_cache_test'

    // Mock fetch for Supabase upload returning fresh Response on each call
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(new Blob(['mock-data'])))
    )

    await SyncService.uploadSession(
      sessionId,
      'data:image/png;base64,mockStrip',
      'Pastel Dream',
      '파스텔 드림',
      'fourCut',
      'none',
      'BEST SHOT 👑',
      videoBlob
    )

    const session = await SyncService.fetchSession(sessionId)
    expect(session).toBeDefined()
    expect(session?.sessionId).toBe(sessionId)
    expect(session?.compositeUrl).toBeDefined()
    expect(session?.videoUrl).toBeDefined()
  })
})
