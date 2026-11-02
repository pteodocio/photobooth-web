import React from 'react'
import type { FilterOption, PhotoFilter } from '../../core/types'
import { Sparkles } from 'lucide-react'
import { sound } from '../../services/soundService'

interface FilterPickerProps {
  selectedFilter: PhotoFilter
  onSelectFilter: (filter: PhotoFilter) => void
}

export const FILTERS: FilterOption[] = [
  { id: 'none', displayName: '오리지널', description: 'Original Crisp', cssFilter: 'none' },
  { id: 'mono', displayName: '모노 흑백', description: 'Photoism Noir', cssFilter: 'grayscale(100%) contrast(115%)' },
  { id: 'haruBlue', displayName: '하루블루', description: 'Haru High-Key', cssFilter: 'contrast(106%) brightness(106%) saturate(85%) hue-rotate(6deg)' },
  { id: 'warmFilm', displayName: '웜 필름', description: 'Warm 90s Film', cssFilter: 'sepia(25%) contrast(100%) brightness(102%) saturate(115%)' },
]

export const FilterPicker: React.FC<FilterPickerProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-white/80">
        <Sparkles size={13} className="text-[#FF385C]" />
        <span>인화 필터 STUDIO FILTER</span>
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
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1E1E28] border-[#FF385C] text-white ring-1 ring-[#FF385C] shadow-lg'
                  : 'bg-[#131318] border-[#22222D] text-white/60 hover:bg-[#1A1A22] hover:text-white'
              }`}
            >
              <span className="text-xs font-bold font-sans">{f.displayName}</span>
              <span className="text-[10px] text-white/40 font-mono mt-0.5">{f.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
