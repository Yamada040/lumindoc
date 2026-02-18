import { GoogleGenerativeAI } from '@google/generative-ai'
import { DetailedSummary } from '@/types'

const MODEL_CANDIDATES = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']

export class GeminiQuotaError extends Error {
  readonly status = 429
  readonly retryAfterSeconds?: number

  constructor(message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'GeminiQuotaError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
}

function extractRetryAfterSeconds(error: unknown): number | undefined {
  const text = error instanceof Error ? error.message : String(error)
  const match = text.match(/retry in\s+(\d+(?:\.\d+)?)s/i)
  if (!match) return undefined
  const sec = Math.ceil(Number(match[1]))
  return Number.isFinite(sec) ? sec : undefined
}

function normalizeSummary(input: unknown): DetailedSummary {
  const obj = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>

  const keyPoints = Array.isArray(obj.keyPoints)
    ? obj.keyPoints.filter((v): v is string => typeof v === 'string').slice(0, 8)
    : []

  const topics = Array.isArray(obj.topics)
    ? obj.topics.filter((v): v is string => typeof v === 'string').slice(0, 8)
    : []

  const sections = Array.isArray(obj.sections)
    ? obj.sections
        .map((section): DetailedSummary['sections'][number] | null => {
          if (!section || typeof section !== 'object') return null
          const s = section as Record<string, unknown>
          return {
            title: typeof s.title === 'string' ? s.title : 'セクション',
            content: typeof s.content === 'string' ? s.content : '',
            importance:
              s.importance === 'high' || s.importance === 'medium' || s.importance === 'low'
                ? s.importance
                : 'medium',
            page: typeof s.page === 'number' ? s.page : undefined,
          }
        })
        .filter((v): v is DetailedSummary['sections'][number] => Boolean(v))
    : []

  const difficulty =
    obj.difficulty === 'beginner' || obj.difficulty === 'intermediate' || obj.difficulty === 'advanced'
      ? obj.difficulty
      : 'intermediate'

  return {
    overview: typeof obj.overview === 'string' ? obj.overview : '要約を生成しました。',
    keyPoints,
    sections,
    wordCount: typeof obj.wordCount === 'number' ? obj.wordCount : 0,
    pageCount: typeof obj.pageCount === 'number' ? obj.pageCount : undefined,
    topics,
    difficulty,
  }
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
  const raw = fenced?.[1] || text
  const obj = raw.match(/\{[\s\S]*\}/)
  if (!obj) throw new Error('Invalid JSON response from Gemini')
  return JSON.parse(obj[0])
}

export class GeminiService {
  private getClient() {
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      throw new Error('Gemini API key is not configured')
    }
    return new GoogleGenerativeAI(apiKey)
  }

  private async generateWithFallback(prompt: string): Promise<string> {
    const client = this.getClient()
    let lastError: unknown

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = client.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      } catch (error) {
        lastError = error
        const status =
          typeof error === 'object' && error && 'status' in error
            ? Number((error as { status?: unknown }).status)
            : undefined
        const message = error instanceof Error ? error.message.toLowerCase() : ''

        const isQuota = status === 429 || message.includes('quota exceeded') || message.includes('too many requests')
        if (isQuota) {
          throw new GeminiQuotaError(
            'Gemini APIの利用上限に達しました。しばらく待ってから再試行してください。',
            extractRetryAfterSeconds(error)
          )
        }

        const shouldTryNext = status === 404 || message.includes('not found')
        if (!shouldTryNext) {
          throw error
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Gemini request failed')
  }

  async generateDetailedSummary(content: string, fileName: string): Promise<DetailedSummary> {
    const prompt = `
以下のドキュメント「${fileName}」を分析し、必ず JSON で返してください。

{
  "overview": "概要（200文字以内）",
  "keyPoints": ["重要ポイント1", "重要ポイント2", "重要ポイント3"],
  "sections": [{"title": "見出し", "content": "説明", "importance": "high|medium|low", "page": 1}],
  "wordCount": 1000,
  "pageCount": 10,
  "topics": ["トピック1", "トピック2"],
  "difficulty": "beginner|intermediate|advanced"
}

制約:
- 日本語
- JSON 以外の文を出さない

対象本文:
${content}
`

    try {
      const text = await this.generateWithFallback(prompt)
      return normalizeSummary(parseJson(text))
    } catch (error) {
      console.error('Gemini API Error:', error)
      if (error instanceof GeminiQuotaError) throw error
      throw new Error('要約の生成に失敗しました')
    }
  }

  async generateQuickSummary(content: string): Promise<string> {
    const prompt = `以下の内容を3〜5行で簡潔に要約してください。\n\n${content}`

    try {
      return await this.generateWithFallback(prompt)
    } catch (error) {
      console.error('Gemini API Error:', error)
      if (error instanceof GeminiQuotaError) throw error
      throw new Error('クイック要約の生成に失敗しました')
    }
  }
}

export const geminiService = new GeminiService()
