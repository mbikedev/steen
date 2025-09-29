// Manual transfer script for resident badge 24191
// Run this in the browser console on the Administrative Documents page

async function manualTransfer24191() {
  console.log('🔧 Manual document transfer for resident badge 24191');

  try {
    // Step 1: Find resident information
    console.log('\n📊 Finding resident 24191...');

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

    console.log('✅ Found resident:', {
      id: resident.id,
      badge: resident.badge,
      name: `${resident.first_name} ${resident.last_name}`,
      status: resident.status
    });

    // Step 2: Check current documents
    console.log('\n📄 Checking current documents...');

    try {
      const documentsResponse = await fetch(`/api/administrative-documents?resident_id=${resident.id}`);
      const documents = await documentsResponse.json();

      console.log(`Found ${documents.length} total documents:`);
      const inDocs = documents.filter(d => d.document_type === 'IN');
      const outDocs = documents.filter(d => d.document_type === 'OUT');

      console.log(`- IN documents: ${inDocs.length}`);
      console.log(`- OUT documents: ${outDocs.length}`);

      inDocs.forEach(doc => {
        console.log(`  📄 IN: ${doc.file_name} (${doc.file_path})`);
      });

      outDocs.forEach(doc => {
        console.log(`  📄 OUT: ${doc.file_name} (${doc.file_path})`);
      });

      if (inDocs.length === 0) {
        console.log('ℹ️ No IN documents found to transfer');
        return;
      }

    } catch (docError) {
      console.error('❌ Error fetching documents:', docError);
      console.log('Continuing with transfer attempt...');
    }

    // Step 3: Perform manual transfer
    console.log('\n🔄 Starting manual document transfer...');

    const transferResponse = await fetch('/api/documents/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        residentId: resident.id,
        residentBadge: '24191',
        residentName: `${resident.first_name} ${resident.last_name}`,
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
      console.log('✅ Transfer completed successfully!');
      console.log(`📄 Transferred ${transferResult.transferredCount} documents`);

      if (transferResult.transferredDocuments) {
        transferResult.transferredDocuments.forEach(doc => {
          console.log(`  ✅ Transferred: ${doc.fileName}`);
          console.log(`     From: ${doc.originalPath}`);
          console.log(`     To: ${doc.newPath}`);
        });
      }

      if (transferResult.errors && transferResult.errors.length > 0) {
        console.warn('⚠️ Some errors occurred:');
        transferResult.errors.forEach(error => console.warn(`  - ${error}`));
      }

      // Step 4: Update youth overview to OUT
      console.log('\n📊 Updating youth overview...');
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
            transferdossier_verzonden: `${transferResult.transferredCount} documenten overgedragen`
          })
        });

        const youthResult = await youthUpdateResponse.json();
        console.log('Youth overview update:', youthResult);
      } catch (youthError) {
        console.warn('⚠️ Youth overview update failed:', youthError);
      }

      // Step 5: Verify transfer
      console.log('\n✅ Verifying transfer...');
      const verifyResponse = await fetch(`/api/documents/transfer?residentId=${resident.id}`);
      const verifyResult = await verifyResponse.json();
      console.log('Post-transfer status:', verifyResult);

      console.log('\n🎉 Manual transfer completed!');
      console.log('📋 Next steps:');
      console.log('1. Check Supabase administrative-documents-out bucket');
      console.log('2. Verify documents are accessible in OUT section');
      console.log('3. Check that documents modal shows transfer status');

    } else {
      console.error('❌ Transfer failed:', transferResult.errors);
    }

  } catch (error) {
    console.error('❌ Manual transfer failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check network tab for API errors');
    console.log('2. Verify Supabase credentials and permissions');
    console.log('3. Check that administrative-documents-out bucket exists');
    console.log('4. Verify document paths are correct');
  }
}

// Helper function to check storage bucket access
async function checkStorageAccess() {
  console.log('🗄️ Checking storage bucket access...');

  try {
    // This is a simplified check - in reality you'd need proper Supabase client
    console.log('Checking if we can access storage APIs...');

    // Check if there's a storage check endpoint
    const storageCheckResponse = await fetch('/api/storage/buckets');
    if (storageCheckResponse.ok) {
      const buckets = await storageCheckResponse.json();
      console.log('Available buckets:', buckets);
    } else {
      console.log('ℹ️ Storage check endpoint not available');
    }

    console.log('\n📋 Manual verification steps:');
    console.log('1. Go to Supabase Dashboard > Storage');
    console.log('2. Check that these buckets exist:');
    console.log('   - administrative-documents');
    console.log('   - administrative-documents-out');
    console.log('3. Verify bucket permissions allow read/write');
    console.log('4. Check that policies are properly configured');

  } catch (error) {
    console.error('Storage check failed:', error);
  }
}

// Auto-run
console.log('🔧 Manual Transfer Tool for Resident 24191');
console.log('Commands:');
console.log('- manualTransfer24191() - Attempt manual transfer');
console.log('- checkStorageAccess() - Check storage configuration');

// Ask user to confirm before running
console.log('\n⚠️ Ready to manually transfer documents for resident 24191?');
console.log('Run: manualTransfer24191()');