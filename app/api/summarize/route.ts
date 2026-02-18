import { NextRequest, NextResponse } from 'next/server'
import { inflateSync } from 'zlib'
import { geminiService, GeminiQuotaError } from '@/lib/gemini'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
}

export async function POST(request: NextRequest) {
  try {
    if (!getApiKey()) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Set GEMINI_API_KEY.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（10MB以下）' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      return NextResponse.json({ error: '対応していないファイル形式です（PDF/TXTのみ）' }, { status: 400 })
    }

    const content =
      file.type === 'application/pdf'
        ? await extractPDFContent(file)
        : await extractTextContent(file)

    if (!content.trim()) {
      return NextResponse.json({ error: 'ファイルからテキストを抽出できませんでした' }, { status: 400 })
    }

    const detailedSummary = await geminiService.generateDetailedSummary(content, file.name)
    return NextResponse.json({ success: true, summary: detailedSummary, originalContent: content })
  } catch (error) {
    if (error instanceof GeminiQuotaError) {
      const response = NextResponse.json({ error: error.message }, { status: 429 })
      if (error.retryAfterSeconds) {
        response.headers.set('Retry-After', String(error.retryAfterSeconds))
      }
      return response
    }

    console.error('Summarization error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '要約の生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

async function extractTextContent(file: File): Promise<string> {
  const text = await file.text()
  if (!text.trim()) {
    throw new Error('テキストファイルが空です')
  }

  return [
    `ファイル名: ${file.name}`,
    `ファイルサイズ: ${(file.size / 1024).toFixed(2)} KB`,
    `文字数: ${text.length}`,
    '',
    '===== ファイル内容 =====',
    text,
  ].join('\n')
}

async function extractPDFContent(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.slice(0, 4).toString() !== '%PDF') {
    throw new Error('有効なPDFファイルではありません')
  }

  const binary = buffer.toString('latin1')
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  const extractedChunks: string[] = []

  const decodeLiteral = (value: string) =>
    value
      .replace(/\\([nrtbf()\\])/g, (_, ch: string) => {
        if (ch === 'n') return '\n'
        if (ch === 'r') return '\r'
        if (ch === 't') return '\t'
        if (ch === 'b') return '\b'
        if (ch === 'f') return '\f'
        return ch
      })
      .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)))

  const decodeHex = (hex: string) => {
    const normalized = hex.length % 2 === 0 ? hex : `${hex}0`
    const bytes = Buffer.from(normalized, 'hex')

    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      let out = ''
      for (let i = 2; i + 1 < bytes.length; i += 2) {
        out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1])
      }
      return out
    }

    return bytes.toString('utf8')
  }

  let match: RegExpExecArray | null = null
  while ((match = streamRegex.exec(binary)) !== null) {
    const rawStream = Buffer.from(match[1], 'latin1')
    const candidates: Buffer[] = [rawStream]

    try {
      const inflated = inflateSync(new Uint8Array(rawStream))
      candidates.push(Buffer.from(inflated))
    } catch {
      // not flate encoded
    }

    for (const candidate of candidates) {
      const text = candidate.toString('latin1')

      const literalMatches = text.match(/\((?:\\.|[^\\()])*\)\s*Tj/g) || []
      for (const entry of literalMatches) {
        const literal = entry.slice(1, entry.lastIndexOf(')'))
        const decoded = decodeLiteral(literal).trim()
        if (decoded) extractedChunks.push(decoded)
      }

      const hexMatches = text.match(/<([0-9A-Fa-f]+)>\s*Tj/g) || []
      for (const entry of hexMatches) {
        const hex = entry.slice(1, entry.indexOf('>'))
        const decoded = decodeHex(hex).trim()
        if (decoded) extractedChunks.push(decoded)
      }
    }
  }

  const text = extractedChunks.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!text) {
    throw new Error('PDFからテキストを抽出できませんでした（画像ベースのPDFの可能性があります）')
  }

  return [
    `PDFファイル: ${file.name}`,
    `ファイルサイズ: ${(file.size / 1024).toFixed(2)} KB`,
    `文字数: ${text.length}`,
    '',
    '===== PDF内容 =====',
    text,
  ].join('\n')
}

export async function GET() {
  return NextResponse.json({ message: 'Summarization API is running' })
}
