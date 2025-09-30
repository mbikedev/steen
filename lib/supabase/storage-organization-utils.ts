// Utility functions for organizing storage folders by resident

export interface ResidentInfo {
  badge: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

// Create standardized folder name for a resident
export function createResidentFolderName(residentInfo: ResidentInfo): string {
  const { badge, firstName, lastName, fullName } = residentInfo;

  // Use fullName if provided, otherwise combine firstName and lastName
  const name = fullName || `${firstName} ${lastName}`;

  // Sanitize name: remove special characters, replace spaces with underscores
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();

  // Create folder name: Badge_FirstName_LastName
  return `${badge}_${sanitizedName}`;
}

// Create full storage path with folder organization
export function createOrganizedStoragePath(
  residentInfo: ResidentInfo,
  fileName: string,
  documentType: 'IN' | 'OUT' = 'OUT'
): string {
  const folderName = createResidentFolderName(residentInfo);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Create path with document type prefix and resident folder
  // Structure: IN/24191_John_Doe/file.pdf or OUT/24191_John_Doe/file.pdf
  return `${documentType}/${folderName}/${sanitizedFileName}`;
}

// Extract resident info from folder name
export function parseResidentFolderName(folderName: string): {
  badge: string;
  name: string;
} | null {
  // Expected format: Badge_FirstName_LastName
  const parts = folderName.split('_');

  if (parts.length < 2) {
    return null;
  }

  const badge = parts[0];
  const name = parts.slice(1).join(' ').replace(/_/g, ' ');

  return { badge, name };
}

// Get folder list for a bucket (useful for admin/organization purposes)
export function getExpectedFolderName(badge: string, fullName: string): string {
  return createResidentFolderName({
    badge,
    firstName: '',
    lastName: '',
    fullName
  });
}

// Validate folder name format
export function isValidResidentFolderName(folderName: string): boolean {
  // Check if folder name follows Badge_Name format
  const regex = /^[0-9A-Za-z]+_[A-Za-z0-9_]+$/;
  return regex.test(folderName);
}

// Create description with folder information
export function createDocumentDescription(
  originalDescription: string,
  residentInfo: ResidentInfo,
  transferDate?: string
): string {
  const folderName = createResidentFolderName(residentInfo);
  const dateStr = transferDate || new Date().toLocaleDateString('nl-NL');

  if (originalDescription) {
    return `${originalDescription} (Bewoner: ${folderName}, Overgedragen: ${dateStr})`;
  } else {
    return `Document voor bewoner ${folderName} (Overgedragen: ${dateStr})`;
  }
}

// Get storage bucket name based on document type
export function getStorageBucketName(documentType: 'IN' | 'OUT'): string {
  return documentType === 'OUT'
    ? 'administrative-documents-out'
    : 'administrative-documents';
}

// Create file upload path for new documents
export function createUploadPath(
  residentInfo: ResidentInfo,
  fileName: string,
  documentType: 'IN' | 'OUT' = 'IN'
): {
  bucketName: string;
  storagePath: string;
  fullPath: string;
} {
  const bucketName = getStorageBucketName(documentType);
  const storagePath = createOrganizedStoragePath(residentInfo, fileName, documentType);
  const fullPath = `${bucketName}/${storagePath}`;

  return {
    bucketName,
    storagePath,
    fullPath
  };
}

// Helper to extract file extension
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

// Create standardized file name with document type
export function createStandardizedFileName(
  originalFileName: string,
  documentType: string,
  residentBadge: string
): string {
  const extension = getFileExtension(originalFileName);
  const baseName = originalFileName.replace(`.${extension}`, '');

  // If the file already includes document type, don't duplicate
  if (baseName.toLowerCase().includes(documentType.toLowerCase())) {
    return originalFileName;
  }

  // Add document type to filename for better identification
  const standardizedName = `${documentType}_${baseName}`;
  return extension ? `${standardizedName}.${extension}` : standardizedName;
}

// Folder structure examples and patterns
export const STORAGE_EXAMPLES = {
  // Example folder structures (both IN and OUT now organized):
  residentFolder: "24191_John_Doe",
  inDocument: "IN/24191_John_Doe/bijlage26_document.pdf",
  outDocument: "OUT/24191_John_Doe/bijlage26_document.pdf",

  // Storage bucket organization:
  bucketStructure: {
    'administrative-documents': 'IN/24191_John_Doe/bijlage26_document.pdf',
    'administrative-documents-out': 'OUT/24191_John_Doe/ontslagbrief_document.pdf'
  },

  // Common document types:
  documentTypes: [
    'bijlage26',
    'toewijzing',
    'passport',
    'geboorteakte',
    'identiteitsdocument',
    'medische_documenten',
    'ontslagbrief',
    'eindrapport',
    'doorverwijzingsdocumenten'
  ],

  // Folder naming rules:
  rules: {
    format: "Badge_FirstName_LastName",
    example: "24191_John_Doe",
    notes: "Special characters removed, spaces become underscores",
    applies: "Both IN and OUT documents use same folder structure"
  }
};

export default {
  createResidentFolderName,
  createOrganizedStoragePath,
  parseResidentFolderName,
  getExpectedFolderName,
  isValidResidentFolderName,
  createDocumentDescription,
  getStorageBucketName,
  createUploadPath,
  getFileExtension,
  createStandardizedFileName,
  STORAGE_EXAMPLES
};