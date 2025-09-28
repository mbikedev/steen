'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GeneralDocumentsUploader from '../../components/GeneralDocumentsUploader';
import GeneralDocumentsList from '../../components/GeneralDocumentsList';
import { FileText, Upload, RefreshCw } from 'lucide-react';
import { apiService } from '@/lib/api-service';

export default function GeneralDocumentsPage() {
  const [showUploader, setShowUploader] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // For now, we'll assume all authenticated users can view, but only admins can upload
  // In production, you'd check the user's role from context or session
  const isAdmin = true; // TODO: Get from auth context

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
    setShowUploader(false);
  };

  const handleSyncFromStorage = async () => {
    if (!confirm('This will import all unsynced files from storage to general documents. Continue?')) {
      return;
    }

    setIsSyncing(true);

    try {
      const result = await apiService.syncStorageToGeneralDocuments();

      if (result.synced > 0) {
        alert(`Successfully synced ${result.synced} documents from storage!`);
        setRefreshKey(prev => prev + 1);
      } else {
        alert('All documents are already synced.');
      }

      if (result.errors.length > 0) {
        console.error('Sync errors:', result.errors);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync documents from storage');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground font-title">
              OOC STEENOKKERZEEL
            </h1>
            <div className="flex items-center justify-center mt-2">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              <span className="text-lg text-muted-foreground">General Documents</span>
            </div>
          </div>

          <div className="bg-card shadow-sm rounded-lg p-4 mb-6 border border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Administrative documents accessible to all residents and staff
                </p>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={handleSyncFromStorage}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync from Storage'}
                    </button>
                    <button
                      onClick={() => setShowUploader(!showUploader)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {showUploader ? 'Hide Uploader' : 'Upload Document'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Uploader (Admin only) */}
        {isAdmin && showUploader && (
          <div className="mb-6">
            <GeneralDocumentsUploader onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Documents List */}
        <div key={refreshKey}>
          <GeneralDocumentsList
            allowEdit={isAdmin}
            onDocumentDeleted={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
