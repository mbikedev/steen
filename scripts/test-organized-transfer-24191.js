// Test script for organized document transfer with folder structure
// Run this in the browser console on the Administrative Documents page

async function testOrganizedTransfer24191() {
  console.log('🗂️ Testing organized document transfer for resident badge 24191');
  console.log('📁 New folder structure: Badge_FirstName_LastName/filename.ext');

  try {
    // Step 1: Find resident information
    console.log('\n📊 Step 1: Finding resident 24191...');

    const residentsResponse = await fetch('/api/residents');
    if (!residentsResponse.ok) {
      throw new Error('Failed to fetch residents');
    }

    const residents = await residentsResponse.json();
    const resident = residents.find(r => r.badge.toString() === '24191');

    if (!resident) {
      console.error('❌ Resident with badge 24191 not found');
      return;
    }

    const residentName = `${resident.first_name} ${resident.last_name}`;
    const expectedFolderName = `24191_${residentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}`;

    console.log('✅ Found resident:', {
      id: resident.id,
      badge: resident.badge,
      name: residentName,
      expectedFolder: expectedFolderName,
      status: resident.status
    });

    // Step 2: Check current documents and predict new structure
    console.log('\n📄 Step 2: Analyzing current documents...');

    try {
      const documentsResponse = await fetch(`/api/administrative-documents?resident_id=${resident.id}`);
      const documents = await documentsResponse.json();

      console.log(`Found ${documents.length} total documents:`);
      const inDocs = documents.filter(d => d.document_type === 'IN');
      const outDocs = documents.filter(d => d.document_type === 'OUT');

      console.log(`- IN documents: ${inDocs.length}`);
      console.log(`- OUT documents: ${outDocs.length}`);

      console.log('\n📁 Predicted folder structure after transfer:');
      console.log(`Folder: administrative-documents-out/${expectedFolderName}/`);

      inDocs.forEach(doc => {
        const sanitizedFileName = doc.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
        console.log(`  📄 ${sanitizedFileName}`);
        console.log(`      Original: ${doc.file_path}`);
        console.log(`      New: administrative-documents-out/${expectedFolderName}/${sanitizedFileName}`);
      });

      if (inDocs.length === 0) {
        console.log('ℹ️ No IN documents found to transfer');

        // Check if there are already OUT documents
        if (outDocs.length > 0) {
          console.log('\n📁 Existing OUT documents:');
          outDocs.forEach(doc => {
            console.log(`  📄 ${doc.file_name} (${doc.file_path})`);
          });
        }
        return;
      }

    } catch (docError) {
      console.error('❌ Error fetching documents:', docError);
      console.log('Continuing with transfer attempt...');
    }

    // Step 3: Perform organized transfer
    console.log('\n🗂️ Step 3: Starting organized document transfer...');

    const transferResponse = await fetch('/api/documents/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        residentId: resident.id,
        residentBadge: '24191',
        residentName: residentName,
        transferMethod: 'transfer' // Use transfer to move documents
      })
    });

    if (!transferResponse.ok) {
      const errorText = await transferResponse.text();
      throw new Error(`Transfer API failed: ${transferResponse.status} - ${errorText}`);
    }

    const transferResult = await transferResponse.json();
    console.log('📊 Transfer result:', transferResult);

    if (transferResult.success) {
      console.log('✅ Organized transfer completed successfully!');
      console.log(`📄 Transferred ${transferResult.transferredCount} documents`);

      console.log('\n📁 Document organization details:');
      if (transferResult.transferredDocuments) {
        transferResult.transferredDocuments.forEach(doc => {
          console.log(`  ✅ ${doc.fileName}`);
          console.log(`     From: ${doc.originalPath}`);
          console.log(`     To:   ${doc.newPath}`);

          // Extract folder from new path
          const pathParts = doc.newPath.split('/');
          const folderName = pathParts[pathParts.length - 2]; // Get folder name
          if (folderName && folderName.includes('24191')) {
            console.log(`     📁 Folder: ${folderName}`);
          }
        });
      }

      if (transferResult.errors && transferResult.errors.length > 0) {
        console.warn('\n⚠️ Some errors occurred:');
        transferResult.errors.forEach(error => console.warn(`  - ${error}`));
      }

      // Step 4: Update youth overview
      console.log('\n📊 Step 4: Updating youth overview...');
      try {
        const youthUpdateResponse = await fetch(`/api/youth-overview/24191/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tab: 'OUT',
            datum_transfer: new Date().toISOString().split('T')[0],
            out_status: 'Uitgegaan',
            transferdossier_verzonden: `${transferResult.transferredCount} documenten overgedragen naar ${expectedFolderName}`
          })
        });

        const youthResult = await youthUpdateResponse.json();
        console.log('Youth overview update:', youthResult);
      } catch (youthError) {
        console.warn('⚠️ Youth overview update failed:', youthError);
      }

      // Step 5: Verify organized structure
      console.log('\n✅ Step 5: Verifying organized structure...');
      const verifyResponse = await fetch(`/api/documents/transfer?residentId=${resident.id}`);
      const verifyResult = await verifyResponse.json();
      console.log('Post-transfer status:', verifyResult);

      console.log('\n🎉 Organized transfer completed!');
      console.log('\n📋 Verification steps:');
      console.log('1. Go to Supabase Dashboard > Storage > administrative-documents-out');
      console.log(`2. Look for folder: ${expectedFolderName}`);
      console.log('3. Verify all documents are inside the resident folder');
      console.log('4. Check that documents are easily identifiable by resident');
      console.log('5. Test document access from OUT section in app');

      console.log('\n📁 Expected folder structure:');
      console.log(`administrative-documents-out/`);
      console.log(`├── ${expectedFolderName}/`);
      console.log(`│   ├── bijlage26_document.pdf`);
      console.log(`│   ├── toewijzing_document.pdf`);
      console.log(`│   ├── passport_scan.jpg`);
      console.log(`│   └── other_documents...`);

    } else {
      console.error('❌ Organized transfer failed:', transferResult.errors);
    }

  } catch (error) {
    console.error('❌ Organized transfer test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that storage organization utilities are properly imported');
    console.log('2. Verify administrative-documents-out bucket exists');
    console.log('3. Check bucket permissions allow folder creation');
    console.log('4. Verify document paths are correctly formatted');
  }
}

// Function to simulate folder structure for any resident
function simulateFolderStructure(badge, firstName, lastName) {
  const fullName = `${firstName} ${lastName}`;
  const sanitizedName = fullName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const folderName = `${badge}_${sanitizedName}`;

  console.log(`📁 Folder structure simulation for ${fullName}:`);
  console.log(`Badge: ${badge}`);
  console.log(`Folder name: ${folderName}`);
  console.log(`Full path example: administrative-documents-out/${folderName}/bijlage26.pdf`);

  return folderName;
}

// Function to check existing folder organization
async function checkExistingFolderOrganization() {
  console.log('🗂️ Checking existing folder organization...');

  console.log('\n📋 To manually verify folder organization:');
  console.log('1. Go to Supabase Dashboard');
  console.log('2. Navigate to Storage > administrative-documents-out');
  console.log('3. Look for folders with format: Badge_FirstName_LastName');
  console.log('4. Each folder should contain that resident\'s documents');

  console.log('\n📁 Folder naming examples:');
  console.log('- 24191_John_Doe');
  console.log('- 12345_Maria_Garcia');
  console.log('- 67890_Ahmed_Hassan');

  console.log('\n📄 File organization within folders:');
  console.log('- bijlage26_document.pdf');
  console.log('- toewijzing_form.pdf');
  console.log('- passport_scan.jpg');
  console.log('- medical_records.pdf');
}

// Auto-run
console.log('🗂️ Organized Document Transfer Test for Resident 24191');
console.log('📁 New feature: Documents organized in resident folders!');
console.log('\nCommands:');
console.log('- testOrganizedTransfer24191() - Test with folder organization');
console.log('- simulateFolderStructure(badge, firstName, lastName) - Preview folder names');
console.log('- checkExistingFolderOrganization() - Check current organization');

console.log('\n🎯 Benefits of folder organization:');
console.log('✅ Easy to identify which documents belong to which resident');
console.log('✅ No more generic filenames confusion');
console.log('✅ Better storage management and cleanup');
console.log('✅ Scalable for hundreds of residents');

console.log('\n⚠️ Ready to test organized transfer for resident 24191?');
console.log('Run: testOrganizedTransfer24191()');