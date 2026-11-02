import React, { useState } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { FilterPicker, FILTERS } from './FilterPicker'
import { StampPicker } from './StampPicker'
import { renderStrip } from '../../services/compositorService'
import { SyncService } from '../../services/syncService'
import { PrintFormat } from '../../core/types'
import { Printer, Lock, CheckCircle2, ArrowLeftRight, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
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
    <div className="w-full min-h-screen bg-[#0A0A0E] text-[#F3F3F6] p-4 sm:p-6 flex flex-col justify-between max-w-5xl mx-auto select-none">
      {/* Header with Upfront Frame Lock Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C1C26]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF385C] uppercase tracking-wider mb-1">
            <SlidersHorizontal size={13} />
            <span>DARKROOM LIGHTBOX · 작업대</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            포토 스트립 커스텀
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#181822] text-[#B0B0C0] font-medium border border-[#262635]">
              {selectedPhotoIds.length}/{targetCount} Selected
            </span>
          </h2>
          <p className="text-xs text-[#808092] mt-0.5 font-mono">
            마음에 드는 사진 {targetCount}장을 선택하고 슬롯 순서를 자유롭게 조정하세요.
          </p>
        </div>

        {/* Upfront Frame Lock Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14141B] border border-[#242432] text-xs font-mono self-start sm:self-auto shadow-sm">
          <Lock size={13} className="text-[#FF385C]" />
          <span className="text-[#808092]">프레임 고정:</span>
          <span className="font-bold text-white">{selectedFrame.name}</span>
          <span className="text-[#A0A0B0]">· {selectedLayout.displayName}</span>
        </div>
      </div>

      {/* Main Selection Area */}
      <div className="my-5 space-y-6">
        {/* Reorderable Strip Tray (Light Table) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121218] border border-[#20202C] darkroom-grid">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-mono font-bold text-white/90 flex items-center gap-2">
              <ArrowLeftRight size={14} className="text-[#FF385C]" />
              스트립 출력 순서 (순서 바꾸기)
            </span>
            <span className="text-[11px] font-mono text-white/40">좌우 버튼으로 순서 변경</span>
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
                  {/* Slot order badge */}
                  <div className="absolute top-1.5 left-1.5 bg-[#FF385C] text-white text-[10px] font-mono font-black w-5 h-5 rounded-md flex items-center justify-center shadow">
                    {idx + 1}
                  </div>
                  {/* Reorder Buttons */}
                  <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between opacity-85 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveLeft(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded-md bg-black/80 hover:bg-black text-white/90 disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      onClick={() => handleMoveRight(idx)}
                      disabled={idx === selectedPhotoIds.length - 1}
                      className="p-1 rounded-md bg-black/80 hover:bg-black text-white/90 disabled:opacity-20 cursor-pointer"
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
          <h3 className="text-xs font-mono font-bold text-white/80 mb-2.5">
            촬영된 전체 사진 (터치하여 선택/해제)
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
                      : 'border-[#22222E] opacity-65 hover:opacity-100 bg-[#14141B]'
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
                    <div className="absolute bottom-1.5 left-1.5 bg-black/85 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #{selectedIdx + 1}
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 font-mono text-[9px] text-white/50 bg-black/60 px-1 rounded">
                    0{i + 1}
                  </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#121218] border border-[#20202C]">
          <div>
            <span className="text-xs font-mono font-bold text-white">인화 포맷 PRINT FORMAT</span>
            <p className="text-[11px] text-[#808090] mt-0.5 font-mono">
              트윈 스트립(1+1) 선택 시 친구와 나눌 수 있는 2장 듀얼 인쇄물로 출력됩니다.
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-[#0A0A0D] rounded-xl border border-[#22222D]">
            <button
              onClick={() => {
                sound.playClick()
                setPrintFormat(PrintFormat.singleStrip)
              }}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedPrintFormat.id === 'singleStrip'
                  ? 'bg-white text-black shadow-md'
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
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedPrintFormat.id === 'twinStrip'
                  ? 'bg-[#FF385C] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Twin Strip (1+1)
            </button>
          </div>
        </div>
      </div>

      {/* Footer CTA Bar */}
      <div className="pt-4 border-t border-[#1C1C26] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-mono text-[#808090]">
          {isReadyToPrint
            ? '준비 완료! 아래 버튼을 눌러 인화하세요.'
            : `${targetCount - selectedPhotoIds.length}장의 사진을 더 선택해주세요.`}
        </span>

        <button
          onClick={handlePrint}
          disabled={!isReadyToPrint || isCompositing}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-bold text-xs tracking-wider shadow-xl shadow-[#FF385C]/25 transition-all transform active:scale-95 cursor-pointer"
        >
          <Printer size={16} />
          <span>{isCompositing ? '인화 렌더링 중...' : '인화하기 Print Film'}</span>
        </button>
      </div>
    </div>
  )
}
