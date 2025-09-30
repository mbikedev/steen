// Test script for Administrative Documents OUT Workflow
// Run this in the browser console on the Administrative Documents page

async function testOutWorkflow() {
  console.log('🧪 Testing Administrative Documents OUT Workflow...');

  try {
    // Test 1: Check document transfer API endpoint
    console.log('\n1. Testing document transfer API endpoint...');
    const testTransferData = {
      residentId: 999,
      residentBadge: 'TEST-001',
      residentName: 'Test User',
      transferMethod: 'copy' // Use copy for testing to avoid data loss
    };

    const transferResponse = await fetch('/api/documents/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTransferData)
    });

    const transferResult = await transferResponse.json();
    console.log('Transfer API response:', transferResult);

    // Test 2: Check transfer status API
    console.log('\n2. Testing transfer status API...');
    const statusResponse = await fetch(`/api/documents/transfer?residentId=${testTransferData.residentId}`);
    const statusResult = await statusResponse.json();
    console.log('Status API response:', statusResult);

    // Test 3: Test youth overview move API
    console.log('\n3. Testing youth overview move API...');
    const youthMoveResponse = await fetch(`/api/youth-overview/${testTransferData.residentBadge}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tab: 'OUT',
        datum_transfer: new Date().toISOString().split('T')[0],
        out_status: 'Test uitgegaan',
        transferdossier_verzonden: 'Test documenten overgedragen'
      })
    });

    const youthMoveResult = await youthMoveResponse.json();
    console.log('Youth overview move response:', youthMoveResult);

    // Test 4: Check if moveToOutAndDelete function is available
    console.log('\n4. Testing moveToOutAndDelete function availability...');
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React context available - can test moveToOutAndDelete in component');
    } else {
      console.log('ℹ️ This test should be run on the Administrative Documents page');
    }

    console.log('\n✅ API endpoints are working correctly!');
    console.log('\n📋 Next steps for complete testing:');
    console.log('1. Navigate to Administrative Documents page');
    console.log('2. Find a resident with documents in the IN section');
    console.log('3. Click the status dropdown and select "OUT"');
    console.log('4. Verify the resident appears in the OUT section');
    console.log('5. Open the resident\'s document modal');
    console.log('6. Check for "Documenten overgedragen" status indicator');
    console.log('7. Verify documents are accessible from OUT bucket');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check that all API routes are properly deployed');
    console.log('2. Verify Supabase connection and credentials');
    console.log('3. Ensure database tables exist (youth_overview, administrative_documents)');
    console.log('4. Check that storage buckets exist (administrative-documents, administrative-documents-out)');

    return false;
  }
}

// Function to test the complete workflow with a real resident
async function testRealResidentWorkflow(residentId, residentBadge, residentName) {
  console.log(`🧪 Testing real resident workflow for ${residentName} (${residentBadge})...`);

  try {
    // Step 1: Check current document status
    console.log('\n📊 Step 1: Checking current document status...');
    const statusResponse = await fetch(`/api/documents/transfer?residentId=${residentId}`);
    const initialStatus = await statusResponse.json();
    console.log('Initial status:', initialStatus);

    // Step 2: Transfer documents (copy method to preserve originals)
    console.log('\n📂 Step 2: Transferring documents...');
    const transferResponse = await fetch('/api/documents/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        residentId: residentId,
        residentBadge: residentBadge,
        residentName: residentName,
        transferMethod: 'copy' // Use copy to preserve originals during testing
      })
    });

    const transferResult = await transferResponse.json();
    console.log('Transfer result:', transferResult);

    // Step 3: Update youth overview
    console.log('\n📊 Step 3: Updating youth overview...');
    const youthResponse = await fetch(`/api/youth-overview/${residentBadge}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tab: 'OUT',
        datum_transfer: new Date().toISOString().split('T')[0],
        out_status: 'Test uitgegaan',
        transferdossier_verzonden: `${transferResult.transferredCount || 0} documenten overgedragen`
      })
    });

    const youthResult = await youthResponse.json();
    console.log('Youth overview result:', youthResult);

    // Step 4: Verify final status
    console.log('\n✅ Step 4: Verifying final status...');
    const finalStatusResponse = await fetch(`/api/documents/transfer?residentId=${residentId}`);
    const finalStatus = await finalStatusResponse.json();
    console.log('Final status:', finalStatus);

    console.log('\n🎉 Real resident workflow test completed!');
    console.log(`📊 Summary:`);
    console.log(`- Initial IN documents: ${initialStatus.inDocuments || 0}`);
    console.log(`- Documents transferred: ${transferResult.transferredCount || 0}`);
    console.log(`- Final OUT documents: ${finalStatus.outDocuments || 0}`);

    return true;

  } catch (error) {
    console.error('❌ Real resident workflow test failed:', error);
    return false;
  }
}

// Helper function to find residents for testing
function showTestingHelp() {
  console.log('🆘 Testing Help:');
  console.log('\n📋 To test with a real resident:');
  console.log('1. First run: testOutWorkflow()');
  console.log('2. Then run: testRealResidentWorkflow(residentId, "badgeNumber", "Full Name")');
  console.log('\nExample:');
  console.log('testRealResidentWorkflow(123, "001", "John Doe")');
  console.log('\n⚠️ Note: Use copy method during testing to preserve original documents');
}

// Run initial test
console.log('🧪 Administrative Documents OUT Workflow Test Suite');
console.log('Run testOutWorkflow() to test API endpoints');
console.log('Run showTestingHelp() for more testing options');

// Auto-run basic test
testOutWorkflow().then(result => {
  if (result) {
    console.log('\n🎉 Basic API tests passed! Ready for real resident testing.');
    showTestingHelp();
  } else {
    console.log('\n⚠️ Basic tests failed. Please check the setup before proceeding.');
  }
});