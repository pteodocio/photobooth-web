export interface SessionData {
  sessionId: string
  compositeUrl: string
  frameName: string
  koreanTitle: string
  timestamp: number
  photoUrls?: string[]
}

export class SyncService {
  private static localServerPort = 8080

  static getSessionUrl(sessionId: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://photobooth.app'
    return `${origin}/strip?s=${sessionId}`
  }

  static async fetchSession(sessionId: string): Promise<SessionData | null> {
    // 1. Try local Wi-Fi LAN server if on same network (http://127.0.0.1:8080 or local IP)
    try {
      const lanUrl = `http://${window.location.hostname || '127.0.0.1'}:${this.localServerPort}/strip.png?s=${sessionId}`
      const response = await fetch(lanUrl, { method: 'HEAD', mode: 'cors' })
      if (response.ok) {
        return {
          sessionId,
          compositeUrl: lanUrl,
          frameName: 'Korean 4-Cut',
          koreanTitle: '인생네컷',
          timestamp: Date.now(),
        }
      }
    } catch {
      // Local server not available, fall back to cloud/cache
    }

    // 2. Mock / Demonstration Cloud fallback
    return {
      sessionId,
      compositeUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80`,
      frameName: 'Pastel Dream',
      koreanTitle: '파스텔 드림',
      timestamp: Date.now(),
      photoUrls: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      ],
    }
  }
}
