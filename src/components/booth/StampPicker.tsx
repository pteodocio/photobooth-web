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
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
        <Bookmark size={13} className="text-[#FF385C]" />
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
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all truncate text-center cursor-pointer ${
                isSelected
                  ? 'bg-white text-black border-white shadow-md scale-105'
                  : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
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
