'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  FileText, 
  Calendar,
  Clock,
  Tag,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Star,
  Archive,
  Brain,
  Loader2
} from 'lucide-react'
import { Document } from '@/types'
import { formatDate, formatFileSize, cn } from '@/lib/utils'

interface DocumentDashboardProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  onDocumentDelete: (id: string) => void
  onDocumentDownload: (document: Document) => void
  onDocumentSummarize?: (document: Document) => void
  isLoading?: boolean
  summarizingDocs?: Set<string>
}

type ViewMode = 'grid' | 'list'
type SortOption = 'date' | 'name' | 'size' | 'type'
type FilterOption = 'all' | 'pdf' | 'txt' | 'completed' | 'processing'

export function DocumentDashboard({
  documents,
  onDocumentSelect,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentSummarize,
  isLoading = false,
  summarizingDocs = new Set()
}: DocumentDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())

  // フィルタリングとソート
  const filteredAndSortedDocs = useMemo(() => {
    let filtered = documents.filter(doc => {
      // 検索フィルター
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // タイプフィルター
      const matchesFilter = filterBy === 'all' || 
                           filterBy === doc.type ||
                           filterBy === doc.summary_status
      
      return matchesSearch && matchesFilter
    })

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        case 'name':
          return a.original_name.localeCompare(b.original_name)
        case 'size':
          return b.size - a.size
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    return filtered
  }, [documents, searchQuery, filterBy, sortBy])

  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocs(newSelected)
  }

  const getSummaryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSummaryStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '要約完了'
      case 'processing': return '要約中'
      case 'error': return 'エラー'
      default: return '待機中'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-600">ドキュメントを読み込んでいます...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Library</h1>
        <p className="text-gray-600">{documents.length}個のドキュメント</p>
      </div>

      {/* コントロールバー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* 検索 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ドキュメントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* フィルターとコントロール */}
          <div className="flex items-center gap-3">
            {/* フィルター */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="pdf">PDF</option>
              <option value="txt">テキスト</option>
              <option value="completed">要約済み</option>
              <option value="processing">処理中</option>
            </select>

            {/* ソート */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">日付順</option>
              <option value="name">名前順</option>
              <option value="size">サイズ順</option>
              <option value="type">種類順</option>
            </select>

            {/* 表示モード */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-l-lg transition-colors",
                  viewMode === 'grid' ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-r-lg transition-colors border-l border-gray-300",
                  viewMode === 'list' ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ドキュメント一覧 */}
      {filteredAndSortedDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? '検索結果がありません' : 'ドキュメントがありません'}
          </h3>
          <p className="text-gray-600">
            {searchQuery ? '検索条件を変更してみてください' : 'ファイルをアップロードして始めましょう'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAndSortedDocs.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                index={index}
                onSelect={() => onDocumentSelect(doc)}
                onDelete={() => onDocumentDelete(doc.id)}
                onDownload={() => onDocumentDownload(doc)}
                onSummarize={onDocumentSummarize ? () => onDocumentSummarize(doc) : undefined}
                isSelected={selectedDocs.has(doc.id)}
                onToggleSelect={() => toggleDocSelection(doc.id)}
                isSummarizing={summarizingDocs.has(doc.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredAndSortedDocs.map((doc, index) => (
                <DocumentListItem
                  key={doc.id}
                  document={doc}
                  index={index}
                  onSelect={() => onDocumentSelect(doc)}
                  onDelete={() => onDocumentDelete(doc.id)}
                  onDownload={() => onDocumentDownload(doc)}
                  onSummarize={onDocumentSummarize ? () => onDocumentSummarize(doc) : undefined}
                  isSelected={selectedDocs.has(doc.id)}
                  onToggleSelect={() => toggleDocSelection(doc.id)}
                  isSummarizing={summarizingDocs.has(doc.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

// ドキュメントカードコンポーネント
function DocumentCard({ 
  document, 
  index, 
  onSelect, 
  onDelete, 
  onDownload,
  onSummarize,
  isSelected,
  onToggleSelect,
  isSummarizing = false
}: {
  document: Document
  index: number
  onSelect: () => void
  onDelete: () => void
  onDownload: () => void
  onSummarize?: () => void
  isSelected: boolean
  onToggleSelect: () => void
  isSummarizing?: boolean
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group w-full overflow-hidden",
        isSelected && "border-blue-500 bg-blue-50"
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0 mr-2">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              document.type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
            )}>
              <FileText className={cn(
                "w-5 h-5",
                document.type === 'pdf' ? 'text-red-600' : 'text-blue-600'
              )} />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 
                className="text-sm font-semibold text-gray-900 truncate leading-tight" 
                title={document.original_name}
              >
                {document.original_name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(document.size)}
              </p>
            </div>
          </div>
          
          {/* アクション */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                {onSummarize && document.summary_status === 'pending' && (
                  <button
                    onClick={onSummarize}
                    disabled={isSummarizing}
                    className="p-1 hover:bg-purple-100 rounded disabled:opacity-50"
                    title="AI要約を生成"
                  >
                    {isSummarizing ? (
                      <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                )}
                <button
                  onClick={onDownload}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ステータス */}
        <div className="mb-3 flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            getSummaryStatusColor(document.summary_status)
          )}>
            {getSummaryStatusText(document.summary_status)}
          </span>
          {document.summary_status === 'pending' && !isSummarizing && (
            <span className="text-xs text-purple-600 font-medium">
              要約可能
            </span>
          )}
        </div>

        {/* 日付 */}
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(document.uploaded_at)}
        </div>
      </div>
    </motion.div>
  )
}

// ドキュメントリストアイテムコンポーネント
function DocumentListItem({
  document,
  index,
  onSelect,
  onDelete,
  onDownload,
  onSummarize,
  isSelected,
  onToggleSelect,
  isSummarizing = false
}: {
  document: Document
  index: number
  onSelect: () => void
  onDelete: () => void
  onDownload: () => void
  onSummarize?: () => void
  isSelected: boolean
  onToggleSelect: () => void
  isSummarizing?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className={cn(
        "flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer",
        isSelected && "bg-blue-50"
      )}
      onClick={onSelect}
    >
      {/* ファイルアイコン */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center mr-4",
        document.type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
      )}>
        <FileText className={cn(
          "w-5 h-5",
          document.type === 'pdf' ? 'text-red-600' : 'text-blue-600'
        )} />
      </div>

      {/* ファイル情報 */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 
          className="text-sm font-medium text-gray-900 truncate leading-tight" 
          title={document.original_name}
        >
          {document.original_name}
        </h3>
        <div className="flex items-center mt-1 text-xs text-gray-500 space-x-4">
          <span>{formatFileSize(document.size)}</span>
          <span>{document.type.toUpperCase()}</span>
          <span>{formatDate(document.uploaded_at)}</span>
        </div>
      </div>

      {/* ステータス */}
      <div className="mr-4">
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          getSummaryStatusColor(document.summary_status)
        )}>
          {getSummaryStatusText(document.summary_status)}
        </span>
      </div>

      {/* アクション */}
      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
        {onSummarize && document.summary_status === 'pending' && (
          <button
            onClick={onSummarize}
            disabled={isSummarizing}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
            title="AI要約を生成"
          >
            {isSummarizing ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 text-purple-600" />
            )}
          </button>
        )}
        <button
          onClick={onDownload}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </motion.div>
  )
}

function getSummaryStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100'
    case 'processing': return 'text-yellow-600 bg-yellow-100'
    case 'error': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

function getSummaryStatusText(status: string) {
  switch (status) {
    case 'completed': return '要約完了'
    case 'processing': return '要約中'
    case 'error': return 'エラー'
    default: return '待機中'
  }
}