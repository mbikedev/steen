// Migration script to organize existing IN documents into resident folders
// Run this in the browser console on the Administrative Documents page

async function migrateInDocumentsToFolders() {
  console.log('🗂️ Starting migration of IN documents to organized folder structure');
  console.log('📁 This will reorganize existing unorganized IN documents into resident folders');

  try {
    // Step 1: Fetch all IN documents from database
    console.log('\n📊 Step 1: Fetching all IN documents...');

    const documentsResponse = await fetch('/api/administrative-documents?type=IN');
    if (!documentsResponse.ok) {
      throw new Error(`Failed to fetch IN documents: ${documentsResponse.status}`);
    }

    const documents = await documentsResponse.json();
    console.log(`Found ${documents.length} total IN documents in database`);

    // Filter documents that need organization (those without resident folder structure)
    const unorganizedDocuments = documents.filter(doc => {
      // Check if document path doesn't follow organized structure (Badge_Name/filename)
      const filePath = doc.file_path || '';
      const pathSegments = filePath.split('/');
      const fileName = pathSegments[pathSegments.length - 1];

      // If the path doesn't contain a folder structure like "24191_John_Doe/filename.ext"
      const hasOrganizedFolder = pathSegments.some(segment =>
        segment.match(/^\d+_[A-Za-z0-9_]+$/) // Matches "Badge_Name" pattern
      );

      return !hasOrganizedFolder && doc.resident_id;
    });

    console.log(`Found ${unorganizedDocuments.length} documents that need organization`);
    console.log(`${documents.length - unorganizedDocuments.length} documents are already organized or have no resident`);

    if (unorganizedDocuments.length === 0) {
      console.log('✅ All IN documents are already organized! No migration needed.');
      return;
    }

    // Step 2: Fetch resident information for organizing
    console.log('\n📊 Step 2: Fetching resident information...');

    const residentsResponse = await fetch('/api/residents');
    if (!residentsResponse.ok) {
      throw new Error('Failed to fetch residents');
    }

    const residents = await residentsResponse.json();
    const residentLookup = {};
    residents.forEach(resident => {
      residentLookup[resident.id] = {
        badge: resident.badge.toString(),
        firstName: resident.first_name,
        lastName: resident.last_name,
        fullName: `${resident.first_name} ${resident.last_name}`
      };
    });

    console.log(`Loaded ${residents.length} residents for organization`);

    // Step 3: Group documents by resident
    console.log('\n📁 Step 3: Grouping documents by resident...');

    const documentsByResident = {};
    const documentsWithoutResident = [];

    unorganizedDocuments.forEach(doc => {
      if (doc.resident_id && residentLookup[doc.resident_id]) {
        if (!documentsByResident[doc.resident_id]) {
          documentsByResident[doc.resident_id] = [];
        }
        documentsByResident[doc.resident_id].push(doc);
      } else {
        documentsWithoutResident.push(doc);
      }
    });

    const residentIds = Object.keys(documentsByResident);
    console.log(`Documents organized by ${residentIds.length} residents`);
    console.log(`${documentsWithoutResident.length} documents have no valid resident (will be skipped)`);

    // Step 4: Migrate documents for each resident
    console.log('\n🚀 Step 4: Starting migration process...');

    const migrationResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const residentId of residentIds) {
      const resident = residentLookup[residentId];
      const residentDocuments = documentsByResident[residentId];

      console.log(`\n👤 Migrating ${residentDocuments.length} documents for ${resident.fullName} (${resident.badge})`);

      // Import storage organization utilities
      const { createResidentFolderName, createOrganizedStoragePath } =
        await import('../lib/supabase/storage-organization-utils.js');

      const residentInfo = {
        badge: resident.badge,
        firstName: resident.firstName,
        lastName: resident.lastName,
        fullName: resident.fullName
      };

      const folderName = createResidentFolderName(residentInfo);
      console.log(`📁 Target folder: ${folderName}`);

      // Migrate each document for this resident
      for (const doc of residentDocuments) {
        try {
          await migrateSingleDocument(doc, residentInfo, folderName, migrationResults);
        } catch (error) {
          migrationResults.failed++;
          migrationResults.errors.push(`${doc.file_name}: ${error.message}`);
          console.error(`❌ Failed to migrate ${doc.file_name}:`, error);
        }
      }
    }

    // Step 5: Show migration summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrationResults.success} documents`);
    console.log(`❌ Failed migrations: ${migrationResults.failed} documents`);

    if (migrationResults.errors.length > 0) {
      console.log('\n⚠️ Migration errors:');
      migrationResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n🎉 Migration process completed!');
    console.log('\n📋 Verification steps:');
    console.log('1. Go to Supabase Dashboard > Storage > administrative-documents');
    console.log('2. Verify resident folders have been created (format: Badge_FirstName_LastName)');
    console.log('3. Check that documents are inside the appropriate resident folders');
    console.log('4. Test document access from the application');

    return migrationResults;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that you have proper access to the API endpoints');
    console.log('2. Verify Supabase storage permissions');
    console.log('3. Check browser console for detailed error messages');

    throw error;
  }
}

