'use client';

import { useState } from 'react';
import { Upload, FileText, X, Tag } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface GeneralDocumentsUploaderProps {
  onUploadComplete?: () => void;
}

export default function GeneralDocumentsUploader({ onUploadComplete }: GeneralDocumentsUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'policy', label: 'Policy' },
    { value: 'form', label: 'Form' },
    { value: 'template', label: 'Template' },
    { value: 'notice', label: 'Notice' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'safety', label: 'Safety' },
  ];

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-populate title if empty
      if (!title) {
        const autoTitle = selectedFile.name
          .replace(/\.[^.]+$/, '') // Remove extension
          .replace(/^\d+_/, '') // Remove timestamp prefix
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letters
        setTitle(autoTitle);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please select a file and provide a title');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await apiService.uploadGeneralDocument(file, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('general');
      setTags([]);
      setCurrentTag('');

      // Notify parent
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Show success message
      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Upload className="w-5 h-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Upload General Document</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            placeholder="Document title"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            placeholder="Optional description"
            rows={3}
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
            disabled={isUploading}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Add tags..."
              disabled={isUploading}
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              disabled={isUploading || !currentTag.trim()}
            >
              <Tag className="w-4 h-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-destructive"
                    disabled={isUploading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            File <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            disabled={isUploading}
          />
          {file && (
            <p className="mt-1 text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || !title.trim() || isUploading}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </button>
      </div>
    </div>
  );
}
