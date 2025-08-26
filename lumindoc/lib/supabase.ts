import { createClient } from '@supabase/supabase-js'
import { Document } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class SupabaseService {
  async uploadFile(file: File, userId: string = 'anonymous'): Promise<{ url: string; path: string }> {
    // ファイル名をサニタイズ（日本語や特殊文字を処理）
    const fileExt = file.name.split('.').pop() || 'pdf'
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const sanitizedFileName = `${timestamp}-${randomString}.${fileExt}`
    const filePath = `${userId}/${sanitizedFileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) {
      throw new Error(`ファイルのアップロードに失敗しました: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path
    }
  }

  async saveDocument(document: Omit<Document, 'id'>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert([document])
      .select()
      .single()

    if (error) {
      throw new Error(`ドキュメントの保存に失敗しました: ${error.message}`)
    }

    // 日付フィールドを適切にDateオブジェクトに変換
    return {
      ...data,
      uploaded_at: data.uploaded_at ? new Date(data.uploaded_at) : new Date(),
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
    }
  }

  async getDocuments(userId: string = 'anonymous'): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) {
      throw new Error(`ドキュメントの取得に失敗しました: ${error.message}`)
    }

    // 日付フィールドを適切にDateオブジェクトに変換
    const documents = (data || []).map(doc => ({
      ...doc,
      uploaded_at: doc.uploaded_at ? new Date(doc.uploaded_at) : new Date(),
      created_at: doc.created_at ? new Date(doc.created_at) : undefined,
      updated_at: doc.updated_at ? new Date(doc.updated_at) : undefined,
    }))

    return documents
  }

  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // ドキュメントが見つからない
      }
      throw new Error(`ドキュメントの取得に失敗しました: ${error.message}`)
    }

    // 日付フィールドを適切にDateオブジェクトに変換
    if (data) {
      return {
        ...data,
        uploaded_at: data.uploaded_at ? new Date(data.uploaded_at) : new Date(),
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
      }
    }

    return null
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`ドキュメントの更新に失敗しました: ${error.message}`)
    }

    // 日付フィールドを適切にDateオブジェクトに変換
    return {
      ...data,
      uploaded_at: data.uploaded_at ? new Date(data.uploaded_at) : new Date(),
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
    }
  }

  async updateDocumentSummary(id: string, summary: any, status?: string): Promise<Document> {
    const updates: Partial<Document> = {
      updated_at: new Date()
    }
    
    if (summary !== null) {
      updates.summary = typeof summary === 'string' ? summary : JSON.stringify(summary)
    }
    
    if (status) {
      updates.summary_status = status as any
    } else if (summary !== null) {
      updates.summary_status = 'completed' as const
    }

    return this.updateDocument(id, updates)
  }

  async deleteDocument(id: string): Promise<void> {
    // まずドキュメント情報を取得
    const document = await this.getDocument(id)
    if (!document) {
      throw new Error('ドキュメントが見つかりません')
    }

    // ストレージからファイルを削除
    if (document.url) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.url])

      if (storageError) {
        console.warn('ストレージからの削除に失敗:', storageError.message)
      }
    }

    // データベースからレコードを削除
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`ドキュメントの削除に失敗しました: ${error.message}`)
    }
  }

  async downloadFile(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(path)

    if (error) {
      throw new Error(`ファイルのダウンロードに失敗しました: ${error.message}`)
    }

    return data
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(path)

    return data.publicUrl
  }
}

export const supabaseService = new SupabaseService()