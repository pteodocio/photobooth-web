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

  it('saves and retrieves recent sessions from localStorage', () => {
    localStorage.clear()
    expect(SyncService.getRecentSessions()).toHaveLength(0)

    SyncService.saveRecentSession({
      sessionId: 'session_recent_1',
      compositeUrl: 'https://example.com/strip1.png',
      frameName: 'Pink Ribbon Christmas',
      passcode: '8812',
    })

    const recents = SyncService.getRecentSessions()
    expect(recents).toHaveLength(1)
    expect(recents[0].frameName).toBe('Pink Ribbon Christmas')
    expect(recents[0].passcode).toBe('8812')
    expect(recents[0].token).toBeDefined()
  })

  it('fetches session by 4-digit passcode without exposing raw sessionId', async () => {
    const videoBlob = new Blob(['mock-video-bytes'], { type: 'video/webm' })
    const sessionId = 'session_code_test_99'
    const passcode = '4829'

    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(new Blob(['mock-data'])))
    )

    await SyncService.uploadSession(
      sessionId,
      'data:image/png;base64,mockStripWithPasscode',
      'Santa Workshop',
      '산타의 작업실',
      'fourCut',
      'none',
      'BEST SHOT 👑',
      videoBlob,
      passcode
    )

    const result = await SyncService.fetchByPasscode(passcode)
    expect(result).not.toBeNull()
    expect(result?.frameName).toBe('Santa Workshop')
    expect(result?.token).toBeDefined()
    expect(result?.token).not.toContain('session_')
  })
})
