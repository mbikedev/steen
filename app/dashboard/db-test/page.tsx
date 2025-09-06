'use client';

import { useState, useEffect } from 'react';
import { Home, CheckCircle, XCircle, RefreshCw, Database, Send, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DatabaseTestPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    badge: Math.floor(Math.random() * 100000),
    firstName: 'Test',
    lastName: 'User',
    room: '101',
    nationality: 'Belgium'
  });
  const [residents, setResidents] = useState<any[]>([]);

  // Test configuration
  const testConfig = async () => {
    try {
      const response = await fetch('/api/config-status');
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        config: {
          success: data.status.allConfigured,
          data,
          message: data.status.allConfigured ? 'Configuration OK' : 'Missing configuration'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        config: {
          success: false,
          error: error instanceof Error ? error.message : 'Configuration check failed'
        }
      }));
    }
  };

  // Test database connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-connection.php`, {
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: data.success,
          data,
          message: data.message || 'Connection successful'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }));
    }
  };

  // Test GET residents
  const testGetResidents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/residents.php`, {
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResidents(data.data || []);
      setTestResults(prev => ({
        ...prev,
        getResidents: {
          success: data.success,
          count: data.count || 0,
          message: `Found ${data.count || 0} residents`
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        getResidents: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get residents'
        }
      }));
    }
  };

  // Test POST resident
  const testCreateResident = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/residents.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(testData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        createResident: {
          success: data.success,
          data: data.data,
          message: `Created resident with ID: ${data.data?.id}`
        }
      }));
      
      // Refresh residents list
      await testGetResidents();
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        createResident: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create resident'
        }
      }));
    }
  };

  // Test DELETE resident
  const testDeleteResident = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/residents.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        deleteResident: {
          success: data.success,
          message: `Deleted resident ID: ${id}`
        }
      }));
      
      // Refresh residents list
      await testGetResidents();
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        deleteResident: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete resident'
        }
      }));
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});
    
    // Run tests in sequence
    await testConfig();
    await testConnection();
    await testGetResidents();
    
    setLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Database Connection Test
            </h1>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Run All Tests
          </button>
        </div>

        {/* Configuration Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>API URL: <span className="text-blue-600">{process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}</span></div>
            <div>API Key: <span className="text-green-600">{process.env.NEXT_PUBLIC_API_KEY ? '✓ Configured' : '✗ Not Set'}</span></div>
          </div>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Configuration Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Configuration Check
              {testResults.config?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : testResults.config?.success === false ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </h3>
            {testResults.config && (
              <div className="text-sm">
                {testResults.config.success ? (
                  <div className="text-green-600">{testResults.config.message}</div>
                ) : (
                  <div className="text-red-600">{testResults.config.error || testResults.config.message}</div>
                )}
              </div>
            )}
          </div>

          {/* Connection Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Database Connection
              {testResults.connection?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : testResults.connection?.success === false ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </h3>
            {testResults.connection && (
              <div className="text-sm">
                {testResults.connection.success ? (
                  <div>
                    <div className="text-green-600">{testResults.connection.message}</div>
                    {testResults.connection.data && (
                      <div className="mt-2 text-gray-600">
                        <div>Tables: {testResults.connection.data.database?.tables_count || 0}</div>
                        <div>Version: {testResults.connection.data.database?.version}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">{testResults.connection.error}</div>
                )}
              </div>
            )}
          </div>

          {/* GET Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              GET Residents
              {testResults.getResidents?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : testResults.getResidents?.success === false ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </h3>
            {testResults.getResidents && (
              <div className="text-sm">
                {testResults.getResidents.success ? (
                  <div className="text-green-600">{testResults.getResidents.message}</div>
                ) : (
                  <div className="text-red-600">{testResults.getResidents.error}</div>
                )}
              </div>
            )}
          </div>

          {/* POST Test Result */}
          {testResults.createResident && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                POST Resident
                {testResults.createResident.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </h3>
              <div className="text-sm">
                {testResults.createResident.success ? (
                  <div className="text-green-600">{testResults.createResident.message}</div>
                ) : (
                  <div className="text-red-600">{testResults.createResident.error}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Test Resident */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Test Resident</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <input
              type="number"
              placeholder="Badge"
              value={testData.badge}
              onChange={(e) => setTestData({...testData, badge: parseInt(e.target.value)})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="First Name"
              value={testData.firstName}
              onChange={(e) => setTestData({...testData, firstName: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={testData.lastName}
              onChange={(e) => setTestData({...testData, lastName: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Room"
              value={testData.room}
              onChange={(e) => setTestData({...testData, room: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
            <button
              onClick={testCreateResident}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Send className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>

        {/* Residents List */}
        {residents.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Residents in Database ({residents.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Badge</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Room</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.slice(0, 10).map((resident) => (
                    <tr key={resident.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2">{resident.id}</td>
                      <td className="p-2">{resident.badge}</td>
                      <td className="p-2">{resident.firstName} {resident.lastName}</td>
                      <td className="p-2">{resident.room || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          resident.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {resident.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => testDeleteResident(resident.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {residents.length > 10 && (
                <div className="text-center text-gray-500 mt-2">
                  Showing first 10 of {residents.length} residents
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">📋 Test Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Configuration Check - Verifies environment variables are set</li>
            <li>Database Connection - Tests connection to MySQL database</li>
            <li>GET Residents - Retrieves all residents from database</li>
            <li>POST Resident - Creates a new test resident</li>
            <li>DELETE Resident - Removes a resident (soft delete)</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <h4 className="font-semibold mb-2">⚠️ Before Testing:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Upload PHP files to Hostinger at <code>public_html/api/php/</code></li>
              <li>Import <code>schema.sql</code> to your database via phpMyAdmin</li>
              <li>Ensure <code>.htaccess</code> file is uploaded</li>
              <li>Check file permissions (644 for PHP files, 755 for directories)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}