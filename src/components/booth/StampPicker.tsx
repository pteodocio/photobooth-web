import React from 'react'
import { KOREAN_STAMPS } from '../../core/stamps'
import { Bookmark } from 'lucide-react'
import { sound } from '../../services/soundService'

interface StampPickerProps {
  selectedStamp: string
  onSelectStamp: (stampText: string) => void
}

export const StampPicker: React.FC<StampPickerProps> = ({
  selectedStamp,
  onSelectStamp,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
        <Bookmark size={13} className="text-[#FF4D6D]" />
        <span>Stickers</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {KOREAN_STAMPS.map(stamp => {
          const isSelected = selectedStamp === stamp.text
          return (
            <button
              key={stamp.id}
              onClick={() => {
                sound.playClick()
                onSelectStamp(stamp.text)
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-[transform,colors] duration-150 truncate text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                isSelected
                  ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-xs'
                  : 'bg-white border-black/[0.06] text-[#78716C] hover:bg-[#F4F1EC] hover:text-[#1C1917]'
              }`}
            >
              {stamp.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
