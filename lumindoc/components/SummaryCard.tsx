'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Tag,
  Brain,
  Target,
  AlertCircle,
  CheckCircle2,
  Copy,
  Share2,
  Star
} from 'lucide-react'
import { DetailedSummary } from '@/types'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  summary: DetailedSummary
  fileName: string
  isLoading?: boolean
  onCopySummary?: () => void
  onShareSummary?: () => void
}

export function SummaryCard({ 
  summary, 
  fileName, 
  isLoading = false,
  onCopySummary,
  onShareSummary
}: SummaryCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [showFullOverview, setShowFullOverview] = useState(false)

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初級'
      case 'intermediate': return '中級'
      case 'advanced': return '上級'
      default: return '不明'
    }
  }

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high': return <Star className="w-4 h-4 text-red-500 fill-current" />
      case 'medium': return <Star className="w-4 h-4 text-yellow-500 fill-current" />
      case 'low': return <Star className="w-4 h-4 text-gray-400" />
      default: return <Star className="w-4 h-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold">AI要約レポート</h2>
              <p className="text-blue-100 mt-1 truncate max-w-md">{fileName}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {onCopySummary && (
              <button
                onClick={onCopySummary}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            {onShareSummary && (
              <button
                onClick={onShareSummary}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.wordCount.toLocaleString()}</div>
            <div className="text-blue-100 text-sm">文字数</div>
          </div>
          {summary.pageCount && (
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.pageCount}</div>
              <div className="text-blue-100 text-sm">ページ数</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.sections.length}</div>
            <div className="text-blue-100 text-sm">セクション</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.topics.length}</div>
            <div className="text-blue-100 text-sm">トピック</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 概要 */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
              概要
            </h3>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                getDifficultyColor(summary.difficulty)
              )}>
                {getDifficultyText(summary.difficulty)}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className={cn(
              "text-gray-700 leading-relaxed",
              !showFullOverview && summary.overview.length > 200 && "line-clamp-3"
            )}>
              {summary.overview}
            </p>
            {summary.overview.length > 200 && (
              <button
                onClick={() => setShowFullOverview(!showFullOverview)}
                className="text-blue-500 hover:text-blue-600 text-sm mt-2 font-medium"
              >
                {showFullOverview ? '要約を表示' : 'すべて表示'}
              </button>
            )}
          </div>
        </motion.section>

        {/* 重要なポイント */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
            <Target className="w-5 h-5 mr-2 text-green-500" />
            重要なポイント
          </h3>
          <div className="space-y-2">
            {summary.keyPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{point}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* トピック */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
            <Tag className="w-5 h-5 mr-2 text-purple-500" />
            関連トピック
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((topic, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </motion.section>

        {/* 詳細セクション */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Brain className="w-5 h-5 mr-2 text-indigo-500" />
            詳細セクション
          </h3>
          <div className="space-y-3">
            {summary.sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getImportanceIcon(section.importance)}
                    <h4 className="font-medium text-gray-900 text-left">
                      {section.title}
                    </h4>
                    {section.page && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        p.{section.page}
                      </span>
                    )}
                  </div>
                  {expandedSections.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.has(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200"
                    >
                      <div className="p-4 bg-white">
                        <p className="text-gray-700 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* フッター */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-500"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>AI要約完了: {new Date().toLocaleDateString('ja-JP')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Powered by Gemini AI</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}