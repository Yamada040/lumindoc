export interface Document {
  id: string
  name: string
  original_name: string
  size: number
  type: 'pdf' | 'txt'
  uploaded_at: Date
  content?: string
  summary?: string
  summary_status: 'pending' | 'processing' | 'completed' | 'error'
  url?: string
  public_url?: string
  file_path?: string
  user_id?: string
  created_at?: Date
  updated_at?: Date
}

export interface SummarySection {
  title: string
  content: string
  importance: 'high' | 'medium' | 'low'
  page?: number
}

export interface DetailedSummary {
  overview: string
  keyPoints: string[]
  sections: SummarySection[]
  wordCount: number
  pageCount?: number
  topics: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}