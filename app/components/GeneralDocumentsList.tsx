'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Filter, Search, Tag, Calendar, Eye } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { formatDate } from '@/lib/utils';

interface GeneralDocument {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  category?: string | null;
  tags?: string[] | null;
  created_at?: string;
}

interface GeneralDocumentsListProps {
  allowEdit?: boolean;
  onDocumentDeleted?: () => void;
}

export default function GeneralDocumentsList({ allowEdit = false, onDocumentDeleted }: GeneralDocumentsListProps) {
  const [documents, setDocuments] = useState<GeneralDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GeneralDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'policy', label: 'Policy' },
    { value: 'form', label: 'Form' },
    { value: 'template', label: 'Template' },
    { value: 'notice', label: 'Notice' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'safety', label: 'Safety' },
  ];

  // Extract unique tags from all documents
  const allTags = Array.from(new Set(
    documents.flatMap(doc => doc.tags || [])
  )).sort();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, selectedCategory, selectedTag]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getGeneralDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.file_name.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(doc => doc.tags?.includes(selectedTag));
    }

    setFilteredDocuments(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiService.deleteGeneralDocument(id);
      await fetchDocuments();
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document');
    }
  };

  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return <FileText className="w-5 h-5" />;

    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('image')) return <FileText className="w-5 h-5 text-purple-500" />;

    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Unknown size';

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary appearance-none"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No documents found</p>
          {searchTerm || selectedCategory !== 'all' || selectedTag ? (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start">
                  {getFileIcon(doc.mime_type)}
                  <div className="ml-3 flex-1">
                    <h4 className="font-semibold text-foreground line-clamp-1">
                      {doc.title}
                    </h4>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <FileText className="w-3 h-3 mr-1" />
                  <span className="line-clamp-1">{doc.file_name}</span>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <Download className="w-3 h-3 mr-1" />
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>

                {doc.category && (
                  <div className="flex items-center text-muted-foreground">
                    <Filter className="w-3 h-3 mr-1" />
                    <span className="capitalize">{doc.category}</span>
                  </div>
                )}

                {doc.created_at && (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(new Date(doc.created_at))}</span>
                  </div>
                )}

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </a>
                <a
                  href={doc.file_url}
                  download={doc.file_name}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>
                {allowEdit && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
