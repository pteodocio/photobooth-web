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
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 select-none">
      {/* Header with Reset and Intensity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#FF385C]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Photo Filters (40 Styles)
          </span>
          {isFiltered && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF385C]/20 text-[#FF385C] font-semibold">
              Active
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={() => {
              sound.playClick()
              onSelectFilter('none')
              setFilterIntensity(1.0)
            }}
            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={12} />
            <span>Reset to Original</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {FILTER_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              sound.playClick()
              setActiveCategory(cat.id)
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-white text-black font-semibold shadow'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Intensity Slider (Visible when any filter is active) */}
      {isFiltered && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium min-w-[110px]">
            <Sliders size={13} className="text-[#FF385C]" />
            <span>Intensity: {Math.round(filterIntensity * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filterIntensity}
            onChange={e => setFilterIntensity(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF385C] h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />

          <button
            onClick={() => {
              sound.playClick()
              setFilterIntensity(1.0)
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer"
          >
            100%
          </button>
        </div>
      )}

      {/* Scrollable Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1">
        {filteredList.map(f => {
          const isSelected = selectedFilter === f.id
          return (
            <button
              key={f.id}
              onClick={() => {
                sound.playClick()
                onSelectFilter(f.id)
              }}
              className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white/15 border-[#FF385C] text-white ring-2 ring-[#FF385C]/60 scale-[1.02] shadow-md'
                  : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {/* Miniature gradient preview swatch */}
              <div
                style={{ background: f.previewGradient }}
                className="w-full h-8 rounded-lg mb-1.5 shadow-inner border border-white/10 flex items-center justify-center text-[9px] font-bold text-white/90"
              >
                {f.id === 'none' ? 'RAW' : 'FX'}
              </div>

              <span className="text-[11px] font-bold truncate w-full">{f.displayName}</span>
              <span className="text-[9px] text-white/40 truncate w-full mt-0.5">{f.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
