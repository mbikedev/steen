'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { residentsApi } from '../../../lib/api-service';

export default function DatabaseViewer() {
  const [residents, setResidents] = useState<any[]>([]);
  const [dataMatches, setDataMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching data from PHP API...');
      console.log('🔗 API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Fetch residents from PHP API
      const residentsResponse = await residentsApi.getAll();
      
      if (residentsResponse.success && residentsResponse.data) {
        console.log('✅ Residents fetched:', residentsResponse.data.length);
        setResidents(residentsResponse.data);
      } else {
        throw new Error(residentsResponse.error || 'Failed to fetch residents');
      }
      
      // For now, just use residents data for both (until we have separate data_match table)
      setDataMatches(residentsResponse.data || []);
      
    } catch (err: any) {
      console.error('❌ Database fetch error:', err);
      setError(err.message || 'Failed to fetch data from PHP API');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Database Viewer</h1>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading database contents...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Database Viewer</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2">Error loading database</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Database Viewer</h1>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Connection Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">Database Connection Info</h3>
          <p className="text-blue-700 text-sm">
            <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}<br/>
            <strong>Key (last 10 chars):</strong> ...{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-10)}<br/>
            <strong>Should match your Supabase dashboard URL</strong>
          </p>
        </div>

        {/* Residents Table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">
            Residents Table ({residents.length} records)
          </h2>
          
          {residents.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">No residents found in database</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID (Short)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">All Fields</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {residents.map((resident) => (
                    <tr key={resident.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">...{resident.id.slice(-8)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resident.first_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resident.last_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resident.date_of_birth}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resident.gender}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resident.status}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resident.admission_date}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{new Date(resident.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">View All</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-xs">
                            {JSON.stringify(resident, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Data Match Table */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Data Match Table ({dataMatches.length} records)
          </h2>
          
          {dataMatches.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">No data match records found in database</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">External ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">{match.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">{match.resident_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{match.external_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{match.external_system}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs ${
                          match.match_status === 'matched' ? 'bg-green-100 text-green-800' :
                          match.match_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {match.match_status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs ${
                          match.sync_status === 'success' ? 'bg-green-100 text-green-800' :
                          match.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {match.sync_status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{new Date(match.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}