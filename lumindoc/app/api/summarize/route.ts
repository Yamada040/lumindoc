import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（10MB以下）' }, { status: 400 })
    }

    let content: string

    // ファイルタイプに応じてテキスト抽出
    if (file.type === 'application/pdf') {
      content = await geminiService.extractTextFromPDF(file)
    } else if (file.type === 'text/plain') {
      content = await geminiService.extractTextFromText(file)
    } else {
      return NextResponse.json({ error: '対応していないファイル形式です' }, { status: 400 })
    }

    // AI要約生成
    const detailedSummary = await geminiService.generateDetailedSummary(content, file.name)

    return NextResponse.json({
      success: true,
      summary: detailedSummary,
      originalContent: content
    })

  } catch (error) {
    console.error('Summarization error:', error)
    return NextResponse.json(
      { error: '要約の生成中にエラーが発生しました' }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Summarization API is running' })
}