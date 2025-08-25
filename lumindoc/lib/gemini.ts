import { GoogleGenerativeAI } from '@google/generative-ai'
import { DetailedSummary } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  async generateDetailedSummary(content: string, fileName: string): Promise<DetailedSummary> {
    const prompt = `
以下のドキュメント「${fileName}」の内容を詳細に分析し、以下の形式でJSONレスポンスを返してください：

{
  "overview": "ドキュメント全体の簡潔な概要（200文字以内）",
  "keyPoints": ["重要なポイント1", "重要なポイント2", "重要なポイント3"],
  "sections": [
    {
      "title": "セクション名",
      "content": "セクションの詳細な要約",
      "importance": "high|medium|low",
      "page": ページ番号（PDFの場合）
    }
  ],
  "wordCount": 推定文字数,
  "pageCount": ページ数（PDFの場合）,
  "topics": ["トピック1", "トピック2", "トピック3"],
  "difficulty": "beginner|intermediate|advanced"
}

分析する内容：
${content}

注意事項：
- 日本語で回答してください
- 重要な情報を見逃さないよう詳細に分析してください
- セクションは論理的な構造に基づいて分割してください
- 難易度は内容の複雑さと専門性を基準に判定してください
- JSONフォーマットを厳密に守ってください
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // JSONレスポンスをパース
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/)
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini')
      }

      const summary: DetailedSummary = JSON.parse(jsonMatch[1] || jsonMatch[0])
      return summary
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new Error('要約の生成に失敗しました')
    }
  }

  async generateQuickSummary(content: string): Promise<string> {
    const prompt = `
以下の内容を3〜5行で簡潔に要約してください。重要なポイントのみを日本語で抽出してください：

${content}
`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw new Error('クイック要約の生成に失敗しました')
    }
  }

  async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer

          // クライアントサイドでは基本情報のみを返す（PDF解析はサーバーサイドで実行）
          const basicInfo = `
PDFファイル: ${file.name}
ファイルサイズ: ${(file.size / 1024).toFixed(2)} KB
作成日時: ${new Date(file.lastModified).toLocaleString('ja-JP')}
ファイルタイプ: PDF

※注意: このファイルはPDFドキュメントです。
サーバーサイドでの処理により、実際のテキスト内容が抽出されます。
          `.trim()

          console.log('PDF file prepared for server-side processing, size:', file.size)
          resolve(basicInfo)
        } catch (error) {
          console.error('PDF file processing error:', error)
          reject(new Error('PDFファイルの処理に失敗しました'))
        }
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error('ファイルの読み込みエラーが発生しました'))
      }
      reader.readAsArrayBuffer(file)
    })
  }

  async extractTextFromText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file, 'UTF-8')
    })
  }
}

export const geminiService = new GeminiService()