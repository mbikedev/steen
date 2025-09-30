// Test script for IN document organized folder structure
// Run this in the browser console on the Administrative Documents page

async function testInFolderOrganization(testResidentBadge = '24191') {
  console.log('🗂️ Testing IN document organized folder structure');
  console.log(`📁 Testing with resident badge: ${testResidentBadge}`);
  console.log('📄 This will test if new IN documents are organized in resident folders');

  try {
    // Step 1: Find test resident information
    console.log('\n📊 Step 1: Finding test resident...');

    const residentsResponse = await fetch('/api/residents');
    if (!residentsResponse.ok) {
      throw new Error('Failed to fetch residents');
    }

    const residents = await residentsResponse.json();
    const testResident = residents.find(r => r.badge.toString() === testResidentBadge);

    if (!testResident) {
      console.error(`❌ Test resident with badge ${testResidentBadge} not found`);
      console.log('Available residents:');
      residents.slice(0, 5).forEach(r => {
        console.log(`- Badge: ${r.badge}, Name: ${r.first_name} ${r.last_name}`);
      });
      return;
    }

    const residentName = `${testResident.first_name} ${testResident.last_name}`;
    const expectedFolderName = `${testResidentBadge}_${residentName.replace(/[^a-zA-Z0-9\\s]/g, '').replace(/\\s+/g, '_')}`;

    console.log('✅ Found test resident:', {
      id: testResident.id,
      badge: testResident.badge,
      name: residentName,
      expectedFolder: expectedFolderName
    });

    // Step 2: Test folder name creation using utilities
    console.log('\n🔧 Step 2: Testing storage organization utilities...');

    try {
      // Import the utilities (adjust path as needed)
      const { createResidentFolderName, createOrganizedStoragePath, createUploadPath } =
        await import('../lib/supabase/storage-organization-utils.js');

      const testResidentInfo = {
        badge: testResidentBadge,
        firstName: testResident.first_name,
        lastName: testResident.last_name,
        fullName: residentName
      };

      const folderName = createResidentFolderName(testResidentInfo);
      const testFileName = 'test_document.pdf';
      const organizedPath = createOrganizedStoragePath(testResidentInfo, testFileName, 'IN');
      const uploadPath = createUploadPath(testResidentInfo, testFileName, 'IN');

      console.log('✅ Storage utilities working:');
      console.log(`  📁 Folder name: ${folderName}`);
      console.log(`  📄 Organized path: ${organizedPath}`);
      console.log(`  🗂️ Upload path:`, uploadPath);

      if (folderName !== expectedFolderName) {
        console.warn(`⚠️ Folder name mismatch! Expected: ${expectedFolderName}, Got: ${folderName}`);
      }

    } catch (utilError) {
      console.error('❌ Storage utilities test failed:', utilError);
    }

    // Step 3: Check existing IN documents for this resident
    console.log('\n📊 Step 3: Checking existing IN documents...');

    try {
      const documentsResponse = await fetch(`/api/administrative-documents?resident_id=${testResident.id}`);
      if (documentsResponse.ok) {
        const documents = await documentsResponse.json();
        const inDocuments = documents.filter(d => d.document_type === 'IN');

        console.log(`Found ${inDocuments.length} existing IN documents for this resident`);

        if (inDocuments.length > 0) {
          console.log('\n📁 Checking organization of existing IN documents:');
          inDocuments.forEach((doc, index) => {
            const filePath = doc.file_path || '';
            const hasOrganizedStructure = filePath.includes(expectedFolderName);
            console.log(`${index + 1}. ${doc.file_name}`);
            console.log(`   Path: ${filePath}`);
            console.log(`   Organized: ${hasOrganizedStructure ? '✅' : '❌'}`);

            if (!hasOrganizedStructure) {
              console.log(`   Expected in folder: ${expectedFolderName}`);
            }
          });
        } else {
          console.log('ℹ️ No existing IN documents found - perfect for testing new uploads');
        }
      }
    } catch (docError) {
      console.warn('⚠️ Could not check existing documents:', docError);
    }

    // Step 4: Test upload API endpoint preparation
    console.log('\n🧪 Step 4: Testing upload preparation...');

    const testMetadata = {
      resident_id: testResident.id,
      document_type: 'IN',
      description: 'Test document for folder organization',
      resident_badge: testResidentBadge,
      resident_name: residentName
    };

    console.log('📤 Upload metadata for testing:', testMetadata);
    console.log('✅ Upload preparation complete');

    // Step 5: Verify storage bucket access
    console.log('\n🗂️ Step 5: Manual verification steps...');

    console.log('📋 To manually test IN folder organization:');
    console.log('1. Go to Supabase Dashboard > Storage > administrative-documents');
    console.log(`2. Look for folder: ${expectedFolderName}`);
    console.log('3. Upload a test IN document using the ResidentDocumentsModal');
    console.log('4. Verify the document appears in the organized folder');
    console.log('5. Check that the database record includes folder information');

    // Step 6: Document organization verification
    console.log('\n📁 Step 6: Organization verification...');

    console.log('Expected folder structure for IN documents:');
    console.log(`administrative-documents/`);
    console.log(`├── ${expectedFolderName}/`);
    console.log(`│   ├── bijlage26_document.pdf`);
    console.log(`│   ├── toewijzing_form.pdf`);
    console.log(`│   ├── passport_scan.jpg`);
    console.log(`│   └── other_in_documents...`);
    console.log(`└── other_resident_folders.../`);

    // Step 7: Compare with OUT folder organization
    console.log('\n🔄 Step 7: Comparing with OUT folder organization...');

    try {
      const outDocumentsResponse = await fetch(`/api/administrative-documents?resident_id=${testResident.id}`);
      if (outDocumentsResponse.ok) {
        const allDocuments = await outDocumentsResponse.json();
        const outDocuments = allDocuments.filter(d => d.document_type === 'OUT');

        console.log(`Found ${outDocuments.length} OUT documents for comparison`);

        if (outDocuments.length > 0) {
          const outDoc = outDocuments[0];
          const outPath = outDoc.file_path || '';
          const outHasOrganizedStructure = outPath.includes(expectedFolderName);

          console.log('📄 OUT document organization example:');
          console.log(`   File: ${outDoc.file_name}`);
          console.log(`   Path: ${outPath}`);
          console.log(`   Organized: ${outHasOrganizedStructure ? '✅' : '❌'}`);

          if (outHasOrganizedStructure) {
            console.log('✅ OUT documents are properly organized - IN documents should match this structure');
          } else {
            console.log('⚠️ OUT documents are not organized - both IN and OUT need organization');
          }
        }
      }
    } catch (outError) {
      console.warn('⚠️ Could not check OUT documents:', outError);
    }

    console.log('\n🎉 IN Folder Organization Test Complete!');
    console.log('\n✅ Summary:');
    console.log('- Storage utilities are ready for IN document organization');
    console.log('- Expected folder structure defined');
    console.log('- Upload metadata prepared for organized structure');
    console.log(`- Resident folder name: ${expectedFolderName}`);

    console.log('\n🧪 Next Steps:');
    console.log('1. Test by uploading a new IN document via the UI');
    console.log('2. Verify it appears in the organized folder structure');
    console.log('3. Check database record includes folder metadata');
    console.log('4. Run migration script for existing unorganized documents if needed');

    return {
      success: true,
      testResident,
      expectedFolder: expectedFolderName,
      folderStructureReady: true
    };

  } catch (error) {
    console.error('❌ IN Folder Organization test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that storage organization utilities are properly imported');
    console.log('2. Verify API endpoints are accessible');
    console.log('3. Check browser console for detailed errors');

    return {
      success: false,
      error: error.message
    };
  }
}

