import React from 'react'
import { X, Check } from 'lucide-react'
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
    <header className="w-full pb-3 mb-4 border-b border-black/[0.06] flex flex-col gap-3">
      {/* Top Bar: Brand, Progress Breadcrumb, and Exit Button */}
      <div className="flex items-center justify-between gap-4">
        {/* Brand Studio Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#FFF0F3] text-[#FF4D6D] border border-[#FF4D6D]/20 flex items-center justify-center font-bold text-xs shadow-xs">
            4C
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-[#1C1917] tracking-tight flex items-center gap-1.5 leading-none">
              <span>Korean 4-Cut</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/[0.04] text-[#78716C] font-normal">
                STUDIO
              </span>
            </h2>
            <p className="text-[10px] text-[#A8A29E] mt-0.5 leading-none">
              Minimalist Photo Studio
            </p>
          </div>
        </div>

        {/* Desktop 7-Stage Stepper Breadcrumbs */}
        <nav
          aria-label="Photobooth Progress"
          className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-black/[0.02] border border-black/[0.05]"
        >
          {STAGES.map((s, idx) => {
            const isCompleted = currentStep > s.step
            const isCurrent = currentStep === s.step
            return (
              <React.Fragment key={s.step}>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] font-medium transition-[background-color,color] duration-150 ${
                    isCurrent
                      ? 'bg-white text-[#FF4D6D] shadow-xs font-semibold'
                      : isCompleted
                      ? 'text-[#1C1917] opacity-80'
                      : 'text-[#A8A29E]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-[#FF4D6D] text-white'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-black/[0.04] text-[#A8A29E]'
                    }`}
                  >
                    {isCompleted ? <Check size={8} strokeWidth={3} /> : s.step}
                  </span>
                  <span>{s.name}</span>
                </div>
                {idx < STAGES.length - 1 && (
                  <span className="text-black/15 text-[10px]">·</span>
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
          className="p-1.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] text-[#78716C] hover:text-[#1C1917] border border-black/[0.04] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          title="Exit Session"
        >
          <X size={15} />
        </button>
      </div>

      {/* Screen Title & Mobile Progress Indicator */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="md:hidden text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FFF0F3] text-[#FF4D6D] border border-[#FF4D6D]/20">
              {currentStep}/7
            </span>
            {legacyStepText && (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/[0.03] text-[#78716C] border border-black/[0.05]">
                {legacyStepText}
              </span>
            )}
            <h1 className="text-base sm:text-lg font-semibold text-[#1C1917] tracking-tight">
              {stepTitle}
            </h1>
          </div>
          {stepSubtitle && (
            <p className="text-xs text-[#78716C] mt-0.5">{stepSubtitle}</p>
          )}
        </div>

        <div className="hidden sm:block text-[11px] text-[#A8A29E] font-medium">
          Step {currentStep} of 7
        </div>
      </div>
    </header>
  )
}
