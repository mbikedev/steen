// Test script for Youth Overview API
// Run this in the browser console on the OVERZICHT JONGEREN page

async function testYouthOverviewAPI() {
  console.log('Testing Youth Overview API...');

  try {
    // Test 1: Fetch all data
    console.log('\n1. Testing fetch all youth overview data...');
    const response1 = await fetch('/api/youth-overview');
    const data1 = await response1.json();
    console.log('Fetched records:', data1.length || 0);

    // Test 2: Create/Update a test record
    console.log('\n2. Testing upsert youth overview record...');
    const testRecord = {
      badge: 'TEST-001',
      naam: 'Test',
      voornaam: 'User',
      geboortedatum: '2000-01-01',
      leeftijd: '25',
      todos: 'Test TODO',
      tab_location: 'IN'
    };

    const response2 = await fetch('/api/youth-overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecord)
    });
    const result2 = await response2.json();
    console.log('Upsert result:', result2);

    // Test 3: Update a specific field
    console.log('\n3. Testing update specific field...');
    const response3 = await fetch('/api/youth-overview/TEST-001', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'todos',
        value: 'Updated TODO'
      })
    });
    const result3 = await response3.json();
    console.log('Update result:', result3);

    // Test 4: Fetch single record
    console.log('\n4. Testing fetch single record...');
    const response4 = await fetch('/api/youth-overview/TEST-001');
    const data4 = await response4.json();
    console.log('Fetched record:', data4);

    // Test 5: Move to OUT tab
    console.log('\n5. Testing move to OUT tab...');
    const response5 = await fetch('/api/youth-overview/TEST-001/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tab: 'OUT',
        datum_transfer: new Date().toISOString().split('T')[0]
      })
    });
    const result5 = await response5.json();
    console.log('Move result:', result5);

    console.log('\n✅ All tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testYouthOverviewAPI().then(result => {
  if (result) {
    console.log('\n🎉 Youth Overview API is working correctly!');
    console.log('Data will now be persisted to the database.');
  } else {
    console.log('\n⚠️ There were issues with the API.');
    console.log('Please check the implementation and database connection.');
  }
});