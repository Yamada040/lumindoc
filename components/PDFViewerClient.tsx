'use client'

import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X, Brain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

interface PDFViewerClientProps {
  fileUrl: string
  fileName: string
  onClose?: () => void
  isModal?: boolean
  onSummarize?: () => void
  isSummarizing?: boolean
  showSummarizeButton?: boolean
}

export function PDFViewerClient({ 
  fileUrl, 
  fileName, 
  onClose, 
  isModal = false,
  onSummarize,
  isSummarizing = false,
  showSummarizeButton = false
}: PDFViewerClientProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setIsLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setIsLoading(false)
  }

  const goToPrevPage = () => setPageNumber(page => Math.max(1, page - 1))
  const goToNextPage = () => setPageNumber(page => Math.min(numPages, page + 1))
  const zoomIn = () => setScale(scale => Math.min(2.0, scale + 0.2))
  const zoomOut = () => setScale(scale => Math.max(0.5, scale - 0.2))

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const content = (
    <div className={cn(
      "bg-white rounded-lg shadow-2xl",
      isModal ? "max-w-4xl max-h-[90vh] mx-auto" : "w-full h-full"
    )}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
          {fileName}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          {showSummarizeButton && onSummarize && (
            <button
              onClick={onSummarize}
              disabled={isSummarizing}
              className="p-2 hover:bg-purple-200 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1"
              title="AI要約を生成"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">要約中...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-xs">AI要約</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDFコンテンツ */}
      <div className="flex-1 overflow-auto bg-gray-100 relative">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            <span className="ml-3 text-gray-600">PDFを読み込んでいます...</span>
          </div>
        )}

        <div className="flex justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="shadow-lg"
          >
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
            </Document>
          </motion.div>
        </div>
      </div>

      {/* フッター */}
      {!isLoading && numPages > 0 && (
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            前のページ
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {pageNumber} / {numPages}
            </span>
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= numPages) {
                  setPageNumber(page)
                }
              }}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
            />
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            次のページ
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return content
}