import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncService } from '../src/services/syncService'

describe('SyncService Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('generates correct cloud and LAN retrieval URLs', () => {
    const sessionUrl = SyncService.getSessionUrl('session_12345')
    expect(sessionUrl).toContain('session_12345')
  })

  it('fetches session strip via mock fallback when offline', async () => {
    const data = await SyncService.fetchSession('session_test_999')
    expect(data).toBeDefined()
    expect(data?.sessionId).toBe('session_test_999')
    expect(data?.compositeUrl).toBeDefined()
  })
})
