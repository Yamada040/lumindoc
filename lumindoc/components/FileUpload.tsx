'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({ 
  onFileSelect, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.pdf', '.txt']
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(rejection => {
      console.error('File rejected:', rejection.file.name, rejection.errors)
    })

    // Process accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading' as const
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach(({ id }) => {
      simulateUpload(id)
    })

    onFileSelect(acceptedFiles)
  }, [onFileSelect])

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 100, status: 'success' } : f
        ))
      } else {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ))
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles,
    maxSize,
    multiple: true
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
          "hover:border-blue-400 hover:bg-blue-50/50",
          isDragActive || dropzoneActive 
            ? "border-blue-500 bg-blue-50 scale-105" 
            : "border-gray-300 bg-gray-50/50"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <motion.div
            animate={{ 
              rotate: isDragActive ? 360 : 0,
              scale: isDragActive ? 1.2 : 1 
            }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Upload 
              className={cn(
                "w-16 h-16 transition-colors",
                isDragActive ? "text-blue-500" : "text-gray-400"
              )} 
            />
          </motion.div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? 'ファイルをドロップしてください' : 'ファイルをアップロード'}
            </h3>
            <p className="text-gray-600 mb-4">
              PDFまたはテキストファイルをドラッグ＆ドロップ、またはクリックして選択
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>対応形式: PDF, TXT</p>
              <p>最大ファイルサイズ: {formatFileSize(maxSize)}</p>
              <p>最大ファイル数: {maxFiles}個まで</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-blue-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragActive ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-3"
          >
            {uploadedFiles.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {uploadedFile.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-blue-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadedFile.progress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 min-w-[3rem]">
                          {Math.round(uploadedFile.progress)}%
                        </span>
                      </div>
                    )}
                    
                    {uploadedFile.status === 'success' && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                    
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    )}
                    
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}