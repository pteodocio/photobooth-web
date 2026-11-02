import React from 'react'
import { Sparkles, Camera, QrCode, Smartphone } from 'lucide-react'

interface HeroSectionProps {
  onStartBooth: () => void
  onOpenRetrieve: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartBooth,
  onOpenRetrieve,
}) => {
  return (
    <section className="relative w-full pt-16 pb-12 px-4 sm:px-6 flex flex-col items-center text-center overflow-hidden">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FF5252]/15 via-[#00F0FF]/10 to-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Brand Label */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-semibold mb-6 backdrop-blur-md">
        <Sparkles size={14} className="text-[#FF5252]" />
        <span>인생네컷 · KOREAN 4-CUT PHOTOBOOTH</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-3xl mb-5">
        Capture Your Moments in Authentic{' '}
        <span className="bg-gradient-to-r from-[#FF5252] via-[#FF85A1] to-[#00F0FF] bg-clip-text text-transparent">
          Korean Photobooth
        </span>{' '}
        Style.
      </h1>

      <p className="text-sm sm:text-base text-white/60 max-w-xl mb-8 leading-relaxed">
        36 artistic Korean photobooth frames, 4-Cut and balanced 6-Cut layouts,
        real-time filters, sticker stamps, and high-resolution 300 DPI print downloads directly from your web browser or phone.
      </p>

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-12">
        <button
          onClick={onStartBooth}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#FF5252] hover:bg-[#FF3838] text-white font-bold text-sm shadow-xl shadow-[#FF5252]/30 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Camera size={18} />
          웹 포토부스 시작 Launch Web Booth
        </button>

        <button
          onClick={onOpenRetrieve}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 backdrop-blur-md transition-all"
        >
          <QrCode size={18} />
          내 사진 찾기 Find My Strip
        </button>

        <a
          href="/apk/photobooth-release.apk"
          download="photobooth-release.apk"
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#1C1C22] hover:bg-[#25252D] text-white/90 hover:text-white font-semibold text-sm border border-white/15 transition-all"
        >
          <Smartphone size={18} className="text-[#00F0FF]" />
          안드로이드 APK Download (54MB)
        </a>
      </div>

      {/* Metric badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-white/10 text-center">
        <div>
          <div className="text-2xl font-black text-white">36</div>
          <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Aesthetic Frames</div>
        </div>
        <div>
          <div className="text-2xl font-black text-white">4:3</div>
          <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Korean Viewfinder</div>
        </div>
        <div>
          <div className="text-2xl font-black text-white">300 DPI</div>
          <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Studio Print Quality</div>
        </div>
        <div>
          <div className="text-2xl font-black text-white">100%</div>
          <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Mobile Sync Parity</div>
        </div>
      </div>
    </section>
  )
}
