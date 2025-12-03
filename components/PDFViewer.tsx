'use client'

import dynamic from 'next/dynamic'
import React from 'react'
import { FileText } from 'lucide-react'

// ブラウザ専用のPDFViewerClientをdynamicインポートでSSRを無効化
const PDFViewerClient = dynamic(
  () => import('./PDFViewerClient').then(mod => ({ default: mod.PDFViewerClient })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
            <span className="text-gray-600">PDFビューアを読み込んでいます...</span>
          </div>
        </div>
      </div>
    )
  }
)

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  onClose?: () => void
  isModal?: boolean
  onSummarize?: () => void
  isSummarizing?: boolean
  showSummarizeButton?: boolean
}

export function PDFViewer({ 
  fileUrl, 
  fileName, 
  onClose, 
  isModal = false, 
  onSummarize,
  isSummarizing = false,
  showSummarizeButton = false 
}: PDFViewerProps) {
  return (
    <PDFViewerClient
      fileUrl={fileUrl}
      fileName={fileName}
      onClose={onClose}
      isModal={isModal}
      onSummarize={onSummarize}
      isSummarizing={isSummarizing}
      showSummarizeButton={showSummarizeButton}
    />
  )
}