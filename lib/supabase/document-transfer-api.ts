import { createClient } from './client';
import type { Database } from './database.types';
import {
  createResidentFolderName,
  createOrganizedStoragePath,
  createDocumentDescription,
  getStorageBucketName
} from './storage-organization-utils';
import {
  safeDeleteResidentInFolder,
  logCleanupResult,
  type StorageCleanupResult
} from './storage-cleanup-utils';

type AdminDocumentRow = Database['public']['Tables']['administrative_documents']['Row'];
type AdminDocumentInsert = Database['public']['Tables']['administrative_documents']['Insert'];

export interface DocumentTransferResult {
  success: boolean;
  transferredCount: number;
  errors: string[];
  transferredDocuments: {
    originalPath: string;
    newPath: string;
    fileName: string;
  }[];
  folderCleanup?: {
    attempted: boolean;
    success: boolean;
    deletedFiles: string[];
    cleanupErrors: string[];
  };
}

// Transfer all documents from IN to OUT bucket for a specific resident
export async function transferResidentDocumentsToOut(
  residentId: number,
  residentBadge: string,
  residentName: string
): Promise<DocumentTransferResult> {
  const supabase = createClient();

  const result: DocumentTransferResult = {
    success: true,
    transferredCount: 0,
    errors: [],
    transferredDocuments: []
  };

  try {
    console.log(`📂 Starting document transfer for resident ${residentBadge} (${residentName})`);

    // 1. Get all IN documents for this resident
    const { data: inDocuments, error: fetchError } = await supabase
      .from('administrative_documents')
      .select('*')
      .eq('resident_id', residentId)
      .eq('document_type', 'IN');

    if (fetchError) {
      result.errors.push(`Failed to fetch documents: ${fetchError.message}`);
      result.success = false;
      return result;
    }

    if (!inDocuments || inDocuments.length === 0) {
      console.log(`📄 No IN documents found for resident ${residentBadge}`);
      return result;
    }

    console.log(`📄 Found ${inDocuments.length} IN documents to transfer`);

    // 2. Transfer each document
    for (const doc of inDocuments) {
      try {
        await transferSingleDocument(doc, residentBadge, residentName, result);
      } catch (error) {
        const errorMsg = `Failed to transfer ${doc.file_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Document transfer completed. Transferred: ${result.transferredCount}, Errors: ${result.errors.length}`);

    // 3. Clean up the original IN folder if documents were successfully transferred
    if (result.transferredCount > 0) {
      console.log(`🗑️ Step 3: Cleaning up original IN folder for resident ${residentBadge}`);

      const residentInfo = {
        badge: residentBadge,
        firstName: '',
        lastName: '',
        fullName: residentName
      };

      try {
        const cleanupResult = await safeDeleteResidentInFolder(residentInfo, true);

        result.folderCleanup = {
          attempted: true,
          success: cleanupResult.success,
          deletedFiles: cleanupResult.deletedFiles,
          cleanupErrors: cleanupResult.errors
        };

        if (cleanupResult.success) {
          console.log(`✅ Successfully cleaned up IN folder: ${cleanupResult.deletedFiles.length} files deleted`);
        } else {
          console.warn(`⚠️ IN folder cleanup had errors:`, cleanupResult.errors);
        }

        logCleanupResult(cleanupResult, 'administrative-documents');

      } catch (cleanupError) {
        const cleanupErrorMsg = `Failed to clean up IN folder: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown error'}`;
        console.error('❌', cleanupErrorMsg);

        result.folderCleanup = {
          attempted: true,
          success: false,
          deletedFiles: [],
          cleanupErrors: [cleanupErrorMsg]
        };
      }
    } else {
      console.log('ℹ️ Skipping folder cleanup - no documents were transferred successfully');
      result.folderCleanup = {
        attempted: false,
        success: false,
        deletedFiles: [],
        cleanupErrors: ['No documents transferred - cleanup skipped']
      };
    }

    // If we had some successes but also errors, still consider it partially successful
    result.success = result.transferredCount > 0 || result.errors.length === 0;

  } catch (error) {
    const errorMsg = `Document transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    result.success = false;
    console.error('❌ Document transfer failed:', error);
  }

  return result;
}

// Transfer a single document from IN to OUT
async function transferSingleDocument(
  document: AdminDocumentRow,
  residentBadge: string,
  residentName: string,
  result: DocumentTransferResult
): Promise<void> {
  const supabase = createClient();

  console.log(`📄 Transferring document: ${document.file_name}`);

  // Extract filename from the file_path (remove the IN/ prefix if present)
  const fileName = document.file_name;
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Extract the storage path from the full URL
  let oldStoragePath = document.file_path;
  if (oldStoragePath.includes('supabase.co/storage/v1/object/public/administrative-documents/')) {
    oldStoragePath = oldStoragePath.split('supabase.co/storage/v1/object/public/administrative-documents/')[1];
  } else if (oldStoragePath.includes('/')) {
    oldStoragePath = oldStoragePath.split('/').slice(-1)[0];
  }

  console.log(`📂 Original storage path: ${oldStoragePath}`);

  // Create organized folder structure using utility functions
  const residentInfo = {
    badge: residentBadge,
    firstName: '',
    lastName: '',
    fullName: residentName
  };

  const folderName = createResidentFolderName(residentInfo);
  const newStoragePath = createOrganizedStoragePath(residentInfo, sanitizedFileName, 'OUT');

  console.log(`📁 Creating organized folder: ${folderName}`);
  console.log(`📄 New file path: ${newStoragePath}`);

  try {
    // 1. Download the file from administrative-documents bucket
    console.log(`📥 Downloading from administrative-documents bucket: ${oldStoragePath}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('administrative-documents')
      .download(oldStoragePath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    console.log(`📤 File downloaded successfully, size: ${fileData.size} bytes`);

    // 2. Upload to administrative-documents-out bucket
    console.log(`📤 Uploading to administrative-documents-out bucket: ${newStoragePath}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('administrative-documents-out')
      .upload(newStoragePath, fileData, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
        contentType: document.mime_type || 'application/octet-stream'
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`✅ File uploaded successfully to OUT bucket`);

    // 3. Create new public URL for OUT location
    const { data: publicUrlData } = supabase.storage
      .from('administrative-documents-out')
      .getPublicUrl(newStoragePath);

    // 4. Create new database entry for OUT document
    const outDocument: AdminDocumentInsert = {
      resident_id: document.resident_id,
      document_type: 'OUT',
      file_name: document.file_name,
      file_path: publicUrlData.publicUrl,
      file_size: document.file_size,
      mime_type: document.mime_type,
      description: createDocumentDescription(
        document.description || '',
        residentInfo,
        new Date().toLocaleDateString('nl-NL')
      ),
      uploaded_by: document.uploaded_by,
      // Add enhanced fields for better tracking
      resident_badge: residentBadge,
      resident_name: residentName,
      storage_path: newStoragePath
    };

    const { error: insertError } = await supabase
      .from('administrative_documents')
      .insert(outDocument);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // 5. Delete the original IN document from database (keep the file for backup)
    const { error: deleteError } = await supabase
      .from('administrative_documents')
      .delete()
      .eq('id', document.id);

    if (deleteError) {
      console.warn(`⚠️ Failed to delete original document record: ${deleteError.message}`);
      // Don't fail the transfer for this, just log it
    }

    // Optional: Delete original file from IN location (uncomment if you want to remove originals)
    // const { error: deleteFileError } = await supabase.storage
    //   .from('administrative-documents')
    //   .remove([document.file_path.replace('https://xxcbpsjefpogxgfellui.supabase.co/storage/v1/object/public/administrative-documents/', '')]);

    result.transferredCount++;
    result.transferredDocuments.push({
      originalPath: document.file_path,
      newPath: publicUrlData.publicUrl,
      fileName: document.file_name
    });

    console.log(`✅ Successfully transferred: ${document.file_name}`);

  } catch (error) {
    throw error; // Re-throw to be handled by caller
  }
}

// Copy documents to OUT without deleting originals (alternative approach)
export async function copyResidentDocumentsToOut(
  residentId: number,
  residentBadge: string,
  residentName: string
): Promise<DocumentTransferResult> {
  const supabase = createClient();

  const result: DocumentTransferResult = {
    success: true,
    transferredCount: 0,
    errors: [],
    transferredDocuments: []
  };

  try {
    console.log(`📂 Starting document copy for resident ${residentBadge} (${residentName})`);

    // Get all IN documents for this resident
    const { data: inDocuments, error: fetchError } = await supabase
      .from('administrative_documents')
      .select('*')
      .eq('resident_id', residentId)
      .eq('document_type', 'IN');

    if (fetchError) {
      result.errors.push(`Failed to fetch documents: ${fetchError.message}`);
      result.success = false;
      return result;
    }

    if (!inDocuments || inDocuments.length === 0) {
      console.log(`📄 No IN documents found for resident ${residentBadge}`);
      return result;
    }

    console.log(`📄 Found ${inDocuments.length} IN documents to copy`);

    // Copy each document
    for (const doc of inDocuments) {
      try {
        await copySingleDocument(doc, residentBadge, residentName, result);
      } catch (error) {
        const errorMsg = `Failed to copy ${doc.file_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`✅ Document copy completed. Copied: ${result.transferredCount}, Errors: ${result.errors.length}`);
    result.success = result.transferredCount > 0 || result.errors.length === 0;

  } catch (error) {
    const errorMsg = `Document copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    result.success = false;
    console.error('❌ Document copy failed:', error);
  }

  return result;
}

// Copy a single document (keeps original)
async function copySingleDocument(
  document: AdminDocumentRow,
  residentBadge: string,
  residentName: string,
  result: DocumentTransferResult
): Promise<void> {
  const supabase = createClient();

  console.log(`📄 Copying document: ${document.file_name}`);

  const fileName = document.file_name;
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Create organized folder structure using utility functions
  const residentInfo = {
    badge: residentBadge,
    firstName: '',
    lastName: '',
    fullName: residentName
  };

  const folderName = createResidentFolderName(residentInfo);
  const newStoragePath = createOrganizedStoragePath(residentInfo, sanitizedFileName, 'OUT');

  console.log(`📁 Creating organized folder: ${folderName}`);
  console.log(`📄 New file path: ${newStoragePath}`);

  try {
    // 1. Extract the storage path from the full URL
    let originalPath = document.file_path;
    if (originalPath.includes('supabase.co/storage/v1/object/public/administrative-documents/')) {
      originalPath = originalPath.split('supabase.co/storage/v1/object/public/administrative-documents/')[1];
    } else if (originalPath.includes('/')) {
      originalPath = originalPath.split('/').slice(-1)[0];
    }

    console.log(`📥 Copying from administrative-documents bucket: ${originalPath}`);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('administrative-documents')
      .download(originalPath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    // 2. Upload to administrative-documents-out bucket
    const { error: uploadError } = await supabase.storage
      .from('administrative-documents-out')
      .upload(newStoragePath, fileData, {
        cacheControl: '3600',
        upsert: true,
        contentType: document.mime_type || 'application/octet-stream'
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. Create new public URL for OUT location
    const { data: publicUrlData } = supabase.storage
      .from('administrative-documents-out')
      .getPublicUrl(newStoragePath);

    // 4. Create new database entry for OUT document (keeps original IN document)
    const outDocument: AdminDocumentInsert = {
      resident_id: document.resident_id,
      document_type: 'OUT',
      file_name: document.file_name,
      file_path: publicUrlData.publicUrl,
      file_size: document.file_size,
      mime_type: document.mime_type,
      description: createDocumentDescription(
        document.description || '',
        residentInfo,
        new Date().toLocaleDateString('nl-NL')
      ),
      uploaded_by: document.uploaded_by,
      resident_badge: residentBadge,
      resident_name: residentName,
      storage_path: newStoragePath
    };

    const { error: insertError } = await supabase
      .from('administrative_documents')
      .insert(outDocument);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    result.transferredCount++;
    result.transferredDocuments.push({
      originalPath: document.file_path,
      newPath: publicUrlData.publicUrl,
      fileName: document.file_name
    });

    console.log(`✅ Successfully copied: ${document.file_name}`);

  } catch (error) {
    throw error;
  }
}

// Get transfer status for a resident
export async function getDocumentTransferStatus(residentId: number): Promise<{
  inDocuments: number;
  outDocuments: number;
  hasTransferred: boolean;
}> {
  const supabase = createClient();

  try {
    // Count IN documents
    const { count: inCount, error: inError } = await supabase
      .from('administrative_documents')
      .select('*', { count: 'exact', head: true })
      .eq('resident_id', residentId)
      .eq('document_type', 'IN');

    // Count OUT documents
    const { count: outCount, error: outError } = await supabase
      .from('administrative_documents')
      .select('*', { count: 'exact', head: true })
      .eq('resident_id', residentId)
      .eq('document_type', 'OUT');

    if (inError || outError) {
      console.error('Error getting transfer status:', inError || outError);
      return { inDocuments: 0, outDocuments: 0, hasTransferred: false };
    }

    return {
      inDocuments: inCount || 0,
      outDocuments: outCount || 0,
      hasTransferred: (outCount || 0) > 0
    };

  } catch (error) {
    console.error('Error getting transfer status:', error);
    return { inDocuments: 0, outDocuments: 0, hasTransferred: false };
  }
}