import React from 'react'
import type { FrameTemplate, LayoutTypeConfig } from '../../core/types'
import { Check } from 'lucide-react'
import { sound } from '../../services/soundService'

interface FrameThumbnailProps {
  frame: FrameTemplate
  layout: LayoutTypeConfig
  isSelected: boolean
  onClick: () => void
}

function getChristmasGraphics(style: string) {
  switch (style) {
    case 'xmas_01_classic': return { tl: '🌿', tr: '🔔', bl: '🎁', br: '🎄' }
    case 'xmas_02_wonderland': return { tl: '❄️', tr: '❄️', bl: '🎄', br: '❄️' }
    case 'xmas_03_santas_workshop': return { tl: '🦯', tr: '🌟', bl: '🎁', br: '🎅' }
    case 'xmas_04_snowy_december': return { tl: '❄️', tr: '❄️', bl: '⛄', br: '❄️' }
    case 'xmas_05_gingerbread_house': return { tl: '🦯', tr: '🦯', bl: '🍪', br: '🍪' }
    case 'xmas_06_candy_cane': return { tl: '🦯', tr: '🦯', bl: '🦯', br: '🦯' }
    case 'xmas_07_red_and_green': return { tl: '🌿', tr: '🌿', bl: '🧦', br: '🎄' }
    case 'xmas_08_cozy_christmas': return { tl: '✨', tr: '✨', bl: '🧦', br: '🎄' }
    case 'xmas_09_pink_christmas': return { tl: '🎀', tr: '🎀', bl: '🎁', br: '✨' }
    case 'xmas_10_blue_snowfall': return { tl: '❄️', tr: '❄️', bl: '🐻‍❄️', br: '❄️' }
    case 'xmas_11_christmas_ribbon': return { tl: '🎀', tr: '🎀', bl: '🎁', br: '🎁' }
    case 'xmas_12_holly_and_berries': return { tl: '🌿', tr: '🌿', bl: '🌿', br: '🌿' }
    case 'xmas_13_reindeer_friends': return { tl: '🔔', tr: '🔔', bl: '🦌', br: '🎄' }
    case 'xmas_14_christmas_tree': return { tl: '🎄', tr: '🎄', bl: '🎄', br: '🎄' }
    case 'xmas_15_winter_village': return { tl: '❄️', tr: '❄️', bl: '⛄', br: '🎄' }
    case 'xmas_16_snowflake_dreams': return { tl: '❄️', tr: '❄️', bl: '❄️', br: '❄️' }
    case 'xmas_17_merry_and_bright': return { tl: '💡', tr: '💡', bl: '✨', br: '🎁' }
    case 'xmas_18_christmas_cookies': return { tl: '🍪', tr: '🦯', bl: '🍪', br: '🦯' }
    case 'xmas_19_gift_wrapped': return { tl: '🎁', tr: '🎁', bl: '🎁', br: '🎁' }
    case 'xmas_20_golden_christmas': return { tl: '🔔', tr: '✨', bl: '🌟', br: '✨' }
    case 'xmas_21_frosted_window': return { tl: '❄️', tr: '❄️', bl: '❄️', br: '❄️' }
    case 'xmas_22_peppermint_candy': return { tl: '🍬', tr: '🍬', bl: '🦯', br: '🦯' }
    case 'xmas_23_nordic_christmas': return { tl: '❄️', tr: '❄️', bl: '🦌', br: '🎄' }
    case 'xmas_24_christmas_lights': return { tl: '💡', tr: '💡', bl: '💡', br: '💡' }
    case 'xmas_25_nutcracker': return { tl: '🔔', tr: '🔔', bl: '🎄', br: '💂' }
    case 'xmas_26_polar_bear_christmas': return { tl: '❄️', tr: '❄️', bl: '🐻‍❄️', br: '❄️' }
    case 'xmas_27_vintage_postcard': return { tl: '🌿', tr: '🎀', bl: '🔔', br: '🎄' }
    case 'xmas_28_christmas_sweater': return { tl: '🎄', tr: '🎄', bl: '🦌', br: '🎄' }
    case 'xmas_29_midnight_christmas': return { tl: '🌙', tr: '✨', bl: '🦌', br: '✨' }
    case 'xmas_30_kawaii_christmas': return { tl: '🎀', tr: '🎀', bl: '🎅', br: '🦌' }
    case 'xmas_31_snowman_party': return { tl: '❄️', tr: '❄️', bl: '⛄', br: '⛄' }
    case 'xmas_32_christmas_stockings': return { tl: '🧦', tr: '🧦', bl: '🧦', br: '🎄' }
    case 'xmas_33_cozy_fireplace': return { tl: '✨', tr: '✨', bl: '🧦', br: '🎄' }
    case 'xmas_34_starry_night': return { tl: '🌟', tr: '✨', bl: '✨', br: '🌟' }
    case 'xmas_35_pink_ribbon': return { tl: '🎀', tr: '🎀', bl: '🎀', br: '🎁' }
    case 'xmas_36_christmas_market': return { tl: '🌿', tr: '🌿', bl: '🍪', br: '🔔' }
    case 'xmas_37_winter_wonderland': return { tl: '❄️', tr: '❄️', bl: '🐧', br: '🎄' }
    case 'xmas_38_gingerbread_friends': return { tl: '🦯', tr: '🦯', bl: '🍪', br: '🍪' }
    case 'xmas_39_holly_jolly': return { tl: '🔔', tr: '🔔', bl: '🌿', br: '🎄' }
    case 'xmas_40_december_memories': return { tl: '🎀', tr: '❄️', bl: '🎁', br: '🎄' }
    default: return null
  }
}

