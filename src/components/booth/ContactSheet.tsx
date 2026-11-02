import React, { useState } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { FilterPicker, FILTERS } from './FilterPicker'
import { StampPicker } from './StampPicker'
import { renderStrip } from '../../services/compositorService'
import { SyncService } from '../../services/syncService'
import { PrintFormat } from '../../core/types'
import { Printer, Lock, CheckCircle2, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { sound } from '../../services/soundService'

export const ContactSheet: React.FC = () => {
  const {
    capturedPhotos,
    selectedPhotoIds,
    togglePhotoSelection,
    reorderSelectedPhotos,
    selectedFrame,
    selectedLayout,
    selectedPrintFormat,
    setPrintFormat,
    selectedFilter,
    setFilter,
    selectedStamp,
    setStamp,
    setCompositeDataUrl,
    sessionId,
  } = useBoothStore()

  const [isCompositing, setIsCompositing] = useState(false)

  const targetCount = selectedLayout.slotCount
  const isReadyToPrint = selectedPhotoIds.length === targetCount

  const activeFilterConfig = FILTERS.find(f => f.id === selectedFilter)
  const activeCssFilter = activeFilterConfig?.cssFilter || 'none'

  const handlePrint = async () => {
    if (!isReadyToPrint || isCompositing) return
    sound.playClick()
    setIsCompositing(true)

    try {
      const orderedPhotos = selectedPhotoIds
        .map(id => capturedPhotos.find(p => p.id === id)?.dataUrl)
        .filter((url): url is string => !!url)

      const today = new Date()
      const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

      const compositeUrl = await renderStrip({
        photoDataUrls: orderedPhotos,
        frame: selectedFrame,
        layout: selectedLayout,
        printFormat: selectedPrintFormat,
        filter: selectedFilter,
        stampText: selectedStamp,
        dateString,
        studioWatermark: 'KOREAN 4-CUT STUDIO',
        qrData: `https://photobooth.app/strip?s=${sessionId}`,
      })

      setCompositeDataUrl(compositeUrl)

      // Background cloud upload
      SyncService.uploadSession(
        sessionId,
        compositeUrl,
        selectedFrame.name,
        selectedFrame.englishTitle || selectedFrame.name,
        selectedLayout.id,
        selectedFilter,
        selectedStamp
      ).catch(() => {})
    } catch (err) {
      console.error('Failed to render strip:', err)
    } finally {
      setIsCompositing(false)
    }
  }

  const handleMoveLeft = (index: number) => {
    sound.playClick()
    if (index > 0) reorderSelectedPhotos(index, index - 1)
  }

  const handleMoveRight = (index: number) => {
    sound.playClick()
    if (index < selectedPhotoIds.length - 1) reorderSelectedPhotos(index, index + 1)
  }

  const handlePhotoClick = (id: string) => {
    sound.playClick()
    togglePhotoSelection(id)
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0E] text-[#F3F3F6] p-4 sm:p-6 flex flex-col justify-between max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            Customize Strip
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 font-normal">
              {selectedPhotoIds.length}/{targetCount} Selected
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Select {targetCount} photos and arrange them in your preferred order.
          </p>
        </div>

        {/* Frame Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs self-start sm:self-auto">
          <Lock size={13} className="text-[#FF385C]" />
          <span className="text-white/50">Frame:</span>
          <span className="font-semibold text-white">{selectedFrame.name}</span>
          <span className="text-white/40">· {selectedLayout.displayName}</span>
        </div>
      </div>

      {/* Main Selection Area */}
      <div className="my-5 space-y-6">
        {/* Reorderable Strip Tray */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/90 flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-[#FF385C]" />
              Print Order
            </span>
            <span className="text-[11px] text-white/40">Use arrows to reorder</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {selectedPhotoIds.map((photoId, idx) => {
              const photo = capturedPhotos.find(p => p.id === photoId)
              if (!photo) return null

              return (
                <div
                  key={photoId}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-[#FF385C] bg-black shadow-lg flex flex-col justify-between group transition-all"
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Selection ${idx + 1}`}
                    style={{ filter: activeCssFilter }}
                    className="w-full h-full object-cover"
                  />
                  {/* Order badge */}
                  <div className="absolute top-1.5 left-1.5 bg-[#FF385C] text-white text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center shadow">
                    {idx + 1}
                  </div>
                  {/* Reorder Buttons */}
                  <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between opacity-85 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveLeft(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded-md bg-black/80 hover:bg-black text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      onClick={() => handleMoveRight(idx)}
                      disabled={idx === selectedPhotoIds.length - 1}
                      className="p-1 rounded-md bg-black/80 hover:bg-black text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* All Captured Photos Selector Grid */}
        <div>
          <h3 className="text-xs font-semibold text-white/80 mb-2">
            All Photos (tap to select or unselect)
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {capturedPhotos.map((photo, i) => {
              const isSelected = selectedPhotoIds.includes(photo.id)
              const selectedIdx = selectedPhotoIds.indexOf(photo.id)

              return (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo.id)}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-[#FF385C] ring-2 ring-[#FF385C]/60 scale-[1.02] shadow-md'
                      : 'border-white/10 opacity-70 hover:opacity-100 bg-white/5'
                  }`}
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Shot ${i + 1}`}
                    style={{ filter: activeCssFilter }}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-[#FF385C] text-white p-0.5 rounded-full shadow">
                      <CheckCircle2 size={13} />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #{selectedIdx + 1}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Filter Picker */}
        <FilterPicker selectedFilter={selectedFilter} onSelectFilter={setFilter} />

        {/* Stamp Picker */}
        <StampPicker selectedStamp={selectedStamp} onSelectStamp={setStamp} />

        {/* Print Format Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div>
            <span className="text-xs font-semibold text-white">Print Format:</span>
            <p className="text-[11px] text-white/50 mt-0.5">
              Twin Strip (1+1) prints two duplicate strips side by side to share with friends.
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              onClick={() => {
                sound.playClick()
                setPrintFormat(PrintFormat.singleStrip)
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPrintFormat.id === 'singleStrip'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Single Strip
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setPrintFormat(PrintFormat.twinStrip)
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPrintFormat.id === 'twinStrip'
                  ? 'bg-[#FF385C] text-white font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Twin Strip (1+1)
            </button>
          </div>
        </div>
      </div>

      {/* Footer CTA Bar */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-white/50">
          {isReadyToPrint
            ? 'Ready to print!'
            : `Select ${targetCount - selectedPhotoIds.length} more photos.`}
        </span>

        <button
          onClick={handlePrint}
          disabled={!isReadyToPrint || isCompositing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xl shadow-[#FF385C]/20 transition-all active:scale-95 cursor-pointer"
        >
          <Printer size={16} />
          <span>{isCompositing ? 'Rendering...' : 'Print Strip'}</span>
        </button>
      </div>
    </div>
  )
}
