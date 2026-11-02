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
      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-white/80">
        <Bookmark size={13} className="text-[#FF385C]" />
        <span>한글 감성 스탬프 KOREAN STICKER</span>
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
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all truncate text-center cursor-pointer ${
                isSelected
                  ? 'bg-[#F6F4EE] text-[#121216] border-[#F6F4EE] shadow-lg transform -rotate-1 scale-105'
                  : 'bg-[#131318] border-[#22222D] text-white/70 hover:bg-[#1A1A22] hover:text-white'
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
