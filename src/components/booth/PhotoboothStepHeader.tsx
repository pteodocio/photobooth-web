import React from 'react'
import { X, Sparkles, Check } from 'lucide-react'
import { sound } from '../../services/soundService'

export interface PhotoboothStepHeaderProps {
  currentStep: number // 1 to 7
  stepTitle: string
  stepSubtitle?: string
  legacyStepText?: string // e.g. "Step 1 of 4"
  onExit: () => void
}

const STAGES = [
  { step: 1, name: 'Filter' },
  { step: 2, name: 'Frame' },
  { step: 3, name: 'Timer' },
  { step: 4, name: 'Camera' },
  { step: 5, name: 'Shoot' },
  { step: 6, name: 'Preview' },
  { step: 7, name: 'Download' },
]

export const PhotoboothStepHeader: React.FC<PhotoboothStepHeaderProps> = ({
  currentStep,
  stepTitle,
  stepSubtitle,
  legacyStepText,
  onExit,
}) => {
  return (
    <header className="w-full pb-3.5 mb-4 border-b border-white/[0.08] flex flex-col gap-3">
      {/* Top Bar: Brand, Progress Breadcrumb, and Exit Button */}
      <div className="flex items-center justify-between gap-4">
        {/* Brand Studio Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF385C] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#FF385C]/20">
            4C
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5 leading-none">
              <span>Korean 4-Cut</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 font-normal">
                STUDIO
              </span>
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5 leading-none">
              Aesthetic Self-Photo Booth
            </p>
          </div>
        </div>

        {/* Desktop 7-Stage Stepper Breadcrumbs */}
        <nav
          aria-label="Photobooth Progress"
          className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
        >
          {STAGES.map((s, idx) => {
            const isCompleted = currentStep > s.step
            const isCurrent = currentStep === s.step
            return (
              <React.Fragment key={s.step}>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-[background-color,color] duration-150 ${
                    isCurrent
                      ? 'bg-[#FF385C] text-white shadow-sm'
                      : isCompleted
                      ? 'text-white/80 bg-white/[0.06]'
                      : 'text-white/35'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-white text-[#FF385C]'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {isCompleted ? <Check size={9} strokeWidth={3} /> : s.step}
                  </span>
                  <span>{s.name}</span>
                </div>
                {idx < STAGES.length - 1 && (
                  <span className="text-white/20 text-xs px-0.5">·</span>
                )}
              </React.Fragment>
            )
          })}
        </nav>

        {/* Exit Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick()
            onExit()
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          title="Exit Session"
        >
          <X size={16} />
        </button>
      </div>

      {/* Screen Title & Mobile Progress Indicator */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="md:hidden text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF385C]/20 text-[#FF385C] border border-[#FF385C]/30">
              Stage {currentStep}/7
            </span>
            {legacyStepText && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                {legacyStepText}
              </span>
            )}
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {stepTitle}
            </h1>
          </div>
          {stepSubtitle && (
            <p className="text-xs text-white/50 mt-0.5">{stepSubtitle}</p>
          )}
        </div>

        {/* Subtle Step Tip */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
          <Sparkles size={12} className="text-[#FF385C]" />
          <span>Stage {currentStep} of 7</span>
        </div>
      </div>
    </header>
  )
}
