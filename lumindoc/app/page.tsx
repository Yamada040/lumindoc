'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Sparkles, ArrowRight, Github, Twitter, Mail, X } from 'lucide-react'
import { Document, DetailedSummary } from '@/types'
import { FileUpload } from '@/components/FileUpload'
import { FilePreview } from '@/components/FilePreview'
import { BatchFilePreview } from '@/components/BatchFilePreview'
import { DocumentDashboard } from '@/components/DocumentDashboard'
import { SummaryCard } from '@/components/SummaryCard'
import { PDFViewer } from '@/components/PDFViewer'
import { TextViewer } from '@/components/TextViewer'
import { ToastContainer, useToast } from '@/components/Toast'
import { supabaseService } from '@/lib/supabase'

type AppView = 'home' | 'upload' | 'dashboard' | 'summary' | 'preview'

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [currentSummary, setCurrentSummary] = useState<DetailedSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewFiles, setPreviewFiles] = useState<File[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryProgress, setSummaryProgress] = useState<{ [key: string]: boolean }>({})
  const [summarizingDocs, setSummarizingDocs] = useState<Set<string>>(new Set())
  const { toasts, showToast, removeToast, updateToast } = useToast()

  // ドキュメントを読み込み
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const docs = await supabaseService.getDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ファイル選択時のハンドラ（プレビュー表示）
  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setPreviewFiles(files)
      setShowPreview(true)
    }
  }

  // 既存ドキュメントの要約を生成
  const generateSummaryFromDocument = async (document: Document) => {
    if (!document.id || !document.public_url) {
      console.error('Document ID or public URL is missing')
      return
    }

    let toastId: string | undefined

    try {
      console.log('Starting summary generation for document:', document.original_name)
      setSummarizingDocs(prev => new Set(prev).add(document.id))
      
      // 処理中の通知を表示
      toastId = showToast({
        type: 'loading',
        title: 'AI要約を生成中...',
        message: document.original_name,
        duration: 0 // 永続的に表示
      })
      
      // ドキュメントのステータスを「処理中」に更新
      await supabaseService.updateDocumentSummary(document.id, null, 'processing')
      await loadDocuments() // UIを更新

      // ファイルをフェッチしてFormDataに追加
      const response = await fetch(document.public_url)
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`)
      }
      
      const blob = await response.blob()
      const file = new File([blob], document.original_name, { type: document.type === 'pdf' ? 'application/pdf' : 'text/plain' })
      
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('Sending request to /api/summarize')
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        body: formData
      })
      
      if (!summaryResponse.ok) {
        const errorText = await summaryResponse.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to generate summary: ${summaryResponse.status} - ${errorText}`)
      }
      
      const result = await summaryResponse.json()
      console.log('Summary API result:', result)
      
      if (result.error) {
        throw new Error(`Summary generation error: ${result.error}`)
      }
      
      if (result.summary) {
        console.log('Updating document summary in database')
        await supabaseService.updateDocumentSummary(document.id, result.summary, 'completed')
        console.log('Document summary updated successfully')
        
        // 成功通知を表示
        if (toastId) removeToast(toastId)
        showToast({
          type: 'success',
          title: 'AI要約が完了しました！',
          message: `${document.original_name} の要約を生成しました`,
          duration: 5000
        })
        
        // 成功音を再生（オプション）
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCBxyw/PQgiMFJ3/M8ti5' +
            'NwUZaLXs56hUFApGn+DyvmwhCBxyw/PQgiMFJ3/M8ti5ODcFGWi15+epVBQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDcGGWi15+epVBQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDcGGWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDcHGWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDg4GWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDg4GWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDg4GWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDg4GWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDg4GWi15+epVRQKRp/g8r9sIQgccsPz0IIjBSh/zPLYuDc4GWi15+epVRQKRp/f8r9sIQgccsPz0IIjBSh/zPLYuDc4GWi15+epVRQKRp/f8r9sIQgccsPz0IIkBSh+zPLYuDc3GWi15+eqVRQKRp/f8r9sIQgccsPz0IIkBSh+zPLYuDc3GWi15+eqVRQKRp/f8r9sIQgccsP=')
          audio.volume = 0.3
          audio.play().catch(() => {}) // 音が再生できなくても続行
        } catch (e) {
          // 音声再生エラーは無視
        }
        
        // 2秒後にダッシュボードに戻る
        setTimeout(() => {
          setCurrentView('dashboard')
        }, 2000)
      } else {
        console.warn('No summary in result:', result)
        await supabaseService.updateDocumentSummary(document.id, null, 'error')
        throw new Error('要約結果が空でした')
      }
      
      await loadDocuments() // ドキュメントリストを更新
      
    } catch (error) {
      console.error('Summary generation failed:', error)
      
      // エラー通知を表示
      if (toastId) removeToast(toastId)
      showToast({
        type: 'error',
        title: 'AI要約の生成に失敗しました',
        message: error instanceof Error ? error.message : '不明なエラーが発生しました',
        duration: 7000
      })
      
      // エラー状態に更新
      if (document.id) {
        try {
          await supabaseService.updateDocumentSummary(document.id, null, 'error')
          await loadDocuments()
        } catch (updateError) {
          console.error('Failed to update error status:', updateError)
        }
      }
    } finally {
      setSummarizingDocs(prev => {
        const newSet = new Set(prev)
        newSet.delete(document.id)
        return newSet
      })
    }
  }

  // AI要約を実行
  const generateSummary = async (file: File, documentId: string) => {
    try {
      console.log('Starting summary generation for file:', file.name, 'size:', file.size, 'type:', file.type)
      setSummaryProgress(prev => ({ ...prev, [file.name]: true }))
      
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('Sending request to /api/summarize')
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData
      })
      
      console.log('Response status:', response.status, 'ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to generate summary: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Summary API result:', result)
      
      if (result.error) {
        throw new Error(`Summary generation error: ${result.error}`)
      }
      
      if (result.summary) {
        console.log('Updating document summary in database')
        // 要約をデータベースに保存
        await supabaseService.updateDocumentSummary(documentId, result.summary)
        console.log('Document summary updated successfully')
      } else {
        console.warn('No summary in result:', result)
      }
      
      setSummaryProgress(prev => ({ ...prev, [file.name]: false }))
      return result.summary
    } catch (error) {
      console.error('Summary generation failed:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      setSummaryProgress(prev => ({ ...prev, [file.name]: false }))
      throw error
    }
  }

  // 単一ファイルのアップロード
  const handleConfirmUpload = async (file: File, withSummary: boolean = false) => {
    try {
      setIsLoading(true)
      setUploadProgress(0)

      // 1. ファイルをSupabaseにアップロード
      const { url, path } = await supabaseService.uploadFile(file)
      setUploadProgress(30)

      // 2. ドキュメント情報をデータベースに保存
      const document: Omit<Document, 'id'> = {
        name: file.name,
        original_name: file.name,
        size: file.size,
        type: file.type === 'application/pdf' ? 'pdf' : 'txt',
        uploaded_at: new Date(),
        summary_status: 'pending',
        url,
        public_url: url,
        file_path: path
      }

      const savedDoc = await supabaseService.saveDocument(document)
      setUploadProgress(100)
      
      // AI要約を実行する場合
      if (withSummary && savedDoc.id) {
        setIsSummarizing(true)
        
        // AI要約中の通知
        const summaryToastId = showToast({
          type: 'loading',
          title: 'AI要約を生成中...',
          message: file.name,
          duration: 0
        })
        
        try {
          await generateSummary(file, savedDoc.id)
          
          // 成功通知
          removeToast(summaryToastId)
          showToast({
            type: 'success',
            title: 'AI要約が完了しました！',
            message: `${file.name} の要約を生成しました`,
            duration: 5000
          })
        } catch (error) {
          console.error('Summary generation failed:', error)
          
          // エラー通知
          removeToast(summaryToastId)
          showToast({
            type: 'error',
            title: 'AI要約の生成に失敗しました',
            message: file.name,
            duration: 7000
          })
        } finally {
          setIsSummarizing(false)
        }
      }
      
      await loadDocuments()

      // ファイルリストから削除
      setPreviewFiles(prev => prev.filter(f => f !== file))
      
      // すべてのファイルがアップロードされたらダッシュボードへ
      if (previewFiles.length <= 1) {
        setTimeout(() => {
          setShowPreview(false)
          setPreviewFiles([])
          setCurrentView('dashboard')
          setUploadProgress(0)
        }, 500)
      }

    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 複数ファイルの一括アップロード
  const handleBatchUpload = async (files: File[], withSummary: boolean = false) => {
    for (const file of files) {
      await handleConfirmUpload(file, withSummary)
    }
  }

  // ファイルをリストから削除
  const handleRemoveFile = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index))
    if (previewFiles.length <= 1) {
      setShowPreview(false)
      setPreviewFiles([])
    }
  }

  // プレビューキャンセル
  const handleCancelPreview = () => {
    setShowPreview(false)
    setPreviewFiles([])
  }

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document)
    if (document.summary) {
      setCurrentSummary(JSON.parse(document.summary as string))
      setCurrentView('summary')
    } else {
      setCurrentView('preview')
    }
  }

  const handleDocumentDelete = async (id: string) => {
    try {
      await supabaseService.deleteDocument(id)
      await loadDocuments()
      
      showToast({
        type: 'success',
        title: 'ドキュメントを削除しました',
        duration: 3000
      })
    } catch (error) {
      console.error('Delete failed:', error)
      showToast({
        type: 'error',
        title: '削除に失敗しました',
        message: error instanceof Error ? error.message : '不明なエラー',
        duration: 5000
      })
    }
  }

  const handleDocumentDownload = async (document: Document) => {
    try {
      const toastId = showToast({
        type: 'loading',
        title: 'ダウンロード中...',
        message: document.original_name,
        duration: 0
      })
      
      await supabaseService.downloadDocument(document)
      
      removeToast(toastId)
      showToast({
        type: 'success',
        title: 'ダウンロード完了',
        message: document.original_name,
        duration: 3000
      })
    } catch (error) {
      console.error('Download failed:', error)
      showToast({
        type: 'error',
        title: 'ダウンロードに失敗しました',
        message: error instanceof Error ? error.message : '不明なエラー',
        duration: 5000
      })
    }
  }

  const handleSummaryDownload = async (document: Document) => {
    try {
      if (!document.summary) {
        showToast({
          type: 'error',
          title: 'エラー',
          message: '要約データがありません',
          duration: 3000
        })
        return
      }

      const toastId = showToast({
        type: 'loading',
        title: 'AI要約をダウンロード中...',
        message: document.original_name,
        duration: 0
      })

      const summary: DetailedSummary = JSON.parse(document.summary as string)
      const { SummaryExportService } = await import('@/lib/summaryExport')
      SummaryExportService.exportSummaryAsText(summary, document.original_name)

      removeToast(toastId)
      showToast({
        type: 'success',
        title: 'AI要約ダウンロード完了',
        message: document.original_name,
        duration: 3000
      })
    } catch (error) {
      console.error('Summary download failed:', error)
      showToast({
        type: 'error',
        title: 'AI要約ダウンロードに失敗しました',
        message: error instanceof Error ? error.message : '不明なエラー',
        duration: 5000
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 通知コンテナ */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Lumindoc
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Document Assistant</p>
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ホーム
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                アップロード
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ライブラリ
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="relative">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <HeroSection
              onGetStarted={() => setCurrentView('upload')}
              documentsCount={documents.length}
            />
          )}

          {currentView === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 py-12"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  ドキュメントをアップロード
                </h1>
                <p className="text-xl text-gray-600">
                  AIがあなたのドキュメントを詳細に分析・要約します
                </p>
              </div>

              <FileUpload onFileSelect={handleFileSelect} mode="preview" />

              {showPreview && previewFiles.length > 0 && (
                previewFiles.length === 1 ? (
                  <FilePreview
                    file={previewFiles[0]}
                    onConfirm={(file) => handleConfirmUpload(file, false)}
                    onConfirmWithSummary={(file) => handleConfirmUpload(file, true)}
                    onCancel={handleCancelPreview}
                    isUploading={isLoading}
                    isSummarizing={isSummarizing}
                  />
                ) : (
                  <BatchFilePreview
                    files={previewFiles}
                    onConfirmAll={(files) => handleBatchUpload(files, false)}
                    onConfirmAllWithSummary={(files) => handleBatchUpload(files, true)}
                    onConfirmSingle={(file) => handleConfirmUpload(file, false)}
                    onConfirmSingleWithSummary={(file) => handleConfirmUpload(file, true)}
                    onRemoveFile={handleRemoveFile}
                    onCancel={handleCancelPreview}
                    isUploading={isLoading}
                    isSummarizing={isSummarizing}
                    summaryProgress={summaryProgress}
                  />
                )
              )}

              {uploadProgress > 0 && !showPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white rounded-lg p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">処理中...</span>
                    <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <DocumentDashboard
                documents={documents}
                onDocumentSelect={handleDocumentSelect}
                onDocumentDelete={handleDocumentDelete}
                onDocumentDownload={handleDocumentDownload}
                onDocumentSummarize={generateSummaryFromDocument}
                onSummaryDownload={handleSummaryDownload}
                isLoading={isLoading}
                summarizingDocs={summarizingDocs}
              />
            </motion.div>
          )}

          {currentView === 'summary' && selectedDocument && currentSummary && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 py-8"
            >
              <div className="mb-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  ← ライブラリに戻る
                </button>
              </div>
              <SummaryCard
                summary={currentSummary}
                fileName={selectedDocument.original_name}
              />
            </motion.div>
          )}

          {currentView === 'preview' && selectedDocument && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              {selectedDocument.type === 'pdf' ? (
                <PDFViewer
                  fileUrl={selectedDocument.public_url!}
                  fileName={selectedDocument.original_name}
                  onClose={() => setCurrentView('dashboard')}
                  isModal={true}
                  onSummarize={selectedDocument.summary_status === 'pending' ? () => generateSummaryFromDocument(selectedDocument) : undefined}
                  isSummarizing={summarizingDocs.has(selectedDocument.id)}
                  showSummarizeButton={selectedDocument.summary_status === 'pending'}
                />
              ) : (
                <TextViewer
                  fileUrl={selectedDocument.public_url!}
                  fileName={selectedDocument.original_name}
                  onClose={() => setCurrentView('dashboard')}
                  isModal={true}
                  onSummarize={selectedDocument.summary_status === 'pending' ? () => generateSummaryFromDocument(selectedDocument) : undefined}
                  isSummarizing={summarizingDocs.has(selectedDocument.id)}
                  showSummarizeButton={selectedDocument.summary_status === 'pending'}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">Lumindoc</span>
            </div>
            <p className="text-gray-400 mb-6">
              AIの力で、あなたのドキュメント管理を革新します
            </p>
            <div className="flex justify-center space-x-6">
              <Github className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
              <Twitter className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
              <Mail className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-400">
              © 2024 Lumindoc. All rights reserved. | Powered by Gemini AI & Supabase
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ヒーローセクションコンポーネント
function HeroSection({ onGetStarted, documentsCount }: { onGetStarted: () => void, documentsCount: number }) {
  return (
    <motion.div
      key="hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative overflow-hidden"
    >
      {/* 背景アニメーション */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Lumindoc
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-2xl md:text-3xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            AIがあなたのドキュメントを
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-semibold">
              瞬時に分析・要約
            </span>
            <br />
            学習効率を革命的に向上させます
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center">
                今すぐ始める
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="text-gray-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:shadow-lg transition-all duration-300">
              デモを見る
            </button>
          </motion.div>

          {/* 統計情報 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{documentsCount}</div>
              <div className="text-gray-600">アップロード済み文書</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">AI</div>
              <div className="text-gray-600">Gemini搭載</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">∞</div>
              <div className="text-gray-600">学習効率向上</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
