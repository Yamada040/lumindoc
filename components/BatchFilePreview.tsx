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
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  FolderOpen,
  Brain,
  Zap
} from 'lucide-react'
import { formatFileSize, cn } from '@/lib/utils'

interface BatchFilePreviewProps {
  files: File[]
  onConfirmAll: (files: File[]) => void
  onConfirmAllWithSummary: (files: File[]) => void
  onConfirmSingle: (file: File) => void
  onConfirmSingleWithSummary: (file: File) => void
  onRemoveFile: (index: number) => void
  onCancel: () => void
  isUploading?: boolean
  isSummarizing?: boolean
  uploadProgress?: { [key: string]: number }
  summaryProgress?: { [key: string]: boolean }
}

type ViewMode = 'grid' | 'list'

export function BatchFilePreview({ 
  files, 
  onConfirmAll,
  onConfirmAllWithSummary,
  onConfirmSingle,
  onConfirmSingleWithSummary,
  onRemoveFile,
  onCancel, 
  isUploading = false,
  isSummarizing = false,
  uploadProgress = {},
  summaryProgress = {}
}: BatchFilePreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [previews, setPreviews] = useState<{ [key: number]: string }>({})
  const [textContents, setTextContents] = useState<{ [key: number]: string }>({})
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({})
  const [errors, setErrors] = useState<{ [key: number]: string }>({})
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [uploadingFiles, setUploadingFiles] = useState<Set<number>>(new Set())

  useEffect(() => {
    files.forEach((file, index) => {
      loadPreview(file, index)
    })
  }, [files])

  const loadPreview = async (file: File, index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: true }))
    setErrors(prev => ({ ...prev, [index]: '' }))

    try {
      if (file.type === 'text/plain') {
        const text = await file.text()
        setTextContents(prev => ({ ...prev, [index]: text }))
        setPreviews(prev => ({ ...prev, [index]: 'text' }))
      } else if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file)
        setPreviews(prev => ({ ...prev, [index]: url }))
      } else {
        setErrors(prev => ({ ...prev, [index]: '対応していないファイル形式です' }))
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [index]: 'ファイルの読み込みに失敗しました' }))
      console.error('Preview error:', err)
    } finally {
      setLoadingStates(prev => ({ ...prev, [index]: false }))
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />
    }
    return <File className="w-6 h-6 text-blue-500" />
  }

  const getFileTypeLabel = (file: File) => {
    if (file.type === 'application/pdf') return 'PDF'
    if (file.type === 'text/plain') return 'テキスト'
    return 'ファイル'
  }

  const handleSingleUpload = async (index: number, withSummary: boolean = false) => {
    setUploadingFiles(prev => new Set(prev).add(index))
    if (withSummary) {
      await onConfirmSingleWithSummary(files[index])
    } else {
      await onConfirmSingle(files[index])
    }
    setUploadingFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const currentFile = files[selectedIndex]
  const currentPreview = previews[selectedIndex]
  const currentTextContent = textContents[selectedIndex]
  const currentError = errors[selectedIndex]
  const currentLoading = loadingStates[selectedIndex]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* サイドバー - ファイルリスト */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* サイドバーヘッダー */}
          <div className="px-4 py-3 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">
                  {files.length}個のファイル
                </span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1 rounded",
                    viewMode === 'list' ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1 rounded",
                    viewMode === 'grid' ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ファイルリスト */}
          <div className="flex-1 overflow-y-auto p-2">
            {viewMode === 'list' ? (
              <div className="space-y-1">
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedIndex === index 
                        ? "bg-blue-100 border border-blue-300" 
                        : "hover:bg-gray-100 border border-transparent"
                    )}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      {uploadingFiles.has(index) ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : uploadProgress[file.name] === 100 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFile(index)
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all flex flex-col items-center",
                      selectedIndex === index 
                        ? "bg-blue-100 border border-blue-300" 
                        : "hover:bg-gray-100 border border-transparent"
                    )}
                    onClick={() => setSelectedIndex(index)}
                  >
                    {getFileIcon(file)}
                    <p className="text-xs text-center mt-2 truncate w-full">
                      {file.name}
                    </p>
                    {uploadingFiles.has(index) && (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500 mt-1" />
                    )}
                    {uploadProgress[file.name] === 100 && (
                      <CheckCircle className="w-3 h-3 text-green-500 mt-1" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="p-4 border-t bg-white space-y-2">
            <button
              onClick={() => onConfirmAll(files)}
              disabled={isUploading || isSummarizing || files.length === 0}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>すべて保存</span>
                </>
              )}
            </button>
            <button
              onClick={() => onConfirmAllWithSummary(files)}
              disabled={isUploading || isSummarizing || files.length === 0}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 relative overflow-hidden group"
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
                  <span className="relative z-10">すべてAI要約</span>
                  <Zap className="w-3 h-3 absolute top-2 right-2 text-yellow-300 animate-pulse" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* メインコンテンツ - プレビュー */}
        <div className="flex-1 flex flex-col">
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

          {/* ファイル情報バー */}
          {currentFile && (
            <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getFileIcon(currentFile)}
                <div>
                  <h3 className="font-semibold text-gray-900">{currentFile.name}</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span>{getFileTypeLabel(currentFile)}</span>
                    <span>{formatFileSize(currentFile.size)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  {selectedIndex + 1} / {files.length}
                </span>
                <button
                  onClick={() => setSelectedIndex(Math.min(files.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === files.length - 1}
                  className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* プレビューエリア */}
          <div className="flex-1 overflow-auto bg-white">
            {currentLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">プレビューを読み込んでいます...</span>
              </div>
            ) : currentError ? (
              <div className="flex flex-col items-center justify-center h-full">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-red-600">{currentError}</p>
              </div>
            ) : (
              <>
                {currentFile?.type === 'text/plain' && currentTextContent && (
                  <div className="p-6">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                      {currentTextContent.length > 5000 
                        ? `${currentTextContent.substring(0, 5000)}...\n\n[以下省略 - 全文は保存後に確認できます]`
                        : currentTextContent
                      }
                    </pre>
                  </div>
                )}
                {currentFile?.type === 'application/pdf' && currentPreview && (
                  <iframe
                    src={currentPreview}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                )}
              </>
            )}
          </div>

          {/* 個別アクションボタン */}
          {currentFile && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {!currentError && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>ファイルの準備ができました</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSingleUpload(selectedIndex, false)}
                    disabled={uploadingFiles.has(selectedIndex) || summaryProgress[currentFile.name] || !!currentError}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {uploadingFiles.has(selectedIndex) ? (
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
                    onClick={() => handleSingleUpload(selectedIndex, true)}
                    disabled={uploadingFiles.has(selectedIndex) || summaryProgress[currentFile.name] || !!currentError}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {summaryProgress[currentFile.name] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                        <span className="relative z-10">AI要約中...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">保存してAI要約</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}