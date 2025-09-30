import { createClient } from './client';
import type { Database } from './database.types';
import {
  createResidentFolderName,
  parseResidentFolderName,
  type ResidentInfo
} from './storage-organization-utils';

export interface StorageCleanupResult {
  success: boolean;
  deletedFiles: string[];
  errors: string[];
  folderPath: string;
}

// Delete all files in a resident's folder from a specific storage bucket
export async function deleteResidentFolder(
  bucketName: string,
  residentInfo: ResidentInfo
): Promise<StorageCleanupResult> {
  const supabase = createClient();

  const result: StorageCleanupResult = {
    success: true,
    deletedFiles: [],
    errors: [],
    folderPath: ''
  };

  try {
    console.log(`🗑️ Starting folder cleanup for resident ${residentInfo.badge} in bucket: ${bucketName}`);

    // Create the expected folder name
    const folderName = createResidentFolderName(residentInfo);
    result.folderPath = folderName;

    console.log(`📁 Target folder: ${folderName}`);

    // Step 1: List all files in the resident's folder
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderName, {
        limit: 1000, // Set a reasonable limit
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      if (listError.message?.includes('The resource was not found')) {
        console.log(`ℹ️ Folder ${folderName} does not exist in bucket ${bucketName} - nothing to clean`);
        return result;
      }
      throw new Error(`Failed to list files in folder: ${listError.message}`);
    }

    if (!fileList || fileList.length === 0) {
      console.log(`ℹ️ Folder ${folderName} is empty or does not exist - nothing to clean`);
      return result;
    }

    console.log(`📄 Found ${fileList.length} files to delete in folder ${folderName}`);

    // Step 2: Prepare file paths for deletion
    const filePaths = fileList.map(file => `${folderName}/${file.name}`);

    console.log('📋 Files to delete:', filePaths);

    // Step 3: Delete all files in the folder
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete files: ${deleteError.message}`);
    }

    // Track successful deletions
    result.deletedFiles = filePaths;

    console.log(`✅ Successfully deleted ${filePaths.length} files from folder ${folderName}`);

    // Step 4: The folder itself will be automatically removed when empty
    console.log(`📁 Folder ${folderName} automatically removed (empty folders are cleaned up by Supabase)`);

  } catch (error) {
    const errorMsg = `Failed to delete folder ${result.folderPath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    result.success = false;
    console.error('❌', errorMsg);
  }

  return result;
}

// Delete resident folder from IN documents bucket specifically
export async function deleteResidentInFolder(
  residentInfo: ResidentInfo
): Promise<StorageCleanupResult> {
  return deleteResidentFolder('administrative-documents', residentInfo);
}

// Delete resident folder from OUT documents bucket specifically
export async function deleteResidentOutFolder(
  residentInfo: ResidentInfo
): Promise<StorageCleanupResult> {
  return deleteResidentFolder('administrative-documents-out', residentInfo);
}

// Delete resident folders from both IN and OUT buckets
export async function deleteAllResidentFolders(
  residentInfo: ResidentInfo
): Promise<{
  inResult: StorageCleanupResult;
  outResult: StorageCleanupResult;
  overallSuccess: boolean;
}> {
  console.log(`🗑️ Cleaning up all folders for resident ${residentInfo.badge}`);

  const inResult = await deleteResidentInFolder(residentInfo);
  const outResult = await deleteResidentOutFolder(residentInfo);

  const overallSuccess = inResult.success && outResult.success;

  console.log(`📊 Cleanup summary for resident ${residentInfo.badge}:`);
  console.log(`  IN folder: ${inResult.success ? '✅' : '❌'} (${inResult.deletedFiles.length} files deleted)`);
  console.log(`  OUT folder: ${outResult.success ? '✅' : '❌'} (${outResult.deletedFiles.length} files deleted)`);
  console.log(`  Overall: ${overallSuccess ? '✅ Success' : '❌ Some errors occurred'}`);

  return {
    inResult,
    outResult,
    overallSuccess
  };
}

// List files in a resident's folder (for verification purposes)
export async function listResidentFolderContents(
  bucketName: string,
  residentInfo: ResidentInfo
): Promise<{
  files: string[];
  folderExists: boolean;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const folderName = createResidentFolderName(residentInfo);

    const { data: fileList, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderName);

    if (listError) {
      if (listError.message?.includes('The resource was not found')) {
        return { files: [], folderExists: false };
      }
      return { files: [], folderExists: false, error: listError.message };
    }

    const files = fileList ? fileList.map(file => `${folderName}/${file.name}`) : [];

    return {
      files,
      folderExists: files.length > 0
    };

  } catch (error) {
    return {
      files: [],
      folderExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Safe cleanup with verification - ensures we're only deleting the intended folders
export async function safeDeleteResidentInFolder(
  residentInfo: ResidentInfo,
  verifyBadgeMatch: boolean = true
): Promise<StorageCleanupResult> {
  console.log(`🔒 Safe cleanup for resident ${residentInfo.badge} IN folder`);

  // Step 1: Verify folder name matches expected pattern
  const expectedFolderName = createResidentFolderName(residentInfo);

  if (verifyBadgeMatch) {
    const parsedInfo = parseResidentFolderName(expectedFolderName);
    if (!parsedInfo || parsedInfo.badge !== residentInfo.badge) {
      return {
        success: false,
        deletedFiles: [],
        errors: ['Safety check failed: folder name does not match resident badge'],
        folderPath: expectedFolderName
      };
    }
  }

  // Step 2: List files first to verify contents
  const contents = await listResidentFolderContents('administrative-documents', residentInfo);

  if (contents.error) {
    return {
      success: false,
      deletedFiles: [],
      errors: [`Failed to verify folder contents: ${contents.error}`],
      folderPath: expectedFolderName
    };
  }

  if (!contents.folderExists) {
    console.log(`ℹ️ IN folder ${expectedFolderName} does not exist - nothing to clean`);
    return {
      success: true,
      deletedFiles: [],
      errors: [],
      folderPath: expectedFolderName
    };
  }

  console.log(`📋 Verified ${contents.files.length} files in IN folder before cleanup`);

  // Step 3: Proceed with deletion
  return deleteResidentInFolder(residentInfo);
}

// Enhanced cleanup result logging
export function logCleanupResult(result: StorageCleanupResult, bucketName: string): void {
  console.log(`\n📊 Storage cleanup result for bucket "${bucketName}":`);
  console.log(`📁 Folder: ${result.folderPath}`);
  console.log(`✅ Success: ${result.success}`);
  console.log(`📄 Files deleted: ${result.deletedFiles.length}`);

  if (result.deletedFiles.length > 0) {
    console.log(`📋 Deleted files:`);
    result.deletedFiles.forEach(file => console.log(`  - ${file}`));
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errors: ${result.errors.length}`);
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
}

export default {
  deleteResidentFolder,
  deleteResidentInFolder,
  deleteResidentOutFolder,
  deleteAllResidentFolders,
  listResidentFolderContents,
  safeDeleteResidentInFolder,
  logCleanupResult
};