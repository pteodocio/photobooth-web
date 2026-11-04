import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env?.VITE_SUPABASE_URL || 'https://syiiasdanvvtsdmwvwvu.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5aWlhc2RhbnZ2dHNkbXd2d3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1OTIzNDUsImV4cCI6MjEwOTE2ODM0NX0.wxdcpkEkdtrxzWYjJAmMTRUfh4ElZsOtB22xmFMYQKc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface SessionData {
  sessionId: string
  compositeUrl: string
  videoUrl?: string
  frameName: string
  koreanTitle: string
  timestamp: number
  photoUrls?: string[]
  passcode?: string
}

export interface RecentSessionItem {
  token: string
  compositeUrl: string
  videoUrl?: string
  frameName: string
  passcode?: string
  timestamp: number
}

// In-memory cache for fast local retrieval and offline preview
const localSessionCache = new Map<string, SessionData>()

export class SyncService {
  private static localServerPort = 8080
  static readonly RECENT_STORAGE_KEY = 'photobooth_recent_history'

  static encodeVideoToken(sessionId: string): string {
    try {
      const clean = sessionId.replace(/^session_/, '')
      if (typeof btoa !== 'undefined') {
        return btoa(clean).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
      return clean
    } catch {
      return sessionId
    }
  }

  static decodeVideoToken(token: string): string {
    try {
      if (typeof atob !== 'undefined') {
        let base64 = token.replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) base64 += '='
        const decoded = atob(base64)
        return decoded.startsWith('session_') ? decoded : `session_${decoded}`
      }
      return token.startsWith('session_') ? token : `session_${token}`
    } catch {
      return token.startsWith('session_') ? token : `session_${token}`
    }
  }

