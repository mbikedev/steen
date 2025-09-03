'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, ChefHat, Printer } from 'lucide-react';
import { useData } from "../../../lib/DataContextDebug";
import { formatDate } from '../../../lib/utils';

export default function KeukenlijstPage() {
  const { keukenlijst, updateInDataMatchIt } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [editingRemarks, setEditingRemarks] = useState<{[key: number]: string}>({});
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const filteredData = keukenlijst.filter(resident => {
    const matchesSearch = 
      resident.badge.toString().includes(searchTerm) ||
      resident.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.firstName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoom = !filterRoom || resident.room === filterRoom;
    
    return matchesSearch && matchesRoom;
  });

  const uniqueRooms = [...new Set(keukenlijst.map(r => r.room))].sort();

  // Handler functions for editable functionality
  const handleRemarksEdit = (residentId: number, currentRemarks: string) => {
    setEditingRemarks({
      ...editingRemarks,
      [residentId]: currentRemarks || ''
    });
  };

  const handleRemarksSave = (residentId: number) => {
    const newRemarks = editingRemarks[residentId] || '';
    updateInDataMatchIt(residentId, { remarks: newRemarks });
    
    // Remove from editing state
    const newEditing = { ...editingRemarks };
    delete newEditing[residentId];
    setEditingRemarks(newEditing);
  };

  const handleRemarksCancel = (residentId: number) => {
    const newEditing = { ...editingRemarks };
    delete newEditing[residentId];
    setEditingRemarks(newEditing);
  };

  const handleMealTimeToggle = (residentId: number, mealType: string, currentValue: boolean) => {
    updateInDataMatchIt(residentId, { [mealType]: !currentValue });
  };


  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: 8mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body, html {
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
            position: relative !important;
            z-index: 999 !important;
            transform: scale(0.75);
            transform-origin: top left;
            width: 133.33%;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    <DashboardLayout className="no-print">
      <div className="p-6 no-print">
        {/* Header - Matching PDF Layout */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">STEENOKKERZEEL KEUKENLIJST</h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(new Date())}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {keukenlijst.length} p
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op naam, badge, kamer..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-gray-100 bg-white dark:bg-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Room Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-gray-100"
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
            >
              <option value="">Alle kamers</option>
              {uniqueRooms.map(room => (
                <option key={room} value={room}>Kamer {room}</option>
              ))}
            </select>

            {/* Orientation Toggle */}
            <select
              value={printOrientation}
              onChange={(e) => setPrintOrientation(e.target.value as 'portrait' | 'landscape')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-gray-100"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-colors"
            >
              <Printer className="h-5 w-5" />
              Print ({printOrientation === 'portrait' ? 'Portrait' : 'Landscape'})
            </button>

          </div>
        </div>


        {/* Table */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-teal-700 dark:bg-teal-800 text-white">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Badge
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Achternaam
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Voornaam
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Wooneenheid
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    OPMERKINGEN
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Ontbijt
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Middag
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    16 u
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Avond
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    21 u
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredData.map((resident, index) => (
                  <tr key={resident.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors`}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {resident.badge}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.lastName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.firstName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.room}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {(() => {
                        // Check if this resident is being edited
                        const isEditing = editingRemarks[resident.id] !== undefined;
                        
                        return isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingRemarks[resident.id]}
                              onChange={(e) => setEditingRemarks({
                                ...editingRemarks,
                                [resident.id]: e.target.value
                              })}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-gray-100 bg-white dark:bg-gray-700"
                              placeholder="Opmerking toevoegen..."
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                handleRemarksSave(resident.id);
                                
                                // Remove from editing state
                                const newEditing = { ...editingRemarks };
                                delete newEditing[resident.id];
                                setEditingRemarks(newEditing);
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                const newEditing = { ...editingRemarks };
                                delete newEditing[resident.id];
                                setEditingRemarks(newEditing);
                              }}
                              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingRemarks({
                                ...editingRemarks,
                                [resident.id]: resident.remarks || ''
                              });
                            }}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded min-h-[24px]"
                          >
                            {resident.remarks ? (
                              <span className="bg-yellow-300 dark:bg-yellow-900 px-2 py-1 text-xs font-medium rounded text-blue-800 dark:text-blue-200">
                                {resident.remarks}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Klik om opmerking toe te voegen</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    {/* Ontbijt */}
                    <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900 border-l border-gray-300">
                      <input
                        type="checkbox"
                        checked={resident.ontbijt || false}
                        onChange={() => handleMealTimeToggle(resident.id, 'ontbijt', resident.ontbijt)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    {/* Middag */}
                    <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900 border-l border-gray-300">
                      <input
                        type="checkbox"
                        checked={resident.middag || false}
                        onChange={() => handleMealTimeToggle(resident.id, 'middag', resident.middag)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    {/* 16 u */}
                    <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900 border-l border-gray-300">
                      <input
                        type="checkbox"
                        checked={resident.snack16 || false}
                        onChange={() => handleMealTimeToggle(resident.id, 'snack16', resident.snack16)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    {/* Avond */}
                    <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900 border-l border-gray-300">
                      <input
                        type="checkbox"
                        checked={resident.avond || false}
                        onChange={() => handleMealTimeToggle(resident.id, 'avond', resident.avond)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    {/* 21 u */}
                    <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-900 border-l border-gray-300">
                      <input
                        type="checkbox"
                        checked={resident.snack21 || false}
                        onChange={() => handleMealTimeToggle(resident.id, 'snack21', resident.snack21)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          <div>
            Toont <span className="font-medium">{filteredData.length}</span> van{' '}
            <span className="font-medium">{keukenlijst.length}</span> bewoners
          </div>
        </div>
      </div>
    </DashboardLayout>

    {/* Print-only layout - optimized for single page */}
    <div className="print-only">
      {/* Header */}
      <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>
        STEENOKKERZEEL KEUKENLIJST
      </div>
      
      {/* Info bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold' }}>
          {formatDate(new Date())}
        </div>
        <div style={{ fontWeight: 'bold' }}>
          {keukenlijst.length} p
        </div>
      </div>

      {/* Table optimized for single page */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7px', border: '2px solid black' }}>
        <thead>
          <tr style={{ backgroundColor: '#E6E6FA', color: 'black' }}>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Badge</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Achternaam</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Voornaam</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Wooneenheid</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>OPMERKING</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Ontbijt</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Middag</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>16u</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>Avond</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '6px' }}>21u</th>
          </tr>
        </thead>
        <tbody>
          {keukenlijst.map((resident) => (
            <tr key={resident.id}>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '7px' }}>{resident.badge}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', fontSize: '7px' }}>{resident.lastName}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', fontSize: '7px' }}>{resident.firstName}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '7px' }}>{resident.room}</td>
              <td style={{ 
                border: '1px solid black', 
                padding: '1px', 
                textAlign: 'left', 
                fontSize: '7px', 
                backgroundColor: resident.remarks ? '#FDE047' : 'transparent',
                color: resident.remarks ? '#1E40AF' : 'black'
              }}>
                {resident.remarks || '-'}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '8px' }}>{resident.ontbijt ? '✓' : ''}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '8px' }}>{resident.middag ? '✓' : ''}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '8px' }}>{resident.snack16 ? '✓' : ''}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '8px' }}>{resident.avond ? '✓' : ''}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', fontSize: '8px' }}>{resident.snack21 ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}