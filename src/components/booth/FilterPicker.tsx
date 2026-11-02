import React from 'react'
import type { FilterOption, PhotoFilter } from '../../core/types'
import { Sparkles } from 'lucide-react'
import { sound } from '../../services/soundService'

interface FilterPickerProps {
  selectedFilter: PhotoFilter
  onSelectFilter: (filter: PhotoFilter) => void
}

export const FILTERS: FilterOption[] = [
  { id: 'none', displayName: 'Original', description: 'Natural Tone', cssFilter: 'none' },
  { id: 'mono', displayName: 'B&W Mono', description: 'Classic Noir', cssFilter: 'grayscale(100%) contrast(115%)' },
  { id: 'haruBlue', displayName: 'Haru Blue', description: 'Cool High-Key', cssFilter: 'contrast(106%) brightness(106%) saturate(85%) hue-rotate(6deg)' },
  { id: 'warmFilm', displayName: 'Warm Film', description: 'Warm Retro', cssFilter: 'sepia(25%) contrast(100%) brightness(102%) saturate(115%)' },
]

export const FilterPicker: React.FC<FilterPickerProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
        <Sparkles size={13} className="text-[#FF385C]" />
        <span>Photo Filter</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {FILTERS.map(f => {
          const isSelected = selectedFilter === f.id
          return (
            <button
              key={f.id}
              onClick={() => {
                sound.playClick()
                onSelectFilter(f.id)
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white/10 border-[#FF385C] text-white ring-1 ring-[#FF385C]'
                  : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold">{f.displayName}</span>
              <span className="text-[10px] text-white/40 mt-0.5">{f.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
