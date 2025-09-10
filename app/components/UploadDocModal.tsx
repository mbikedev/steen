'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from "../../lib/DataContext";

interface UploadDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList | null) => void;
}

export default function UploadDocModal({ isOpen, onClose, onUpload }: UploadDocModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateAllData } = useData();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setSelectedFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles) return;

    setIsProcessing(true);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Process Excel files (including macro-enabled)
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.xlsm')) {
          await processExcelFile(file);
        }
      }
      
      // Call original onUpload for other file types
      onUpload(selectedFiles);
      
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Fout bij verwerken Excel bestand. Controleer het bestandsformaat.');
    } finally {
      setIsProcessing(false);
      setSelectedFiles(null);
      onClose();
    }
  };

  const processExcelFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('Processing Excel file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          console.log('File data loaded, size:', typeof data === 'string' ? data.length : 'not string');
          
          // Try different read methods for different file types
          let workbook;
          try {
            // For XLSM and newer formats, use array buffer
            if (file.name.endsWith('.xlsm')) {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            } else {
              // For XLS and XLSX, use binary string
              workbook = XLSX.read(data, { type: 'binary' });
            }
          } catch (readError) {
            console.error('Error reading workbook:', readError);
            // Fallback: try array buffer method
            const arrayBuffer = e.target?.result as ArrayBuffer;
            workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          }
          
          console.log('Workbook loaded. Sheets:', workbook.SheetNames);
          
          const excelData: any = {};
          
          // Process each sheet
          workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`Processing sheet ${index + 1}:`, sheetName);
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`Sheet "${sheetName}" has ${jsonData.length} rows:`, jsonData.slice(0, 2));
            
            // Map sheet names to data types
            const lowerSheetName = sheetName.toLowerCase();
            if (lowerSheetName.includes('bewoner') || lowerSheetName.includes('resident')) {
              console.log('Mapped to Bewonerslijst');
              excelData.Bewonerslijst = jsonData;
            } else if (lowerSheetName.includes('keuken') || lowerSheetName.includes('kitchen')) {
              console.log('Mapped to Keukenlijst');
              excelData.Keukenlijst = jsonData;
            } else if (lowerSheetName.includes('noord') || lowerSheetName.includes('north')) {
              console.log('Mapped to Noord');
              excelData.Noord = jsonData;
            } else if (lowerSheetName.includes('zuid') || lowerSheetName.includes('south')) {
              console.log('Mapped to Zuid');
              excelData.Zuid = jsonData;
            } else {
              // Default: treat as Bewonerslijst if no specific match
              console.log('No match found, defaulting to Bewonerslijst');
              excelData.Bewonerslijst = jsonData;
            }
          });
          
          console.log('Final Excel data structure:', Object.keys(excelData));
          
          // Update the data
          updateAllData(excelData);
          console.log('Data updated successfully');
          resolve();
          
        } catch (error) {
          console.error('Error processing Excel file:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('File reading failed');
        reject(new Error('File reading failed'));
      };
      
      // For XLSM files, use ArrayBuffer, for others use binary string
      if (file.name.endsWith('.xlsm')) {
        console.log('Reading XLSM file as ArrayBuffer');
        reader.readAsArrayBuffer(file);
      } else {
        console.log('Reading Excel file as binary string');
        reader.readAsBinaryString(file);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Documenten Uploaden</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Klik om te uploaden
                </span>
                <span className="text-gray-500"> of sleep en zet neer</span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.xlsm,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.txt,.rtf,.odt,.ppt,.pptx"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC, DOCX, Excel (XLS/XLSX/XLSM), Afbeeldingen (JPG, PNG, GIF), PowerPoint, Tekstbestanden tot 10MB elk
            </p>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Geselecteerde bestanden:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <span className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!selectedFiles || selectedFiles.length === 0 || isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Verwerken...' : 'Uploaden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}