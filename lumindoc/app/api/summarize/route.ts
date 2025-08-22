import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    // 環境変数チェック
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('Gemini API key is not configured')
      return NextResponse.json({ 
        error: 'Gemini API key is not configured. Please check your environment variables.' 
      }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（10MB以下）' }, { status: 400 })
    }

    let content: string

    try {
      // ファイルタイプに応じてテキスト抽出
      if (file.type === 'application/pdf') {
        content = await geminiService.extractTextFromPDF(file)
      } else if (file.type === 'text/plain') {
        content = await geminiService.extractTextFromText(file)
      } else {
        return NextResponse.json({ error: '対応していないファイル形式です' }, { status: 400 })
      }
    } catch (extractionError) {
      console.error('Text extraction error:', extractionError)
      return NextResponse.json({ 
        error: 'テキスト抽出に失敗しました' 
      }, { status: 500 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'ファイルからテキストを抽出できませんでした' 
      }, { status: 400 })
    }

    console.log(`Extracted content length: ${content.length} characters`)

    try {
      // AI要約生成
      const detailedSummary = await geminiService.generateDetailedSummary(content, file.name)
      
      return NextResponse.json({
        success: true,
        summary: detailedSummary,
        originalContent: content
      })
    } catch (aiError) {
      console.error('AI summary generation error:', aiError)
      return NextResponse.json({ 
        error: `AI要約の生成に失敗しました: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Summarization error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `要約の生成中にエラーが発生しました: ${errorMessage}` }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Summarization API is running' })
}