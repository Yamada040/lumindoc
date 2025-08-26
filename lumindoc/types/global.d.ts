declare module 'pdf-parse' {
  interface PDFInfo {
    numpages: number
    numrender: number
    info: any
    metadata: any
    version: string
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: any
    metadata: any
    text: string
    version: string
  }

  function pdf(buffer: Buffer | Uint8Array, options?: any): Promise<PDFData>

  export = pdf
}
