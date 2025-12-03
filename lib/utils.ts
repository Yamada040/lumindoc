import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string | null | undefined): string {
  // null, undefined, または空文字列の場合はデフォルト値を返す
  if (!date) {
    return '日付不明'
  }

  // 文字列の場合はDateオブジェクトに変換
  let dateObj: Date
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  // Invalid Dateかどうかチェック
  if (isNaN(dateObj.getTime())) {
    return '日付不明'
  }

  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  } catch (error) {
    console.warn('日付フォーマットエラー:', error, 'date:', date)
    return '日付不明'
  }
}

export function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}