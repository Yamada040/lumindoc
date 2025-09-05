import { DetailedSummary } from '@/types'

export class SummaryExportService {
  static exportSummaryAsText(summary: DetailedSummary, fileName: string): void {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') {
      throw new Error('エクスポートはブラウザでのみ実行できます')
    }

    // テキスト形式に整形
    const textContent = this.formatSummaryAsText(summary, fileName)
    
    // Blobを作成
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    
    // ダウンロードリンクを作成してクリック
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${fileName}_要約.txt`
    link.style.display = 'none'
    
    window.document.body.appendChild(link)
    link.click()
    
    // クリーンアップ
    setTimeout(() => {
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 100)
  }

  private static formatSummaryAsText(summary: DetailedSummary, fileName: string): string {
    const lines: string[] = []
    
    // ヘッダー
    lines.push('=' .repeat(60))
    lines.push(`AI要約レポート: ${fileName}`)
    lines.push('生成日時: ' + new Date().toLocaleString('ja-JP'))
    lines.push('=' .repeat(60))
    lines.push('')

    // 概要
    lines.push('■ 概要')
    lines.push('-' .repeat(40))
    lines.push(summary.overview)
    lines.push('')

    // 重要なポイント
    if (summary.keyPoints && summary.keyPoints.length > 0) {
      lines.push('■ 重要なポイント')
      lines.push('-' .repeat(40))
      summary.keyPoints.forEach((point, index) => {
        lines.push(`${index + 1}. ${point}`)
      })
      lines.push('')
    }

    // セクション詳細
    if (summary.sections && summary.sections.length > 0) {
      lines.push('■ 詳細セクション')
      lines.push('-' .repeat(40))
      summary.sections.forEach((section, index) => {
        lines.push(`【${index + 1}】${section.title}`)
        lines.push(`重要度: ${this.getImportanceText(section.importance)}`)
        if (section.page) {
          lines.push(`ページ: ${section.page}`)
        }
        lines.push('')
        lines.push(section.content)
        lines.push('')
      })
    }

    // トピック
    if (summary.topics && summary.topics.length > 0) {
      lines.push('■ 関連トピック')
      lines.push('-' .repeat(40))
      lines.push(summary.topics.join(', '))
      lines.push('')
    }

    // 統計情報
    lines.push('■ 統計情報')
    lines.push('-' .repeat(40))
    lines.push(`文字数: 約${summary.wordCount.toLocaleString()}文字`)
    if (summary.pageCount) {
      lines.push(`ページ数: ${summary.pageCount}ページ`)
    }
    lines.push(`難易度: ${this.getDifficultyText(summary.difficulty)}`)
    lines.push('')

    // フッター
    lines.push('=' .repeat(60))
    lines.push('このレポートはAIにより自動生成されました')
    lines.push('=' .repeat(60))

    return lines.join('\n')
  }

  private static getImportanceText(importance: 'high' | 'medium' | 'low'): string {
    switch (importance) {
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '不明'
    }
  }

  private static getDifficultyText(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
    switch (difficulty) {
      case 'beginner': return '初級'
      case 'intermediate': return '中級'
      case 'advanced': return '上級'
      default: return '不明'
    }
  }

}