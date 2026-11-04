import React, { useState } from 'react'
import type { PhotoFilter } from '../../core/types'
import { PHOTO_FILTERS, FILTER_CATEGORIES } from '../../core/filters'
import { Sparkles, Sliders, RotateCcw } from 'lucide-react'
import { sound } from '../../services/soundService'
import { useBoothStore } from '../../store/useBoothStore'

interface FilterPickerProps {
  selectedFilter: PhotoFilter
  onSelectFilter: (filter: PhotoFilter) => void
}

// Re-export for compatibility with tests
export const FILTERS = PHOTO_FILTERS

export const FilterPicker: React.FC<FilterPickerProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  const { filterIntensity, setFilterIntensity } = useBoothStore()
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredList =
    activeCategory === 'all'
      ? PHOTO_FILTERS
      : PHOTO_FILTERS.filter(f => f.category === activeCategory || f.id === 'none')

  const isFiltered = selectedFilter !== 'none'

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs select-none">
      {/* Header with Reset and Intensity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#FF4D6D]" />
          <span className="text-xs font-semibold text-[#1C1917]">
            Photo Filters (40 Styles)
          </span>
          {isFiltered && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF0F3] text-[#FF4D6D] font-medium border border-[#FF4D6D]/20">
              Active
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              onSelectFilter('none')
              setFilterIntensity(1.0)
            }}
            className="flex items-center gap-1 text-[11px] text-[#78716C] hover:text-[#1C1917] transition-colors duration-150 cursor-pointer self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <RotateCcw size={11} />
            <span>Reset to Original</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {FILTER_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveCategory(cat.id)
            }}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeCategory === cat.id
                ? 'bg-[#1C1917] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EC] border border-black/[0.04]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Intensity Slider (Visible when any filter is active) */}
      {isFiltered && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-black/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-[#1C1917] font-medium min-w-[110px]">
            <Sliders size={13} className="text-[#FF4D6D]" />
            <span>Filter Intensity: {Math.round(filterIntensity * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filterIntensity}
            onChange={e => setFilterIntensity(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF4D6D] h-1.5 bg-black/[0.06] rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          />

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setFilterIntensity(1.0)
            }}
            className="text-[11px] text-[#78716C] hover:text-[#1C1917] transition-colors duration-150 px-2 py-0.5 rounded bg-white border border-black/[0.06] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            100%
          </button>
        </div>
      )}

      {/* Filter Swatches Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
        {filteredList.map(filter => {
          const isSelected = selectedFilter === filter.id

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                sound.playClick()
                onSelectFilter(filter.id)
              }}
              className={`flex flex-col items-center justify-between p-2 rounded-xl text-center transition-[transform,opacity,border-color,background-color] duration-150 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                isSelected
                  ? 'bg-white border-[#FF4D6D] ring-2 ring-[#FF4D6D]/20 shadow-xs'
                  : 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:bg-[#FDFBF7]'
              }`}
            >
              {/* Filter swatch bubble */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 mb-1.5 relative shadow-xs">
                <div
                  className="w-full h-full bg-gradient-to-tr from-amber-100 via-rose-100 to-sky-100"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#FF4D6D]/10 border-2 border-[#FF4D6D] rounded-full" />
                )}
              </div>

              <span className="text-[10px] font-medium text-[#1C1917] truncate w-full leading-tight">
                {filter.displayName}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
