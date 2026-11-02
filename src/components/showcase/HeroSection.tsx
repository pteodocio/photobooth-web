import React from 'react'
import { Camera, QrCode, Smartphone, ArrowUpRight, Film, Disc } from 'lucide-react'
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
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-16 overflow-hidden">
      {/* Studio Background Ambience: Subtle Warm Tungsten Glow & Lightbox Grid (NO AI PURPLE MESH) */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-[#FF385C]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 left-10 w-[400px] h-[400px] bg-[#1A3B6B]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Editorial Studio Marquee (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          {/* Studio Station Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#16161D] border border-[#262633] text-[#A2A2B0] text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF385C]" />
            <span className="font-semibold text-white/90">BOOTH TERMINAL #04</span>
            <span className="text-white/30">|</span>
            <span className="text-[11px] text-[#A2A2B0]">HONGDAE ARCHIVE</span>
          </div>

          {/* Authentic Studio Headline */}
          <div className="mb-4">
            <span className="block text-sm sm:text-base font-mono tracking-widest text-[#FF385C] uppercase font-bold mb-2">
              인생네컷 · 포토이즘 · 하루필름 에디션
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08]">
              오늘의 우리, <br className="hidden sm:inline" />
              가장 자연스러운 <br />
              <span className="text-[#FF385C] underline decoration-[#FF385C]/30 decoration-wavy underline-offset-8">
                순간을 남기다.
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#9B9BA8] max-w-xl mb-8 leading-relaxed font-sans">
            홍대와 성수동 포토부스 감성을 웹 브라우저에서 그대로.
            36가지 시그니처 프레임, 4컷 및 밸런스드 6컷 분할, 실시간 레트로 필터와 스티커 스탬프,
            그리고 인화소 품질의 300 DPI 고해상도 인쇄물을 바로 출력하세요.
          </p>

          {/* Action Triggers */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-10">
            <button
              onClick={() => {
                sound.playClick()
                onStartBooth()
              }}
              className="relative group flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white font-mono font-bold text-sm tracking-wide shadow-2xl shadow-[#FF385C]/30 border border-[#FF6680]/40 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Camera size={18} className="transition-transform group-hover:rotate-[-10deg]" />
              <span>부스 입장 START BOOTH</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/30 font-normal">FREE</span>
            </button>

            <button
              onClick={() => {
                sound.playClick()
                onOpenRetrieve()
              }}
              className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#14141A] hover:bg-[#1C1C24] text-[#D8D8E2] hover:text-white font-mono text-sm font-semibold border border-[#2A2A38] transition-all cursor-pointer active:translate-y-0.5"
            >
              <QrCode size={17} className="text-[#00F0FF]" />
              <span>사진 찾기 RETRIEVE STRIP</span>
            </button>

            <a
              href="/apk/photobooth-release.apk"
              download="photobooth-release.apk"
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#121217] hover:bg-[#181820] text-[#A0A0B0] hover:text-white font-mono text-xs border border-[#22222E] transition-all"
            >
              <Smartphone size={15} className="text-[#FFB800]" />
              <span>APK (54MB)</span>
              <ArrowUpRight size={13} className="opacity-60" />
            </a>
          </div>

          {/* Studio Hardware Specs Ticker Bar (Replaces AI-slop centered 4 boxes) */}
          <div className="w-full pt-6 border-t border-[#1C1C25] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="text-[#686878] text-[10px] uppercase">Format Ratio</div>
              <div className="text-white font-semibold flex items-center gap-1.5">
                <Film size={13} className="text-[#FF385C]" />
                4:3 Viewfinder
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[#686878] text-[10px] uppercase">Cut Geometries</div>
              <div className="text-white font-semibold">4-Cut & 6-Cut Balanced</div>
            </div>
            <div className="space-y-1">
              <div className="text-[#686878] text-[10px] uppercase">Print Output</div>
              <div className="text-white font-semibold flex items-center gap-1.5">
                <Disc size={13} className="text-[#00F0FF]" />
                300 DPI Dye-Sub
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[#686878] text-[10px] uppercase">Library</div>
              <div className="text-white font-semibold">36 Korean Themes</div>
            </div>
          </div>
        </div>

        {/* Right Asymmetric Physical Photo Strips Showcase (5 cols) */}
        <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
          <div className="relative w-full max-w-[380px] h-[480px] sm:h-[520px]">
            {/* Background Washi Tape Decor */}
            <div className="absolute -top-4 left-1/3 w-28 h-6 washi-tape-accent rotate-[-6deg] z-20 pointer-events-none rounded-sm" />

            {/* Strip 1: Haru Classic Blue (Tilted Left) */}
            <div className="absolute top-4 left-2 w-36 sm:w-40 rounded-xl bg-[#0F223D] p-2.5 photo-card-shadow rotate-[-7deg] border border-[#274872] transition-transform hover:rotate-[-2deg] hover:z-30 duration-300">
              <div className="text-[8px] font-mono font-bold text-center text-[#7FB5FF] tracking-wider mb-1.5 uppercase">
                HARU FILM · 4-CUT
              </div>
              <div className="space-y-1.5">
                <div className="aspect-[4/3] rounded-md bg-[#1C365B] flex items-center justify-center overflow-hidden">
                  <div className="text-[9px] font-mono text-[#7FB5FF]/60 font-bold">FRAME 01</div>
                </div>
                <div className="aspect-[4/3] rounded-md bg-[#1C365B] flex items-center justify-center overflow-hidden">
                  <div className="text-[9px] font-mono text-[#7FB5FF]/60 font-bold">FRAME 02</div>
                </div>
                <div className="aspect-[4/3] rounded-md bg-[#1C365B] flex items-center justify-center overflow-hidden">
                  <div className="text-[9px] font-mono text-[#7FB5FF]/60 font-bold">FRAME 03</div>
                </div>
                <div className="aspect-[4/3] rounded-md bg-[#1C365B] flex items-center justify-center overflow-hidden">
                  <div className="text-[9px] font-mono text-[#7FB5FF]/60 font-bold">FRAME 04</div>
                </div>
              </div>
              <div className="mt-2 text-center text-[8px] font-mono text-[#9BC7FF]">
                인생네컷 · 2026.11.02
              </div>
            </div>

            {/* Strip 2: Signature Life 4-Cut Coral Pink (Center Hero) */}
            <div className="absolute top-0 right-8 sm:right-12 w-40 sm:w-44 rounded-xl bg-[#F6F4EE] p-3 photo-card-shadow rotate-[4deg] border border-[#E4DEC8] z-10 transition-transform hover:rotate-[1deg] hover:scale-105 duration-300">
              {/* Camera Tape Header */}
              <div className="flex items-center justify-between text-[8px] font-mono font-bold text-[#8C1830] tracking-wider mb-2 border-b border-[#E8E2D2] pb-1 uppercase">
                <span>PHOTO STUDIO</span>
                <span className="text-[#FF385C]">● LIVE</span>
              </div>
              {/* Photo Slots */}
              <div className="space-y-1.5">
                <div className="aspect-[4/3] rounded-sm bg-[#2B2B32] border border-[#40404C] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-[#3A3845] to-[#5C5668] flex items-center justify-center text-[10px] font-mono text-[#E4DEC8]">
                    SMILE :)
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-sm bg-[#2B2B32] border border-[#40404C] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-[#423D4D] to-[#696177] flex items-center justify-center text-[10px] font-mono text-[#E4DEC8]">
                    PEACE V
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-sm bg-[#2B2B32] border border-[#40404C] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-[#3F3B4B] to-[#5D5769] flex items-center justify-center text-[10px] font-mono text-[#E4DEC8]">
                    HEART &lt;3
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-sm bg-[#2B2B32] border border-[#40404C] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-[#34303E] to-[#544E60] flex items-center justify-center text-[10px] font-mono text-[#E4DEC8]">
                    CHEEKS *.*
                  </div>
                </div>
              </div>
              {/* Korean Studio Footer with Barcode graphic */}
              <div className="mt-2.5 text-center">
                <div className="text-[10px] font-bold text-[#1F1F24] tracking-tight">인생네컷 STUDIO</div>
                <div className="h-4 mt-1 bg-[repeating-linear-gradient(to_right,#222_0,#222_2px,transparent_2px,transparent_4px,#222_4px,#222_7px,transparent_7px,transparent_9px)] opacity-70" />
              </div>
            </div>

            {/* Strip 3: 6-Cut Cyber Grid Floating Behind */}
            <div className="absolute bottom-2 right-0 w-36 rounded-xl bg-[#131317] p-2.5 photo-card-shadow rotate-[12deg] border border-[#2D2D38] -z-0 opacity-80 hover:opacity-100 transition-all duration-300">
              <div className="text-[7px] font-mono font-bold text-center text-[#FF385C] tracking-wider mb-1.5 uppercase">
                6-CUT BALANCED
              </div>
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-sm bg-[#22222B] border border-[#33333F]" />
                ))}
              </div>
              <div className="mt-1.5 text-center text-[7px] font-mono text-white/50">
                SEOUL BOOTH · 300DPI
              </div>
            </div>

            {/* Tactile Receipt Stub Badge */}
            <div className="absolute -bottom-6 left-6 z-20 bg-[#16161C] border border-[#2C2C3A] rounded-lg p-2.5 photo-card-shadow flex items-center gap-3 font-mono text-[11px]">
              <div className="w-7 h-7 rounded bg-[#FF385C]/10 border border-[#FF385C]/30 flex items-center justify-center text-[#FF385C] font-bold">
                OK
              </div>
              <div>
                <div className="text-white/90 font-bold">PRINT VOUCHER</div>
                <div className="text-white/50 text-[10px]">AUTH #4C-2026-KR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
