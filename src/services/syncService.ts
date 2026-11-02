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

  // Upload completed session to Supabase Cloud Storage & Database
  static async uploadSession(
    sessionId: string,
    compositeDataUrl: string,
    frameName: string,
    koreanTitle: string,
    layout: string,
    filter: string,
    stampText: string
  ): Promise<string | null> {
    try {
      // 1. Convert DataURL to Blob
      const res = await fetch(compositeDataUrl)
      const blob = await res.blob()
      const filePath = `strips/${sessionId}.png`

      // 2. Upload to Supabase Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from('photobooth-strips')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) {
        console.warn('Supabase storage upload error:', uploadError)
        return null
      }

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('photobooth-strips')
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl

      // 4. Save metadata record to booth_sessions table
      const { error: dbError } = await supabase.from('booth_sessions').upsert({
        id: sessionId,
        frame_id: frameName.toLowerCase().replace(/\s+/g, '_'),
        frame_name: frameName,
        korean_title: koreanTitle,
        layout,
        filter,
        stamp_text: stampText,
        composite_url: publicUrl,
      })

      if (dbError) {
        console.warn('Supabase db upsert error:', dbError)
      }

      return publicUrl
    } catch (e) {
      console.warn('Failed to upload session to Supabase:', e)
      return null
    }
  }

  // Fetch session data from Supabase Cloud or Local LAN
  static async fetchSession(sessionId: string): Promise<SessionData | null> {
    // 1. Query Supabase Database
    try {
      const { data, error } = await supabase
        .from('booth_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()

      if (!error && data && data.composite_url) {
        return {
          sessionId: data.id,
          compositeUrl: data.composite_url,
          frameName: data.frame_name,
          koreanTitle: data.korean_title || '',
          timestamp: new Date(data.created_at).getTime(),
          photoUrls: data.photo_urls || [],
        }
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
