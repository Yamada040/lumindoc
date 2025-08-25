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
        console.log('Processing PDF file on server side')
        content = await extractPDFContent(file)
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

// サーバーサイドでのPDFテキスト抽出（一時的な実装）
async function extractPDFContent(file: File): Promise<string> {
  try {
    console.log('Processing PDF file (temporary implementation), file size:', file.size)
    
    // 一時的にファイル情報とサンプルテキストを返す
    // TODO: 後で実際のPDF解析ライブラリを実装
    
    const sampleText = `
PDFファイル: ${file.name}
ファイルサイズ: ${(file.size / 1024).toFixed(2)} KB
アップロード日時: ${new Date().toLocaleString('ja-JP')}
推定ページ数: ${Math.max(1, Math.floor(file.size / 50000))}

【サンプル解析内容 - PDFファイル】
このドキュメントは重要な情報を含んでいると推測されます。

主要なセクション:
1. 導入・概要
   - プロジェクトの背景と目的
   - 対象範囲の定義
   
2. 詳細分析
   - データの収集と分析手法
   - 結果の評価と考察
   
3. 結論と提案
   - 主要な発見事項
   - 今後のアクション項目
   
4. 付録資料
   - 参考文献
   - 技術仕様

キーワード: プロジェクト、分析、結果、提案、実装、評価

※注意: これは一時的な実装です。実際のPDFテキストを抽出するには、
専用のライブラリ（pdf-parse、pdf2pic等）の適切な設定が必要です。
現在はファイル情報とサンプル構造を基にした要約を生成しています。
    `.trim()
    
    console.log('PDF content prepared (temporary), length:', sampleText.length)
    return sampleText
    
  } catch (error) {
    console.error('PDF processing error:', error)
    // エラーが発生した場合もファイル情報は返す
    const errorText = `
PDFファイル: ${file.name}
ファイルサイズ: ${(file.size / 1024).toFixed(2)} KB
アップロード日時: ${new Date().toLocaleString('ja-JP')}

※PDFファイルの処理中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}
ファイル基本情報のみを使用して要約を生成します。
    `.trim()
    
    return errorText
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Summarization API is running' })
}