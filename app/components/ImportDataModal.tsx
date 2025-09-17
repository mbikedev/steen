'use client'

import { useState } from 'react'
import { X, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { useData } from '@/lib/DataContext'
import { toast } from 'sonner'

interface ImportDataModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'complete'>('upload')
  const [importResults, setImportResults] = useState<{ successful: number; errors: number }>({ successful: 0, errors: 0 })
  
  const { addMultipleToDataMatchIt, refreshResidents } = useData()

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process file')
      }
      
      const result = await response.json()
      setPreviewData(result.data)
      setImportStep('preview')
      
      toast.success(`File processed successfully! Found ${result.count} residents.`)
    } catch (error: any) {
      console.error('File processing error:', error)
      toast.error(error.message || 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    setIsProcessing(true)
    
    try {
      await addMultipleToDataMatchIt(previewData)
      await refreshResidents()
      
      setImportResults({ successful: previewData.length, errors: 0 })
      setImportStep('complete')
      
      toast.success(`Successfully imported ${previewData.length} residents!`)
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error('Failed to import data')
      setImportResults({ successful: 0, errors: previewData.length })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewData([])
    setImportStep('upload')
    setImportResults({ successful: 0, errors: 0 })
    onClose()
  }

  const downloadTemplate = () => {
    const template = [
      ['Badge', 'Voornaam', 'Achternaam', 'Kamer', 'Nationaliteit', 'OV Nummer', 'Register Nummer', 'Geboortedatum', 'Leeftijd', 'Geslacht', 'Contact Persoon', 'Datum In', 'Status', 'Opmerkingen'],
      ['1001', 'Jan', 'Doe', '1.06', 'Nederlandse', 'OV123456', 'REG001', '1990-01-01', '34', 'M', 'John Doe Sr.', '2024-01-01', 'Actief', 'Test resident']
    ]
    
    const csvContent = template.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resident_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Import Resident Data
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload Excel (.xlsx, .xls) or PDF files containing resident information
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={downloadTemplate}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <Download size={16} />
          <span>Download Template</span>
        </button>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <FileSpreadsheet className="h-12 w-12 text-green-500" />
            <FileText className="h-12 w-12 text-red-500" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supports .xlsx, .xls, and .pdf files
            </p>
          </div>
          
          <input
            type="file"
            accept=".xlsx,.xls,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                <FileText className="h-8 w-8 text-red-500" />
              ) : (
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {isProcessing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Preview Import Data
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review the data before importing ({previewData.length} residents found)
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Badge</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Room</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nationality</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {previewData.slice(0, 10).map((resident, index) => (
              <tr key={index}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{resident.badge || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {`${resident.firstName || ''} ${resident.lastName || ''}`.trim() || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{resident.room || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{resident.nationality || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {previewData.length > 10 && (
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 text-center">
            ... and {previewData.length - 10} more residents
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setImportStep('upload')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Importing...' : `Import ${previewData.length} Residents`}
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Import Complete!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Successfully imported {importResults.successful} residents
          {importResults.errors > 0 && ` (${importResults.errors} errors)`}
        </p>
      </div>

      <button
        onClick={handleClose}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Done
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import Data
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {importStep === 'upload' && renderUploadStep()}
          {importStep === 'preview' && renderPreviewStep()}
          {importStep === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  )
}