  static getVideoPageUrl(sessionId: string): string {
    const token = this.encodeVideoToken(sessionId)
    const configuredUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_URL) || ''
    if (configuredUrl) {
      const cleanUrl = configuredUrl.replace(/\/+$/, '')
      return `${cleanUrl}/?v=${token}`
    }

    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      return `${origin}/?v=${token}`
    }
    return `https://photobooth.app/?v=${token}`
  }

  static getSessionUrl(sessionId: string): string {
    return this.getVideoPageUrl(sessionId)
  }

  static async fetchVideo(token: string): Promise<{ videoUrl: string; title: string } | null> {
    const sessionId = this.decodeVideoToken(token)

    // 1. Check local session cache first
    const cached = localSessionCache.get(sessionId)
    if (cached && cached.videoUrl) {
      return { videoUrl: cached.videoUrl, title: cached.frameName || 'Photobooth Video' }
    }

    // 2. Query Supabase
    try {
      const { data, error } = await supabase
        .from('booth_sessions')
        .select('video_url, frame_name')
        .eq('id', sessionId)
        .maybeSingle()

      if (!error && data && data.video_url) {
        return {
          videoUrl: data.video_url,
          title: data.frame_name || 'Photobooth Video',
        }
      }
    } catch (err) {
      console.warn('Failed to fetch video:', err)
    }

    return null
  }

  // Upload completed session to Supabase Cloud Storage & Database
  static async uploadSession(
    sessionId: string,
    compositeDataUrl: string,
    frameName: string,
    koreanTitle: string,
    layout: string,
    filter: string,
    stampText: string,
    videoBlob?: Blob | null,
    passcode?: string
  ): Promise<{ compositeUrl: string | null; videoUrl: string | null }> {
    let compositePublicUrl: string | null = null
    let videoPublicUrl: string | null = null

    const localVideoUrl = videoBlob ? URL.createObjectURL(videoBlob) : undefined

    // Store in local cache first for instant retrieval
    localSessionCache.set(sessionId, {
      sessionId,
      compositeUrl: compositeDataUrl,
      videoUrl: localVideoUrl,
      frameName,
      koreanTitle,
      timestamp: Date.now(),
      passcode,
    })

    // Save to device recent sessions history immediately
    this.saveRecentSession({
      sessionId,
      compositeUrl: compositeDataUrl,
      videoUrl: localVideoUrl,
      frameName,
      passcode,
    })

    try {
      // 1. Upload photo strip to Supabase Storage Bucket
      const res = await fetch(compositeDataUrl)
      const blob = await res.blob()
      const stripFilePath = `strips/${sessionId}.png`

      const { error: uploadError } = await supabase.storage
        .from('photobooth-strips')
        .upload(stripFilePath, blob, {
          contentType: 'image/png',
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('photobooth-strips')
          .getPublicUrl(stripFilePath)
        compositePublicUrl = publicUrlData.publicUrl
      } else {
        console.warn('Supabase strip upload warning:', uploadError)
      }

      // 2. Upload video if recorded
      if (videoBlob && videoBlob.size > 0) {
        const isMp4 = videoBlob.type.includes('mp4')
        const videoExt = isMp4 ? 'mp4' : 'webm'
        const videoFilePath = `videos/${sessionId}.${videoExt}`

        const { error: videoUploadError } = await supabase.storage
          .from('photobooth-strips')
          .upload(videoFilePath, videoBlob, {
            contentType: videoBlob.type || 'video/webm',
            upsert: true,
          })

        if (!videoUploadError) {
          const { data: videoUrlData } = supabase.storage
            .from('photobooth-strips')
            .getPublicUrl(videoFilePath)
          videoPublicUrl = videoUrlData.publicUrl
        } else {
          console.warn('Supabase video upload warning:', videoUploadError)
        }
      }

      // 3. Save metadata record to booth_sessions table
      const finalCompositeUrl = compositePublicUrl || compositeDataUrl
      const { error: dbError } = await supabase.from('booth_sessions').upsert({
        id: sessionId,
        frame_id: frameName.toLowerCase().replace(/\s+/g, '_'),
        frame_name: frameName,
        korean_title: koreanTitle,
        layout,
        filter,
        stamp_text: stampText,
        composite_url: finalCompositeUrl,
        video_url: videoPublicUrl,
        passcode: passcode || null,
      })

      if (dbError) {
        console.warn('Supabase db upsert warning:', dbError)
      }

      // Update cache and recents with public URLs if available
      if (compositePublicUrl || videoPublicUrl) {
        const cached = localSessionCache.get(sessionId)
        if (cached) {
          if (compositePublicUrl) cached.compositeUrl = compositePublicUrl
          if (videoPublicUrl) cached.videoUrl = videoPublicUrl
        }
        this.saveRecentSession({
          sessionId,
          compositeUrl: finalCompositeUrl,
          videoUrl: videoPublicUrl || localVideoUrl,
          frameName,
          passcode,
        })
      }

      return { compositeUrl: compositePublicUrl, videoUrl: videoPublicUrl }
    } catch (e) {
      console.warn('Failed to upload session to Supabase:', e)
      return { compositeUrl: null, videoUrl: null }
    }
  }

  // Fetch session data from Cache, Supabase Cloud, or Local LAN
  static async fetchSession(sessionIdOrToken: string): Promise<SessionData | null> {
    const sessionId = sessionIdOrToken.startsWith('session_')
      ? sessionIdOrToken
      : this.decodeVideoToken(sessionIdOrToken)

    // 1. Check local session cache first
    const cached = localSessionCache.get(sessionId) || localSessionCache.get(sessionIdOrToken)
    if (cached) {
      return cached
    }

    // 2. Query Supabase Database
    try {
      let { data, error } = await supabase
        .from('booth_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()

      if (!data && sessionId !== sessionIdOrToken) {
        const fallback = await supabase
          .from('booth_sessions')
          .select('*')
          .eq('id', sessionIdOrToken)
          .maybeSingle()
        data = fallback.data
        error = fallback.error
      }

      if (!error && data && data.composite_url) {
        const sessionData: SessionData = {
          sessionId: data.id,
          compositeUrl: data.composite_url,
          videoUrl: data.video_url || undefined,
          frameName: data.frame_name,
          koreanTitle: data.korean_title || '',
          timestamp: new Date(data.created_at).getTime(),
          photoUrls: data.photo_urls || [],
        }
        localSessionCache.set(sessionId, sessionData)
        return sessionData
      }
    } catch (err) {
      console.warn('Supabase fetch failed, attempting local fallback:', err)
    }

    // 2. Try local Wi-Fi LAN server if mobile app is running on the same network
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
      // Local server not available
    }

    // 3. Fallback demo data if session not found yet
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

  // Save recent session to browser localStorage (stores max 10 entries)
  static saveRecentSession(item: {
    sessionId: string
    compositeUrl: string
    videoUrl?: string
    frameName: string
    passcode?: string
  }): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return
      const token = this.encodeVideoToken(item.sessionId)
      const existing: RecentSessionItem[] = this.getRecentSessions()
      const filtered = existing.filter(s => s.token !== token)
      const newItem: RecentSessionItem = {
        token,
        compositeUrl: item.compositeUrl,
        videoUrl: item.videoUrl,
        frameName: item.frameName,
        passcode: item.passcode,
        timestamp: Date.now(),
      }
      const updated = [newItem, ...filtered].slice(0, 10)
      window.localStorage.setItem(this.RECENT_STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.warn('Failed to save recent session:', err)
    }
  }

  // Retrieve list of recent sessions saved on this device
  static getRecentSessions(): RecentSessionItem[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return []
      const raw = window.localStorage.getItem(this.RECENT_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Retrieve session by 4-digit photo passcode without revealing internal session IDs
  static async fetchByPasscode(code: string): Promise<{
    token: string
    isVideo: boolean
    compositeUrl: string
    videoUrl?: string
    frameName: string
  } | null> {
    const cleanCode = code.trim()
    if (!cleanCode) return null

    // 1. Search in-memory session cache first
    for (const [sId, sess] of localSessionCache.entries()) {
      if (sess.passcode === cleanCode) {
        return {
          token: this.encodeVideoToken(sId),
          isVideo: Boolean(sess.videoUrl),
          compositeUrl: sess.compositeUrl,
          videoUrl: sess.videoUrl,
          frameName: sess.frameName,
        }
      }
    }

    // 2. Search local storage recent history
    const recents = this.getRecentSessions()
    const matchRecent = recents.find(r => r.passcode === cleanCode)
    if (matchRecent) {
      return {
        token: matchRecent.token,
        isVideo: Boolean(matchRecent.videoUrl),
        compositeUrl: matchRecent.compositeUrl,
        videoUrl: matchRecent.videoUrl,
        frameName: matchRecent.frameName,
      }
    }

    // 3. Query Supabase Database by passcode
    try {
      const { data, error } = await supabase
        .from('booth_sessions')
        .select('id, composite_url, video_url, frame_name, passcode')
        .eq('passcode', cleanCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data && data.id) {
        const token = this.encodeVideoToken(data.id)
        const result = {
          token,
          isVideo: Boolean(data.video_url),
          compositeUrl: data.composite_url || '',
          videoUrl: data.video_url || undefined,
          frameName: data.frame_name || 'Photobooth Strip',
        }
        // Save to device recent sessions for subsequent rapid access
        this.saveRecentSession({
          sessionId: data.id,
          compositeUrl: result.compositeUrl,
          videoUrl: result.videoUrl,
          frameName: result.frameName,
          passcode: cleanCode,
        })
        return result
      }
    } catch (err) {
      console.warn('Supabase fetchByPasscode error:', err)
    }

    return null
  }
}
