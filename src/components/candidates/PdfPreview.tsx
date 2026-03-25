'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface PdfPreviewProps {
  src: string
  title?: string
  height?: number
}

export function PdfPreview({ src, title = 'PDFプレビュー', height = 480 }: PdfPreviewProps) {
  const [zoom, setZoom] = useState(1)

  const ZOOM_STEP = 0.25
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 3

  function zoomIn() { setZoom(z => Math.min(z + ZOOM_STEP, ZOOM_MAX)) }
  function zoomOut() { setZoom(z => Math.max(z - ZOOM_STEP, ZOOM_MIN)) }
  function reset() { setZoom(1) }

  return (
    <div>
      {/* ズームコントロール */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 border-b border-gray-200">
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
          title="縮小"
        >
          <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors min-w-[3rem] text-center"
          title="リセット"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
          title="拡大"
        >
          <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="p-1 rounded hover:bg-gray-200 transition-colors ml-1"
          title="リセット"
        >
          <RotateCcw className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* PDFビューワー */}
      <div
        className="overflow-auto bg-gray-50"
        style={{ height: `${height}px` }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${height / zoom}px`,
          }}
        >
          <iframe
            src={src}
            title={title}
            style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
          />
        </div>
      </div>
    </div>
  )
}
