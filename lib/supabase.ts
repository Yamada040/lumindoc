import { Document } from '@/types'

const STORAGE_KEY = 'lumindoc_documents'

const toDate = (value?: string | Date): Date => {
  if (!value) return new Date()
  return value instanceof Date ? value : new Date(value)
}

const readDocuments = (): Document[] => {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    return parsed.map((doc) => ({
      ...(doc as unknown as Document),
      uploaded_at: toDate(doc.uploaded_at as string),
      created_at: doc.created_at ? toDate(doc.created_at as string) : undefined,
      updated_at: doc.updated_at ? toDate(doc.updated_at as string) : undefined,
    }))
  } catch {
    return []
  }
}

const writeDocuments = (documents: Document[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
}

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

export class SupabaseService {
  async uploadFile(file: File, userId: string = 'local'): Promise<{ url: string; path: string }> {
    if (typeof window === 'undefined') {
      throw new Error('ファイルアップロードはブラウザ環境でのみ利用できます')
    }

    const fileExt = file.name.split('.').pop() || 'dat'
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`
    const url = window.URL.createObjectURL(file)
    return { url, path }
  }

  async saveDocument(document: Omit<Document, 'id'>): Promise<Document> {
    const saved: Document = {
      ...document,
      id: createId(),
      uploaded_at: document.uploaded_at || new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    }

    const documents = readDocuments()
    documents.unshift(saved)
    writeDocuments(documents)
    return saved
  }

  async getDocuments(): Promise<Document[]> {
    return readDocuments().sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
  }

  async getDocument(id: string): Promise<Document | null> {
    return readDocuments().find((doc) => doc.id === id) || null
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const documents = readDocuments()
    const index = documents.findIndex((doc) => doc.id === id)

    if (index < 0) {
      throw new Error('ドキュメントが見つかりません')
    }

    const updated: Document = {
      ...documents[index],
      ...updates,
      updated_at: new Date(),
    }

    documents[index] = updated
    writeDocuments(documents)
    return updated
  }

  async updateDocumentSummary(id: string, summary: unknown, status?: string): Promise<Document> {
    const updates: Partial<Document> = { updated_at: new Date() }

    if (summary !== null) {
      updates.summary = typeof summary === 'string' ? summary : JSON.stringify(summary)
    }

    if (status) {
      updates.summary_status = status as Document['summary_status']
    } else if (summary !== null) {
      updates.summary_status = 'completed'
    }

    const updated = await this.updateDocument(id, updates)

    if ((updated.summary_status === 'completed' || updated.summary_status === 'error') && updated.public_url) {
      try {
        if (updated.public_url.startsWith('blob:')) {
          window.URL.revokeObjectURL(updated.public_url)
        }
      } catch {
        // no-op
      }

      return this.updateDocument(id, {
        url: undefined,
        public_url: undefined,
        file_path: undefined,
      })
    }

    return updated
  }

  async deleteDocument(id: string): Promise<void> {
    const documents = readDocuments()
    const target = documents.find((doc) => doc.id === id)

    if (target?.public_url?.startsWith('blob:') && typeof window !== 'undefined') {
      try {
        window.URL.revokeObjectURL(target.public_url)
      } catch {
        // no-op
      }
    }

    writeDocuments(documents.filter((doc) => doc.id !== id))
  }

  async downloadFile(path: string): Promise<Blob> {
    throw new Error('ローカルモードでは storage path からのダウンロードはサポートされません')
  }

  getPublicUrl(path: string): string {
    return path
  }

  async downloadDocument(document: Document): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('ダウンロードはブラウザでのみ実行できます')
    }

    if (!document.public_url) {
      throw new Error('元ファイルは一時保存のみのため、要約完了後はダウンロードできません')
    }

    const response = await fetch(document.public_url)
    if (!response.ok) {
      throw new Error(`ファイルの取得に失敗しました: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = window.document.createElement('a')
    link.href = url
    link.download = document.original_name
    link.style.display = 'none'

    window.document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 100)
  }
}

export const supabaseService = new SupabaseService()