// Helper function to migrate a single document
async function migrateSingleDocument(document, residentInfo, folderName, results) {
  console.log(`  📄 Migrating: ${document.file_name}`);

  // Extract current storage path from URL
  let currentPath = document.file_path;
  if (currentPath.includes('supabase.co/storage/v1/object/public/administrative-documents/')) {
    currentPath = currentPath.split('supabase.co/storage/v1/object/public/administrative-documents/')[1];
  } else if (currentPath.includes('/')) {
    currentPath = currentPath.split('/').pop(); // Get just the filename
  }

  // Create organized path
  const { createOrganizedStoragePath } = await import('../lib/supabase/storage-organization-utils.js');
  const sanitizedFileName = document.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const newPath = createOrganizedStoragePath(residentInfo, sanitizedFileName, 'IN');

  console.log(`    From: ${currentPath}`);
  console.log(`    To:   ${newPath}`);

  // If already organized, skip
  if (currentPath === newPath) {
    console.log('    ℹ️ Already organized, skipping');
    return;
  }

  try {
    // Step 1: Download from current location
    const downloadResponse = await fetch('/api/storage/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: 'administrative-documents',
        path: currentPath
      })
    });

    if (!downloadResponse.ok) {
      throw new Error(`Download failed: ${downloadResponse.status}`);
    }

    const fileBlob = await downloadResponse.blob();
    console.log(`    📥 Downloaded: ${fileBlob.size} bytes`);

    // Step 2: Upload to organized location
    const formData = new FormData();
    formData.append('file', fileBlob, document.file_name);
    formData.append('bucket', 'administrative-documents');
    formData.append('path', newPath);

    const uploadResponse = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    console.log(`    📤 Uploaded to organized location`);

    // Step 3: Update database record
    const newPublicUrl = `https://xxcbpsjefpogxgfellui.supabase.co/storage/v1/object/public/administrative-documents/${newPath}`;

    const updateResponse = await fetch(`/api/administrative-documents/${document.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_path: newPublicUrl,
        storage_path: newPath,
        resident_badge: residentInfo.badge,
        resident_name: residentInfo.fullName,
        description: document.description ?
          `${document.description} (Bewoner: ${folderName}, Gemigreerd: ${new Date().toLocaleDateString('nl-NL')})` :
          `Document voor bewoner ${folderName} (Gemigreerd: ${new Date().toLocaleDateString('nl-NL')})`
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Database update failed: ${updateResponse.status}`);
    }

    console.log(`    💾 Database record updated`);

    // Step 4: Delete old file (optional - comment out if you want to keep backups)
    // const deleteResponse = await fetch('/api/storage/delete', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     bucket: 'administrative-documents',
    //     paths: [currentPath]
    //   })
    // });
    //
    // if (deleteResponse.ok) {
    //   console.log(`    🗑️ Old file deleted`);
    // }

    results.success++;
    console.log(`    ✅ Migration completed for ${document.file_name}`);

  } catch (error) {
    console.error(`    ❌ Migration failed for ${document.file_name}:`, error);
    throw error;
  }
}

// Function to preview migration without making changes
async function previewInDocumentMigration() {
  console.log('🔍 Previewing IN document migration (no changes will be made)');

  try {
    const documentsResponse = await fetch('/api/administrative-documents?type=IN');
    const documents = await documentsResponse.json();

    const residentsResponse = await fetch('/api/residents');
    const residents = await residentsResponse.json();

    const residentLookup = {};
    residents.forEach(resident => {
      residentLookup[resident.id] = {
        badge: resident.badge.toString(),
        firstName: resident.first_name,
        lastName: resident.last_name,
        fullName: `${resident.first_name} ${resident.last_name}`
      };
    });

    console.log(`\n📊 Found ${documents.length} IN documents total`);

    const migrationPreview = {};
    let organizedCount = 0;
    let unorganizedCount = 0;

    documents.forEach(doc => {
      if (!doc.resident_id || !residentLookup[doc.resident_id]) {
        console.log(`⚠️ Document without valid resident: ${doc.file_name}`);
        return;
      }

      const resident = residentLookup[doc.resident_id];
      const folderName = `${resident.badge}_${resident.fullName.replace(/[^a-zA-Z0-9\\s]/g, '').replace(/\\s+/g, '_')}`;

      // Check if already organized
      const filePath = doc.file_path || '';
      const hasOrganizedFolder = filePath.includes(folderName);

      if (hasOrganizedFolder) {
        organizedCount++;
      } else {
        unorganizedCount++;
        if (!migrationPreview[folderName]) {
          migrationPreview[folderName] = [];
        }
        migrationPreview[folderName].push(doc.file_name);
      }
    });

    console.log(`\n📁 Migration Preview:`);
    console.log(`✅ Already organized: ${organizedCount} documents`);
    console.log(`📂 Need organization: ${unorganizedCount} documents`);

    if (Object.keys(migrationPreview).length > 0) {
      console.log(`\n📋 Documents to be organized by folder:`);
      Object.entries(migrationPreview).forEach(([folder, files]) => {
        console.log(`\n📁 ${folder}/`);
        files.forEach(filename => {
          console.log(`  📄 ${filename}`);
        });
      });
    }

    return migrationPreview;

  } catch (error) {
    console.error('❌ Preview failed:', error);
    throw error;
  }
}

// Auto-run information
console.log('🗂️ IN Document Migration Script');
console.log('📁 This script organizes existing IN documents into resident folders');
console.log('\nCommands:');
console.log('- previewInDocumentMigration() - Preview what will be migrated (safe)');
console.log('- migrateInDocumentsToFolders() - Run the actual migration');
console.log('\n⚠️ Before running migration:');
console.log('1. Preview the migration first to see what will be changed');
console.log('2. Backup your database and storage if needed');
console.log('3. Run during low-usage hours');
console.log('\n✅ Ready to preview migration?');
console.log('Run: previewInDocumentMigration()');