'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Sparkles, ArrowRight, Github, Twitter, Mail, X } from 'lucide-react'
import { Document, DetailedSummary } from '@/types'
import { FileUpload } from '@/components/FileUpload'
import { DocumentDashboard } from '@/components/DocumentDashboard'
import { SummaryCard } from '@/components/SummaryCard'
import { PDFViewer } from '@/components/PDFViewer'
import { supabaseService } from '@/lib/supabase'

type AppView = 'home' | 'upload' | 'dashboard' | 'summary' | 'preview'

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [currentSummary, setCurrentSummary] = useState<DetailedSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
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
          summary_status: 'processing',
          url,
          public_url: url,
          file_path: path
        }

        const savedDoc = await supabaseService.saveDocument(document)
        setUploadProgress(60)

        // 3. AI要約を生成
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/summarize', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Summary generation failed')
        }

        const { summary, originalContent } = await response.json()
        setUploadProgress(90)

        // 4. 要約結果でドキュメントを更新
        await supabaseService.updateDocument(savedDoc.id, {
          summary: JSON.stringify(summary),
          content: originalContent,
          summary_status: 'completed'
        })

        setUploadProgress(100)
        await loadDocuments()

        // アップロード完了後、ダッシュボードに移動
        setTimeout(() => {
          setCurrentView('dashboard')
          setUploadProgress(0)
        }, 500)

      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
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
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleDocumentDownload = async (document: Document) => {
    if (document.public_url) {
      window.open(document.public_url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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

              <FileUpload onFileSelect={handleFileUpload} />

              {uploadProgress > 0 && (
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
                isLoading={isLoading}
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
              <PDFViewer
                fileUrl={selectedDocument.public_url!}
                fileName={selectedDocument.original_name}
                onClose={() => setCurrentView('dashboard')}
                isModal={true}
              />
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
