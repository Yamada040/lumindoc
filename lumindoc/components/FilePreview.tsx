'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  File, 
  X, 
  Upload, 
  Trash2, 
  Eye,
  FileIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Save,
  XCircle,
  Zap,
  Brain
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface FilePreviewProps {
  file: File
  onConfirm: (file: File) => void
  onConfirmWithSummary: (file: File) => void
  onCancel: () => void
  isUploading?: boolean
  isSummarizing?: boolean
}

export function FilePreview({ 
  file, 
  onConfirm, 
  onConfirmWithSummary,
  onCancel, 
  isUploading = false,
  isSummarizing = false 
}: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPreview()
  }, [file])

  const loadPreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (file.type === 'text/plain') {
        // テキストファイルの場合
        const text = await file.text()
        setTextContent(text)
        setPreview('text')
      } else if (file.type === 'application/pdf') {
        // PDFファイルの場合
        const url = URL.createObjectURL(file)
        setPreview(url)
      } else {
        setError('対応していないファイル形式です')
      }
    } catch (err) {
      setError('ファイルの読み込みに失敗しました')
      console.error('Preview error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = () => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    return <File className="w-8 h-8 text-blue-500" />
  }

  const getFileTypeLabel = () => {
    if (file.type === 'application/pdf') return 'PDF'
    if (file.type === 'text/plain') return 'テキスト'
    return 'ファイル'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-xl font-bold">ファイルプレビュー</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ファイル情報 */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            {getFileIcon()}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{file.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <FileIcon className="w-4 h-4 mr-1" />
                  {getFileTypeLabel()}
                </span>
                <span>{formatFileSize(file.size)}</span>
                <span>{new Date(file.lastModified).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* プレビューエリア */}
        <div className="h-96 overflow-auto bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">プレビューを読み込んでいます...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {file.type === 'text/plain' && (
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-white p-4 rounded-lg border">
                    {textContent.length > 5000 
                      ? `${textContent.substring(0, 5000)}...\n\n[以下省略 - 全文は保存後に確認できます]`
                      : textContent
                    }
                  </pre>
                </div>
              )}
              {file.type === 'application/pdf' && preview && (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                  <iframe
                    src={preview}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* アクションボタン */}
        <div className="px-6 py-4 bg-white border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {!error && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>ファイルの準備ができました</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={isUploading || isSummarizing}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>キャンセル</span>
              </button>
              <button
                onClick={() => onConfirm(file)}
                disabled={isUploading || isSummarizing || !!error}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>保存のみ</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onConfirmWithSummary(file)}
                disabled={isUploading || isSummarizing || !!error}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                    <span className="relative z-10">AI要約中...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">保存してAI要約</span>
                    <Zap className="w-3 h-3 absolute top-1 right-1 text-yellow-300 animate-pulse" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}