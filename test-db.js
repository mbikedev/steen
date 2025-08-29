// Quick test to check if database operations work
const { dbOperations } = require('./lib/supabase.ts');

async function testAddResident() {
  console.log('🧪 Testing database resident addition...');
  
  const testResident = {
    firstName: 'Test',
    lastName: 'Person',
    badge: 'TEST123',
    room: '101',
    nationality: 'Dutch',
    age: 25,
    gender: 'M',
    status: 'active',
    dateOfBirth: '1999-01-01'
  };
  
  try {
    const result = await dbOperations.addResident(testResident);
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ Test successful! Resident ID:', result.resident?.id);
    } else {
      console.log('❌ Test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testAddResident();