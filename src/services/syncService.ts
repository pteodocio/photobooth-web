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
}

// In-memory cache for fast local retrieval and offline preview
const localSessionCache = new Map<string, SessionData>()

export class SyncService {
  private static localServerPort = 8080

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
    videoBlob?: Blob | null
  ): Promise<{ compositeUrl: string | null; videoUrl: string | null }> {
    let compositePublicUrl: string | null = null
    let videoPublicUrl: string | null = null

    // Store in local cache first for instant retrieval
    localSessionCache.set(sessionId, {
      sessionId,
      compositeUrl: compositeDataUrl,
      videoUrl: videoBlob ? URL.createObjectURL(videoBlob) : undefined,
      frameName,
      koreanTitle,
      timestamp: Date.now(),
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
      })

      if (dbError) {
        console.warn('Supabase db upsert warning:', dbError)
      }

      // Update cache with public URLs if available
      if (compositePublicUrl || videoPublicUrl) {
        const cached = localSessionCache.get(sessionId)
        if (cached) {
          if (compositePublicUrl) cached.compositeUrl = compositePublicUrl
          if (videoPublicUrl) cached.videoUrl = videoPublicUrl
        }
      }

      return { compositeUrl: compositePublicUrl, videoUrl: videoPublicUrl }
    } catch (e) {
      console.warn('Failed to upload session to Supabase:', e)
      return { compositeUrl: null, videoUrl: null }
    }
  }

  // Fetch session data from Cache, Supabase Cloud, or Local LAN
  static async fetchSession(sessionId: string): Promise<SessionData | null> {
    // 1. Check local session cache first
    const cached = localSessionCache.get(sessionId)
    if (cached) {
      return cached
    }

    // 2. Query Supabase Database
    try {
      const { data, error } = await supabase
        .from('booth_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()

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
}
