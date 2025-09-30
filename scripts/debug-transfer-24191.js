// Debug script for resident 24191 document transfer issue
// Run this in the browser console on the Administrative Documents page

async function debugResident24191() {
  console.log('🔍 Debugging document transfer for resident badge 24191...');

  try {
    // Step 1: Find resident information
    console.log('\n📊 Step 1: Finding resident information...');

    // Check if we can access the DataContext
    const dataContext = window.React && window.React.useContext ? 'Available' : 'Not available';
    console.log('React context:', dataContext);

    // Step 2: Check if resident exists in database
    console.log('\n📋 Step 2: Checking resident in database...');

    // Try to find resident by badge in residents table
    const residentsResponse = await fetch('/api/residents');
    const residents = await residentsResponse.json();

    const resident24191 = residents.find(r => r.badge.toString() === '24191');
    if (resident24191) {
      console.log('✅ Found resident 24191:', {
        id: resident24191.id,
        badge: resident24191.badge,
        name: `${resident24191.first_name} ${resident24191.last_name}`,
        status: resident24191.status,
        date_out: resident24191.date_out
      });
    } else {
      console.log('❌ Resident 24191 not found in residents table');
      return;
    }

    // Step 3: Check for documents in administrative_documents table
    console.log('\n📄 Step 3: Checking documents in database...');

    const documentsResponse = await fetch(`/api/administrative-documents?resident_id=${resident24191.id}`);
    const documents = await documentsResponse.json();

    console.log(`Found ${documents.length} documents for resident 24191:`);
    documents.forEach(doc => {
      console.log(`- ${doc.file_name} (Type: ${doc.document_type}, Path: ${doc.file_path})`);
    });

    // Step 4: Check document transfer status
    console.log('\n🔍 Step 4: Checking transfer status...');

    const transferStatusResponse = await fetch(`/api/documents/transfer?residentId=${resident24191.id}`);
    const transferStatus = await transferStatusResponse.json();

    console.log('Transfer status:', transferStatus);

    // Step 5: Check youth overview status
    console.log('\n📊 Step 5: Checking youth overview status...');

    const youthOverviewResponse = await fetch(`/api/youth-overview`);
    const youthData = await youthOverviewResponse.json();

    const youthRecord = youthData.find(y => y.badge === '24191');
    if (youthRecord) {
      console.log('✅ Youth overview record:', {
        badge: youthRecord.badge,
        tab_location: youthRecord.tab_location,
        datum_transfer: youthRecord.datum_transfer,
        out_status: youthRecord.out_status,
        transferdossier_verzonden: youthRecord.transferdossier_verzonden
      });
    } else {
      console.log('❌ No youth overview record found for badge 24191');
    }

    // Step 6: Attempt manual document transfer
    console.log('\n🔧 Step 6: Attempting manual document transfer...');

    if (documents.filter(d => d.document_type === 'IN').length > 0) {
      console.log('Found IN documents, attempting transfer...');

      const manualTransferResponse = await fetch('/api/documents/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          residentId: resident24191.id,
          residentBadge: '24191',
          residentName: `${resident24191.first_name} ${resident24191.last_name}`,
          transferMethod: 'transfer'
        })
      });

      const transferResult = await manualTransferResponse.json();
      console.log('Manual transfer result:', transferResult);

      if (transferResult.success) {
        console.log('✅ Manual transfer completed successfully!');
        console.log(`📊 Transferred ${transferResult.transferredCount} documents`);

        // Verify transfer
        console.log('\n✅ Step 7: Verifying transfer...');
        const verifyResponse = await fetch(`/api/documents/transfer?residentId=${resident24191.id}`);
        const verifyStatus = await verifyResponse.json();
        console.log('Post-transfer status:', verifyStatus);
      } else {
        console.log('❌ Manual transfer failed:', transferResult.errors);
      }
    } else {
      console.log('ℹ️ No IN documents found to transfer');
    }

    console.log('\n🎯 Debug Summary:');
    console.log('================');
    console.log(`Resident Status: ${resident24191.status}`);
    console.log(`Total Documents: ${documents.length}`);
    console.log(`IN Documents: ${documents.filter(d => d.document_type === 'IN').length}`);
    console.log(`OUT Documents: ${documents.filter(d => d.document_type === 'OUT').length}`);
    console.log(`Youth Overview Tab: ${youthRecord?.tab_location || 'Not found'}`);
    console.log(`Transfer Date: ${youthRecord?.datum_transfer || 'Not set'}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.log('\n🔧 Troubleshooting checklist:');
    console.log('1. Check browser network tab for failed requests');
    console.log('2. Verify Supabase connection');
    console.log('3. Check database table permissions');
    console.log('4. Verify storage bucket exists and is accessible');
    console.log('5. Check console for JavaScript errors during OUT process');
  }
}

// Function to check storage bucket directly
async function checkStorageBuckets() {
  console.log('🗄️ Checking Supabase storage configuration...');

  try {
    // This would need to be run with proper Supabase client
    console.log('ℹ️ Storage check requires Supabase client access');
    console.log('Please verify in Supabase dashboard:');
    console.log('1. administrative-documents bucket exists');
    console.log('2. administrative-documents-out bucket exists');
    console.log('3. Both buckets have proper permissions');
    console.log('4. IN/ and OUT/ folders exist in administrative-documents bucket');

    // Check if we can access storage through API
    const storageResponse = await fetch('/api/storage/check');
    if (storageResponse.ok) {
      const storageStatus = await storageResponse.json();
      console.log('Storage status:', storageStatus);
    } else {
      console.log('⚠️ Storage API check not available');
    }

  } catch (error) {
    console.error('❌ Storage check failed:', error);
  }
}

// Function to manually retry transfer for 24191
async function retryTransfer24191() {
  console.log('🔄 Retrying document transfer for resident 24191...');

  try {
    const transferResponse = await fetch('/api/documents/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        residentId: 'FIND_BY_BADGE', // Special flag to find by badge
        residentBadge: '24191',
        residentName: 'AUTO_DETECT',
        transferMethod: 'transfer'
      })
    });

    const result = await transferResponse.json();
    console.log('Retry result:', result);

    if (result.success) {
      console.log('✅ Retry successful!');
      console.log('Now check administrative-documents-out bucket in Supabase dashboard');
    } else {
      console.log('❌ Retry failed:', result.errors);
    }

  } catch (error) {
    console.error('❌ Retry failed:', error);
  }
}

// Auto-run debug
console.log('🔍 Debug Tools for Resident 24191');
console.log('Run debugResident24191() for comprehensive debug');
console.log('Run checkStorageBuckets() to verify storage setup');
console.log('Run retryTransfer24191() to manually retry transfer');

// Auto-start debug
debugResident24191();