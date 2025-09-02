'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Image, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  File,
  Calendar,
  User,
  Hash,
  Globe,
  MapPin,
  Phone,
  Mail,
  Folder,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { residentPhotosApi } from '../../lib/api-service';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'scan' | 'other';
  size: string;
  uploadDate: string;
  url?: string;
  category: string;
  documentType?: 'bijlage26' | 'toewijzing' | 'passport' | 'geboorteakte' | 'other';
  file?: File;
}

interface ResidentDocumentsModalProps {
  resident: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResidentDocumentsModal({ resident, isOpen, onClose }: ResidentDocumentsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('other');
  const [residentPhoto, setResidentPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resident photo from database and localStorage fallback
  useEffect(() => {
    const loadResidentPhoto = async () => {
      if (resident?.badge) {
        // First try to load from API
        try {
          const response = await residentPhotosApi.getAll();
          
          if (response.success && response.data) {
            // Try different key formats for badge number
            const badgeStr = String(resident.badge);
            const badgeNum = Number(resident.badge);
            const photo = response.data[badgeStr] || response.data[badgeNum] || response.data[resident.badge];
            
            if (photo) {
              setResidentPhoto(photo);
              return;
            }
          }
        } catch (error) {
          // API not available, continue to localStorage fallback
        }
        
        // Fallback to localStorage
        const localPhotos = localStorage.getItem('resident-photos');
        if (localPhotos) {
          try {
            const parsedPhotos = JSON.parse(localPhotos);
            const photo = parsedPhotos[String(resident.badge)];
            setResidentPhoto(photo || null);
          } catch (e) {
            console.error('Failed to parse localStorage photos:', e);
            setResidentPhoto(null);
          }
        } else {
          setResidentPhoto(null);
        }
      }
    };
    
    loadResidentPhoto();
  }, [resident?.badge]);

  if (!isOpen) return null;

  const categories = ['all', 'Fedasil Documenten', 'Identiteitsdocumenten', 'Medische Dossiers', 'Juridische Documenten', 'Overige'];

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadStatus('uploading');
      
      try {
        const newDocuments: Document[] = [];
        
        for (const file of Array.from(files)) {
          // Determine file type
          const fileType = file.type.includes('pdf') ? 'pdf' 
            : file.type.includes('image') ? 'image' 
            : 'scan';
          
          // Create object URL for preview
          const url = URL.createObjectURL(file);
          
          // Determine category based on selected document type
          let category = 'Overige';
          let documentType: Document['documentType'] = 'other';
          
          if (selectedDocumentType === 'bijlage26') {
            category = 'Fedasil Documenten';
            documentType = 'bijlage26';
          } else if (selectedDocumentType === 'toewijzing') {
            category = 'Fedasil Documenten';
            documentType = 'toewijzing';
          } else if (selectedDocumentType === 'passport') {
            category = 'Identiteitsdocumenten';
            documentType = 'passport';
          } else if (selectedDocumentType === 'geboorteakte') {
            category = 'Identiteitsdocumenten';
            documentType = 'geboorteakte';
          } else if (file.name.toLowerCase().includes('medical') || file.name.toLowerCase().includes('medisch')) {
            category = 'Medische Dossiers';
          } else if (file.name.toLowerCase().includes('legal') || file.name.toLowerCase().includes('juridisch')) {
            category = 'Juridische Documenten';
          }
          
          const newDocument: Document = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: fileType as Document['type'],
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString().split('T')[0],
            category,
            documentType,
            url,
            file
          };
          
          newDocuments.push(newDocument);
        }
        
        setDocuments(prev => [...prev, ...newDocuments]);
        setUploadStatus('success');
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setSelectedDocumentType('other');
        }, 3000);
        
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus('error');
        setTimeout(() => setUploadStatus('idle'), 3000);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDeleteDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc?.url) {
      URL.revokeObjectURL(doc.url);
    }
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    setDeleteConfirm(null);
  };

  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      // Open document in new tab
      window.open(doc.url, '_blank');
    }
    setPreviewDocument(doc);
  };

  const handleDownloadDocument = (doc: Document) => {
    if (doc.url && doc.file) {
      // Trigger download for uploaded documents
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getDocumentIcon = (doc: Document) => {
    // Special icons for specific document types
    if (doc.documentType === 'bijlage26') {
      return <FileText className="w-5 h-5 text-purple-500" />;
    }
    if (doc.documentType === 'toewijzing') {
      return <FileText className="w-5 h-5 text-indigo-500" />;
    }
    if (doc.documentType === 'passport') {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (doc.documentType === 'geboorteakte') {
      return <FileText className="w-5 h-5 text-teal-500" />;
    }
    
    // Default icons by file type
    switch (doc.type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'scan':
        return <File className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDocumentLabel = (doc: Document) => {
    switch (doc.documentType) {
      case 'bijlage26':
        return 'Bijlage 26';
      case 'toewijzing':
        return 'Toewijzing';
      case 'passport':
        return 'Paspoort';
      case 'geboorteakte':
        return 'Geboorte Akte';
      default:
        return doc.category;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {residentPhoto ? (
                    <img
                      src={residentPhoto}
                      alt={`${resident.firstName} ${resident.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-full p-3 flex items-center justify-center shadow-lg" title="Geen foto beschikbaar - Upload een foto in Bewoners Overzicht">
                      <User className="w-10 h-10 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {resident.firstName} {resident.lastName}
                  </h2>
                  <div className="flex items-center space-x-4 mt-1 text-blue-100">
                    <span className="flex items-center">
                      <Hash className="w-4 h-4 mr-1" />
                      Badge: {resident.badge}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Kamer: {resident.room || 'Niet toegewezen'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overzicht
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'documents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Documenten ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('required')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'required'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Verplichte Documenten
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {activeTab === 'required' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Verplichte Documenten Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fedasil Documents */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                      Fedasil Documenten
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" 
                          checked={documents.some(d => d.documentType === 'bijlage26')}
                          readOnly
                          className="rounded text-purple-600"
                        />
                        <span className={documents.some(d => d.documentType === 'bijlage26') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                          Bijlage 26
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox"
                          checked={documents.some(d => d.documentType === 'toewijzing')}
                          readOnly
                          className="rounded text-purple-600"
                        />
                        <span className={documents.some(d => d.documentType === 'toewijzing') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                          Toewijzing
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Identity Documents */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      Identiteitsdocumenten
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox"
                          checked={documents.some(d => d.documentType === 'passport')}
                          readOnly
                          className="rounded text-blue-600"
                        />
                        <span className={documents.some(d => d.documentType === 'passport') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                          Paspoort
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox"
                          checked={documents.some(d => d.documentType === 'geboorteakte')}
                          readOnly
                          className="rounded text-blue-600"
                        />
                        <span className={documents.some(d => d.documentType === 'geboorteakte') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                          Geboorte Akte
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Document Summary */}
                <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Documentenvolledigheid Status
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {documents.filter(d => ['bijlage26', 'toewijzing', 'passport', 'geboorteakte'].includes(d.documentType || '')).length} van 4 verplichte documenten geüpload
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round((documents.filter(d => ['bijlage26', 'toewijzing', 'passport', 'geboorteakte'].includes(d.documentType || '')).length / 4) * 100)}%
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(documents.filter(d => ['bijlage26', 'toewijzing', 'passport', 'geboorteakte'].includes(d.documentType || '')).length / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Persoonlijke Informatie
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Volledige Naam:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {resident.firstName} {resident.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Badgenummer:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {resident.badge}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">OV Nummer:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {resident.ovNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Nationaliteit:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {resident.nationality}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accommodation Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Verblijfsdetails
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Kamer:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {resident.room || 'Niet toegewezen'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        resident.status === 'Actief' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {resident.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                {/* Upload Status Messages */}
                {uploadStatus === 'uploading' && (
                  <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 dark:border-blue-300 mr-3"></div>
                    Documenten uploaden...
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Documenten succesvol geüpload!
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Fout bij uploaden documenten. Probeer opnieuw.
                  </div>
                )}

                {/* Document Controls */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'Alle Categorieën' : cat}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-600 dark:text-gray-400">
                      {filteredDocuments.length} document(en)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedDocumentType}
                      onChange={(e) => setSelectedDocumentType(e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      title="Selecteer documenttype voor betere organisatie"
                    >
                      <option value="other">Selecteer Documenttype</option>
                      <option value="bijlage26">Bijlage 26</option>
                      <option value="toewijzing">Toewijzing</option>
                      <option value="passport">Paspoort</option>
                      <option value="geboorteakte">Geboorte Akte</option>
                    </select>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Document Uploaden</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow relative"
                    >
                      {/* Delete Confirmation */}
                      {deleteConfirm === doc.id && (
                        <div className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg p-4 flex flex-col justify-center items-center z-10">
                          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                          <p className="text-sm text-center mb-3 text-gray-900 dark:text-gray-100">
                            Dit document verwijderen?
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Verwijderen
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400"
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getDocumentIcon(doc)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                              {doc.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.size} • {doc.uploadDate}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.documentType === 'bijlage26' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                          doc.documentType === 'toewijzing' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                          doc.documentType === 'passport' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          doc.documentType === 'geboorteakte' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          {getDocumentLabel(doc)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Bekijken"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                            title="Downloaden"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(doc.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredDocuments.length === 0 && (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      Nog geen documenten geüpload
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Upload PDF's, afbeeldingen of gescande documenten voor deze bewoner
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      Eerste Document Uploaden
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}