export interface Document {
  id: string
  name: string
  originalName: string
  size: number
  type: 'pdf' | 'txt'
  uploadedAt: Date
  content?: string
  summary?: string
  summaryStatus: 'pending' | 'processing' | 'completed' | 'error'
  url?: string
  publicUrl?: string
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