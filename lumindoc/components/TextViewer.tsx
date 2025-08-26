'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, Download, Brain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextViewerProps {
  fileUrl: string
  fileName: string
  onClose?: () => void
  isModal?: boolean
  onSummarize?: () => void
  isSummarizing?: boolean
  showSummarizeButton?: boolean
}

export function TextViewer({ 
  fileUrl, 
  fileName, 
  onClose, 
  isModal = false,
  onSummarize,
  isSummarizing = false,
  showSummarizeButton = false
}: TextViewerProps) {
  const [content, setContent] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadTextContent = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error('ファイルの読み込みに失敗しました')
        }
        const text = await response.text()
        setContent(text)
      } catch (err) {
        console.error('Text loading error:', err)
        setError(err instanceof Error ? err.message : 'ファイルの読み込みエラー')
      } finally {
        setIsLoading(false)
      }
    }

    loadTextContent()
  }, [fileUrl])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const viewerContent = (
    <div className={cn(
      "bg-white rounded-lg shadow-2xl",
      isModal ? "max-w-4xl max-h-[90vh] mx-auto" : "w-full h-full"
    )}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500">テキストファイル</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {showSummarizeButton && onSummarize && (
            <button
              onClick={onSummarize}
              disabled={isSummarizing}
              className="px-3 py-2 hover:bg-purple-200 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
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
            title="ダウンロード"
          >
            <Download className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* テキストコンテンツ */}
      <div className="flex-1 overflow-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <span className="text-gray-600">テキストを読み込んでいます...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">
              <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
            {content}
          </pre>
        )}
      </div>

      {/* フッター */}
      <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
        <div className="text-sm text-gray-600">
          文字数: {content.length.toLocaleString()} 文字
        </div>
      </div>
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
            {viewerContent}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return viewerContent
}