import React from 'react'
import { Camera, QrCode, Smartphone } from 'lucide-react'
import { sound } from '../../services/soundService'

interface HeroSectionProps {
  onStartBooth: () => void
  onOpenRetrieve: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartBooth,
  onOpenRetrieve,
}) => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 flex flex-col md:flex-row items-center justify-between gap-12">
      {/* Left Column: Simple Clean Copy */}
      <div className="flex-1 max-w-xl text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF385C]" />
          <span>Web & Mobile Photobooth</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Korean 4-cut photo booth in your browser.
        </h1>

        <p className="text-base text-white/60 mb-8 leading-relaxed">
          Take 4-cut or 6-cut photos using your webcam, pick from 36 aesthetic frames, add filters and stickers, and download high-resolution prints.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              sound.playClick()
              onStartBooth()
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-sm font-bold shadow-lg shadow-[#FF385C]/25 transition-all cursor-pointer active:scale-95"
          >
            <Camera size={16} />
            <span>Start Booth</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              onOpenRetrieve()
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <QrCode size={16} />
            <span>Find Photos</span>
          </button>

          <a
            href="/apk/photobooth-release.apk"
            download="photobooth-release.apk"
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium border border-white/5 transition-colors"
          >
            <Smartphone size={16} />
            <span>APK (54MB)</span>
          </a>
        </div>
      </div>

      {/* Right Column: Clean Sample Strips */}
      <div className="relative flex items-center justify-center p-4">
        {/* Sample Strip 1: Classic Blue */}
        <div className="w-36 rounded-xl bg-[#0F223D] p-2.5 photo-card-shadow rotate-[-4deg] border border-white/10">
          <div className="text-[9px] font-bold text-center text-[#7FB5FF] tracking-wider mb-2 uppercase">
            HARU BLUE
          </div>
          <div className="space-y-1.5">
            <div className="aspect-[4/3] rounded bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded bg-[#1C365B]" />
          </div>
          <div className="mt-2 text-center text-[8px] text-[#7FB5FF]/80">
            4-CUT STRIP
          </div>
        </div>

        {/* Sample Strip 2: Cream Classic */}
        <div className="w-36 rounded-xl bg-[#F6F4EE] p-2.5 photo-card-shadow rotate-[4deg] -ml-6 border border-[#E4DEC8] z-10">
          <div className="text-[9px] font-bold text-center text-[#333333] tracking-wider mb-2 uppercase">
            CLASSIC CREAM
          </div>
          <div className="space-y-1.5">
            <div className="aspect-[4/3] rounded bg-[#333338]" />
            <div className="aspect-[4/3] rounded bg-[#333338]" />
            <div className="aspect-[4/3] rounded bg-[#333338]" />
            <div className="aspect-[4/3] rounded bg-[#333338]" />
          </div>
          <div className="mt-2 text-center text-[8px] text-[#555555]">
            4-CUT STRIP
          </div>
        </div>
      </div>
    </section>
  )
}
