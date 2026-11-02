import React from 'react'
import { FilterOption, PhotoFilter } from '../../core/types'
import { Wand2 } from 'lucide-react'

interface FilterPickerProps {
  selectedFilter: PhotoFilter
  onSelectFilter: (filter: PhotoFilter) => void
}

export const FILTERS: FilterOption[] = [
  { id: 'none', displayName: '오리지널', description: 'Original Crisp', cssFilter: 'none' },
  { id: 'mono', displayName: '모노 흑백', description: 'Classic Noir B&W', cssFilter: 'grayscale(100%) contrast(110%)' },
  { id: 'haruBlue', displayName: '하루블루', description: 'Haru High-Key Blue', cssFilter: 'contrast(105%) brightness(105%) saturate(85%) hue-rotate(5deg)' },
  { id: 'warmFilm', displayName: '웜 필름', description: 'Warm 90s Film', cssFilter: 'sepia(28%) contrast(98%) brightness(102%) saturate(110%)' },
]

export const FilterPicker: React.FC<FilterPickerProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
        <Wand2 size={14} className="text-[#FF5252]" />
        <span>필터 선택 Photo Filter</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FILTERS.map(f => {
          const isSelected = selectedFilter === f.id
          return (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-[#FF5252]/15 border-[#FF5252] text-white ring-1 ring-[#FF5252]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
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
