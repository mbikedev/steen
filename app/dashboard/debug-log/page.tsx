'use client';

import { useState, useEffect } from 'react';
import { Home, RefreshCw, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from "../../../lib/DataContextWithAPI";

export default function DebugLogPage() {
  const router = useRouter();
  const { 
    isConnectedToDb, 
    lastApiCall, 
    apiCallHistory, 
    dataMatchIt, 
    getStorageInfo,
    syncWithDatabase 
  } = useData();
  
  const [storageInfo, setStorageInfo] = useState<any>({});

  useEffect(() => {
    if (getStorageInfo) {
      setStorageInfo(getStorageInfo());
    }
  }, [getStorageInfo, apiCallHistory]);

  const refreshInfo = () => {
    if (getStorageInfo) {
      setStorageInfo(getStorageInfo());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg"
            >
              <Home className="h-5 w-5" />
              Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Debug Log
            </h1>
          </div>
          
          <button
            onClick={refreshInfo}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Connection Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Database Connection
              {isConnectedToDb ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </h3>
            <div className="text-sm space-y-2">
              <div>Status: {isConnectedToDb ? 
                <span className="text-green-600 font-semibold">Connected</span> : 
                <span className="text-red-600 font-semibold">Disconnected</span>
              }</div>
              <div>API URL: <span className="font-mono text-xs">{storageInfo.apiUrl || 'Not set'}</span></div>
              <div>API Key: {storageInfo.hasApiKey ? 
                <span className="text-green-600">✓ Set</span> : 
                <span className="text-red-600">✗ Missing</span>
              }</div>
            </div>
          </div>

          {/* Data Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Data Status
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </h3>
            <div className="text-sm space-y-2">
              <div>Local Residents: <span className="font-semibold text-blue-600">{dataMatchIt.length}</span></div>
              <div>Storage Total: <span className="font-semibold">{storageInfo.total || 0}</span></div>
              <div>Last Updated: <span className="text-xs">{new Date().toLocaleTimeString()}</span></div>
            </div>
          </div>

          {/* Last API Call */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Last API Call</h3>
            <div className="text-sm">
              {lastApiCall ? (
                <div className="font-mono text-xs break-all">{lastApiCall}</div>
              ) : (
                <div className="text-gray-500">No API calls yet</div>
              )}
            </div>
          </div>
        </div>

        {/* API Call History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">API Call History</h3>
            <button
              onClick={() => syncWithDatabase()}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Test Sync
            </button>
          </div>
          
          {apiCallHistory && apiCallHistory.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {apiCallHistory.slice().reverse().map((call, index) => (
                <div 
                  key={index} 
                  className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded border-l-4 border-blue-500"
                >
                  {call}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No API calls logged yet. Try adding a resident to see debug information.
            </div>
          )}
        </div>

        {/* Current Residents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Current Residents ({dataMatchIt.length})</h3>
          
          {dataMatchIt.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Badge</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Room</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataMatchIt.slice(0, 10).map((resident) => (
                    <tr key={resident.id || resident.badge} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2">{resident.id || '-'}</td>
                      <td className="p-2">{resident.badge}</td>
                      <td className="p-2">{resident.firstName} {resident.lastName}</td>
                      <td className="p-2">{resident.room || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          resident.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {resident.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No residents found. Try adding one through the Data Match-IT page.
            </div>
          )}
        </div>

        {/* Troubleshooting Guide */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🔧 Troubleshooting Steps:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">1</span>
              <span>Check that PHP files are uploaded to <code>public_html/api/php/</code> on Hostinger</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">2</span>
              <span>Import <code>schema.sql</code> to your database via phpMyAdmin</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">3</span>
              <span>Test direct URL: <code>https://mikaty.eastatwest.com/api/php/test-connection.php</code></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">4</span>
              <span>Watch the API call history above when adding residents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}