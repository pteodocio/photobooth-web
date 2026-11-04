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
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-16 flex flex-col md:flex-row items-center justify-between gap-12 select-none">
      {/* Left Column: Clean Brand Copy */}
      <div className="flex-1 max-w-lg text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F3] text-[#FF4D6D] text-xs font-medium mb-5 border border-[#FF4D6D]/15">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D]" />
          <span>Korean 4-Cut Self Studio</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-[#1C1917] tracking-tight leading-tight mb-4">
          Korean 4-cut photo booth in your browser.
        </h1>

        <p className="text-base text-[#78716C] mb-8 leading-relaxed max-w-md">
          Aesthetic 4-cut self-photo studio with authentic frames, filters, and behind-the-scenes video.
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              onStartBooth()
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white text-xs font-semibold shadow-xs transition-transform duration-150 cursor-pointer transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <Camera size={15} />
            <span>Start Booth</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              onOpenRetrieve()
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-black/[0.03] text-[#1C1917] text-xs font-medium border border-black/[0.08] shadow-xs transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <QrCode size={15} />
            <span>Find Photos</span>
          </button>

          <a
            href="/apk/photobooth-release.apk"
            download="photobooth-release.apk"
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.05] text-[#78716C] hover:text-[#1C1917] text-xs font-medium border border-black/[0.05] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <Smartphone size={14} />
            <span>APK (54MB)</span>
          </a>
        </div>
      </div>

      {/* Right Column: Clean Sample Strips with Soft Shadows */}
      <div className="relative flex items-center justify-center p-4">
        {/* Sample Strip 1: Navy Strip */}
        <div className="w-32 rounded-xl bg-[#0F223D] p-2 photo-card-shadow rotate-[-4deg] border border-white/20">
          <div className="text-[8px] font-semibold text-center text-[#7FB5FF] tracking-wider mb-1.5 uppercase font-mono">
            HARU BLUE
          </div>
          <div className="space-y-1">
            <div className="aspect-[4/3] rounded-xs bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded-xs bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded-xs bg-[#1C365B]" />
            <div className="aspect-[4/3] rounded-xs bg-[#1C365B]" />
          </div>
          <div className="mt-1.5 text-center text-[7px] text-[#7FB5FF]/80 font-mono">
            4-CUT STRIP
          </div>
        </div>

        {/* Sample Strip 2: Cream Classic Strip */}
        <div className="w-32 rounded-xl bg-[#F6F4EE] p-2 photo-card-shadow rotate-[4deg] -ml-6 border border-[#E4DEC8] z-10">
          <div className="text-[8px] font-semibold text-center text-[#333333] tracking-wider mb-1.5 uppercase font-mono">
            CLASSIC CREAM
          </div>
          <div className="space-y-1">
            <div className="aspect-[4/3] rounded-xs bg-[#333338]" />
            <div className="aspect-[4/3] rounded-xs bg-[#333338]" />
            <div className="aspect-[4/3] rounded-xs bg-[#333338]" />
            <div className="aspect-[4/3] rounded-xs bg-[#333338]" />
          </div>
          <div className="mt-1.5 text-center text-[7px] text-[#555555] font-mono">
            4-CUT STRIP
          </div>
        </div>
      </div>
    </section>
  )
}
