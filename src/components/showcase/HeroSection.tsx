import React from 'react'
import { Camera, QrCode, Smartphone, Sparkles } from 'lucide-react'
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
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 flex flex-col md:flex-row items-center justify-between gap-12 select-none">
      {/* Left Column: Clean Brand Copy */}
      <div className="flex-1 max-w-xl text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF385C] animate-pulse" />
          <span className="tracking-wide">Korean 4-Cut Self Studio</span>
          <span className="text-white/30">·</span>
          <span className="text-[#FF385C] flex items-center gap-1">
            <Sparkles size={11} />
            BTS Motion Strip
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Korean 4-cut photo booth in your browser.
        </h1>

        <p className="text-base text-white/60 mb-8 leading-relaxed">
          Capture authentic 4-cut film strips with 40 studio filters, 40 festive holiday frames, customizable pose countdown timers, and synchronized Behind-The-Scenes live motion reels.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              onStartBooth()
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-sm font-bold shadow-lg shadow-[#FF385C]/25 transition-transform duration-150 cursor-pointer transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <Camera size={16} />
            <span>Start Booth</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              onOpenRetrieve()
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm font-medium border border-white/10 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <QrCode size={16} />
            <span>Find Photos</span>
          </button>

          <a
            href="/apk/photobooth-release.apk"
            download="photobooth-release.apk"
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium border border-white/5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <Smartphone size={16} />
            <span>APK (54MB)</span>
          </a>
        </div>
      </div>

      {/* Right Column: Clean Realistic Photobooth Strips */}
      <div className="relative flex items-center justify-center p-4">
        {/* Sample Strip 1: Deep Navy Film */}
        <div className="w-36 rounded-xl bg-[#0F223D] p-2.5 photo-card-shadow rotate-[-4deg] border border-white/10">
          <div className="text-[9px] font-bold text-center text-[#7FB5FF] tracking-wider mb-2 uppercase">
            HARU BLUE
          </div>
          <div className="space-y-1.5">
            <div className="aspect-[4/3] rounded-sm bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded-sm bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded-sm bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded-sm bg-[#1C365B]" />
          </div>
          <div className="mt-2 text-center text-[8px] text-[#7FB5FF]/80 font-mono">
            4-CUT STRIP
          </div>
        </div>

        {/* Sample Strip 2: Cream Classic Studio Strip */}
        <div className="w-36 rounded-xl bg-[#F6F4EE] p-2.5 photo-card-shadow rotate-[4deg] -ml-6 border border-[#E4DEC8] z-10">
          <div className="text-[9px] font-bold text-center text-[#333333] tracking-wider mb-2 uppercase">
            CLASSIC CREAM
          </div>
          <div className="space-y-1.5">
            <div className="aspect-[4/3] rounded-sm bg-[#333338]" />
            <div className="aspect-[4/3] rounded-sm bg-[#333338]" />
            <div className="aspect-[4/3] rounded-sm bg-[#333338]" />
            <div className="aspect-[4/3] rounded-sm bg-[#333338]" />
          </div>
          <div className="mt-2 text-center text-[8px] text-[#555555] font-mono">
            4-CUT STRIP
          </div>
        </div>
      </div>
    </section>
  )
}