export const FrameThumbnail: React.FC<FrameThumbnailProps> = ({
  frame,
  layout,
  isSelected,
  onClick,
}) => {
  const isGradient = frame.gradientColors && frame.gradientColors.length >= 2
  const bgStyle = isGradient
    ? { backgroundImage: `linear-gradient(to bottom, ${frame.gradientColors.join(', ')})` }
    : { backgroundColor: frame.backgroundColor }

  const decor = getChristmasGraphics(frame.themeStyle)

  const handleClick = () => {
    sound.playClick()
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group cursor-pointer flex flex-col items-center p-2.5 rounded-xl transition-all duration-200 select-none ${
        isSelected
          ? 'bg-[#181822] ring-2 ring-[#FF385C] shadow-lg shadow-[#FF385C]/20 scale-[1.02]'
          : 'bg-[#121216] hover:bg-[#1A1A20] border border-white/5 hover:border-white/15'
      }`}
    >
      {/* Selected Indicator Stamp */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 bg-[#FF385C] text-white p-1 rounded-md shadow">
          <Check size={11} strokeWidth={3} />
        </div>
      )}

      {/* Miniature 1:3 Physical Photo Strip Silhouette */}
      <div
        style={bgStyle}
        className="w-24 h-60 rounded-lg p-2 flex flex-col justify-between shadow-md relative overflow-hidden transition-transform duration-200 group-hover:scale-[1.03] border border-black/10"
      >
        {/* Real Christmas decorative graphics overlay on corners */}
        {decor && (
          <>
            <div className="absolute top-1 left-1 text-[10px] pointer-events-none drop-shadow z-10">{decor.tl}</div>
            <div className="absolute top-1 right-1 text-[10px] pointer-events-none drop-shadow z-10">{decor.tr}</div>
            <div className="absolute bottom-1 left-1 text-[11px] pointer-events-none drop-shadow z-10">{decor.bl}</div>
            <div className="absolute bottom-1 right-1 text-[11px] pointer-events-none drop-shadow z-10">{decor.br}</div>
          </>
        )}

        {/* Top title label */}
        <div
          style={{ color: frame.captionColor }}
          className="text-[8px] font-bold text-center tracking-wider truncate uppercase opacity-80"
        >
          {frame.englishTitle || frame.name}
        </div>

        {/* Slot Silhouettes */}
        <div className="flex-1 my-1.5 flex flex-col justify-between">
          {layout.id === 'fourCut' ? (
            <div className="flex flex-col gap-1.5 h-full justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: Math.min(frame.slotCornerRadius / 3, 3),
                    borderColor: frame.slotBorderColor || 'transparent',
                    borderWidth: frame.slotBorderWidth > 0 ? 1 : 0,
                  }}
                  className="w-full flex-1 bg-black/40 border"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: Math.min(frame.slotCornerRadius / 3, 2),
                    borderColor: frame.slotBorderColor || 'transparent',
                    borderWidth: frame.slotBorderWidth > 0 ? 1 : 0,
                  }}
                  className="w-full h-full bg-black/40 border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom title */}
        <div
          style={{ color: frame.captionColor }}
          className="text-[8px] font-semibold text-center truncate opacity-80 uppercase"
        >
          {frame.englishTitle || 'PHOTO STRIP'}
        </div>
      </div>

      {/* Card Text Info */}
      <div className="mt-2 text-center w-full">
        <h4 className="text-xs font-semibold text-white/95 truncate">{frame.name}</h4>
      </div>
    </div>
  )
}