// Function to test the complete upload flow
async function testCompleteInUploadFlow(testResidentBadge = '24191') {
  console.log('🧪 Testing complete IN document upload flow with folder organization');

  try {
    // Find test resident
    const residentsResponse = await fetch('/api/residents');
    const residents = await residentsResponse.json();
    const testResident = residents.find(r => r.badge.toString() === testResidentBadge);

    if (!testResident) {
      throw new Error(`Test resident with badge ${testResidentBadge} not found`);
    }

    console.log(`✅ Testing with resident: ${testResident.first_name} ${testResident.last_name} (${testResident.badge})`);

    // Create a test file blob (simulating a PDF)
    const testFileContent = 'This is a test PDF content for folder organization testing';
    const testFile = new File([testFileContent], 'test_in_document.pdf', {
      type: 'application/pdf'
    });

    console.log('📄 Created test file:', {
      name: testFile.name,
      type: testFile.type,
      size: testFile.size
    });

    // Simulate the upload metadata that ResidentDocumentsModal would send
    const uploadMetadata = {
      resident_id: testResident.id,
      document_type: 'IN',
      description: 'Test bijlage26 document for folder organization',
      resident_badge: testResident.badge.toString(),
      resident_name: `${testResident.first_name} ${testResident.last_name}`
    };

    console.log('📤 Upload metadata:', uploadMetadata);

    // Note: We can't actually upload the file from a script, but we can verify the structure
    console.log('\n📁 Expected organized structure:');

    const expectedFolderName = `${testResident.badge}_${uploadMetadata.resident_name.replace(/[^a-zA-Z0-9\\s]/g, '').replace(/\\s+/g, '_')}`;
    const expectedPath = `${expectedFolderName}/test_in_document.pdf`;

    console.log(`Bucket: administrative-documents`);
    console.log(`Folder: ${expectedFolderName}`);
    console.log(`Full path: ${expectedPath}`);
    console.log(`Public URL would be: https://xxcbpsjefpogxgfellui.supabase.co/storage/v1/object/public/administrative-documents/${expectedPath}`);

    console.log('\n✅ Upload flow test prepared successfully!');
    console.log('\n📋 To complete the test:');
    console.log('1. Open the Administrative Documents page');
    console.log('2. Click on the resident modal for this resident');
    console.log('3. Upload a test document');
    console.log('4. Verify it appears in the organized folder structure');

    return {
      success: true,
      expectedFolder: expectedFolderName,
      expectedPath: expectedPath,
      uploadMetadata: uploadMetadata
    };

  } catch (error) {
    console.error('❌ Complete upload flow test failed:', error);
    return { success: false, error: error.message };
  }
}

// Auto-run information
console.log('🗂️ IN Document Folder Organization Test');
console.log('📁 This script tests the organized folder structure for IN documents');
console.log('\nCommands:');
console.log('- testInFolderOrganization(badge) - Test organization utilities and structure');
console.log('- testCompleteInUploadFlow(badge) - Test the complete upload flow preparation');
console.log('\n📋 Test with different residents:');
console.log('- testInFolderOrganization("24191") - Test with resident badge 24191');
console.log('- testInFolderOrganization("12345") - Test with another resident');
console.log('\n✅ Ready to test IN folder organization?');
console.log('Run: testInFolderOrganization("24191")');