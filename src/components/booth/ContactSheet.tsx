import React, { useState } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { FilterPicker, FILTERS } from './FilterPicker'
import { StampPicker } from './StampPicker'
import { renderStrip } from '../../services/compositorService'
import { SyncService } from '../../services/syncService'
import { PrintFormat } from '../../core/types'
import { Printer, Lock, CheckCircle2, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'

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
    setIsCompositing(true)

    try {
      // Collect photo data URLs in order of selectedPhotoIds
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

      // Upload session to Supabase in background
      SyncService.uploadSession(
        sessionId,
        compositeUrl,
        selectedFrame.name,
        selectedFrame.koreanTitle,
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
    if (index > 0) reorderSelectedPhotos(index, index - 1)
  }

  const handleMoveRight = (index: number) => {
    if (index < selectedPhotoIds.length - 1) reorderSelectedPhotos(index, index + 1)
  }

  return (
    <div className="w-full min-h-screen bg-[#0F0F12] text-white p-4 sm:p-6 flex flex-col justify-between max-w-5xl mx-auto select-none">
      {/* Header with Upfront Frame Lock Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            포토 스트립 커스텀
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 font-normal">
              {selectedPhotoIds.length}/{targetCount} Selected
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            마음에 드는 사진 {targetCount}장을 선택하고 순서를 지정하세요.
          </p>
        </div>

        {/* Upfront Frame Lock Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-xs self-start sm:self-auto">
          <Lock size={13} className="text-[#FF5252]" />
          <span className="text-white/60">프레임 고정:</span>
          <span className="font-semibold text-white">{selectedFrame.name}</span>
          <span className="text-white/40">· {selectedLayout.displayName}</span>
        </div>
      </div>

      {/* Main Selection Area */}
      <div className="my-4 space-y-6">
        {/* Reorderable Strip Tray */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <ArrowLeftRight size={14} className="text-[#FF5252]" />
              스트립 출력 순서 (순서 바꾸기)
            </span>
            <span className="text-[11px] text-white/40">좌우 버튼으로 순서 변경</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {selectedPhotoIds.map((photoId, idx) => {
              const photo = capturedPhotos.find(p => p.id === photoId)
              if (!photo) return null

              return (
                <div
                  key={photoId}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-[#FF5252] bg-black shadow-md flex flex-col justify-between group"
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Selection ${idx + 1}`}
                    style={{ filter: activeCssFilter }}
                    className="w-full h-full object-cover"
                  />
                  {/* Index badge */}
                  <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {idx + 1}
                  </div>
                  {/* Reorder Buttons */}
                  <div className="absolute bottom-1 inset-x-1 flex justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveLeft(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-black/70 hover:bg-black text-white/80 disabled:opacity-30"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveRight(idx)}
                      disabled={idx === selectedPhotoIds.length - 1}
                      className="p-1 rounded bg-black/70 hover:bg-black text-white/80 disabled:opacity-30"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* All Captured Photos Selector Grid */}
        <div>
          <h3 className="text-xs font-semibold text-white/70 mb-2">촬영된 전체 사진 (터치하여 선택/해제)</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {capturedPhotos.map((photo, i) => {
              const isSelected = selectedPhotoIds.includes(photo.id)
              const selectedIdx = selectedPhotoIds.indexOf(photo.id)

              return (
                <div
                  key={photo.id}
                  onClick={() => togglePhotoSelection(photo.id)}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-[#FF5252] ring-2 ring-[#FF5252]/50 scale-[1.02]'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Shot ${i + 1}`}
                    style={{ filter: activeCssFilter }}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-[#FF5252] text-white p-0.5 rounded-full shadow">
                      <CheckCircle2 size={14} />
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

        {/* Print Format Switcher (Single Strip vs Twin Strip 1+1) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#141418] border border-white/5">
          <div>
            <span className="text-xs font-semibold text-white">인화 포맷 Print Format:</span>
            <p className="text-[11px] text-white/50 mt-0.5">트윈 스트립(1+1) 선택 시 친구와 나눌 수 있는 2장 듀얼 인쇄물로 출력됩니다.</p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              onClick={() => setPrintFormat(PrintFormat.singleStrip)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPrintFormat.id === 'singleStrip'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Single Strip
            </button>
            <button
              onClick={() => setPrintFormat(PrintFormat.twinStrip)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPrintFormat.id === 'twinStrip'
                  ? 'bg-[#FF5252] text-white font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Twin Strip (1+1)
            </button>
          </div>
        </div>
      </div>

      {/* Footer CTA Bar */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-white/60">
          {isReadyToPrint
            ? '준비 완료! 아래 버튼을 눌러 인화하세요.'
            : `${targetCount - selectedPhotoIds.length}장의 사진을 더 선택해주세요.`}
        </span>

        <button
          onClick={handlePrint}
          disabled={!isReadyToPrint || isCompositing}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#FF5252] hover:bg-[#FF3838] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-[#FF5252]/25 transition-all transform active:scale-95"
        >
          <Printer size={18} />
          {isCompositing ? '인화 렌더링 중...' : '인화하기 Print Film'}
        </button>
      </div>
    </div>
  )
}
