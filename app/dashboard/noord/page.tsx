'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, MapPin, Users, Printer } from 'lucide-react';
import { useData } from '../../../lib/DataContext';
import { formatDate } from '../../../lib/utils';
import { getRoomConfig } from '../../../lib/bedConfig';

export default function NoordPage() {
  const { noordData, updateInDataMatchIt } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [editingRemarks, setEditingRemarks] = useState<{[key: number]: string}>({});
  const [editingLanguage, setEditingLanguage] = useState<{[key: number]: string}>({});
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  const filteredData = noordData.filter(resident => {
    const matchesSearch = 
      resident.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.badge.toString().includes(searchTerm) ||
      resident.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoom = !filterRoom || resident.room === filterRoom;
    
    return matchesSearch && matchesRoom;
  });

  const uniqueRooms = [...new Set(noordData.map(r => r.room))].sort();

  // Group residents by room
  const roomGroups = filteredData.reduce((acc, resident) => {
    if (!acc[resident.room]) {
      acc[resident.room] = [];
    }
    acc[resident.room].push(resident);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  // Get all rooms from config for Noord building, not just rooms with residents
  const allNoordRooms = ['1.06', '1.07', '1.08', '1.09', '1.14', '1.15', '1.16', '1.17', '1.18', '1.19'];
  
  // Separate ground floor and first floor rooms - include empty rooms
  const groundFloorRooms = allNoordRooms.filter(room => {
    const roomConfig = getRoomConfig(room);
    return roomConfig?.floor === 'ground';
  });

  const firstFloorRooms = allNoordRooms.filter(room => {
    const roomConfig = getRoomConfig(room);
    return roomConfig?.floor === 'first';
  });

  // Sort residents within each room by badge number for consistent ordering
  // Create new objects to avoid mutating the original data
  const sortedRoomGroups: typeof roomGroups = {};
  Object.keys(roomGroups).forEach(room => {
    // Create a new array with sorted residents
    sortedRoomGroups[room] = [...roomGroups[room]].sort((a, b) => a.badge - b.badge);
    
    // Map to new objects with updated bed numbers based on position
    sortedRoomGroups[room] = sortedRoomGroups[room].map((resident, index) => ({
      ...resident,
      bedNumber: index + 1 // Assign sequential bed numbers: 1, 2, 3, etc.
    }));
  });

  const handleRemarksEdit = (residentId: number, currentRemarks: string) => {
    setEditingRemarks({
      ...editingRemarks,
      [residentId]: currentRemarks || ''
    });
  };

  const handleRemarksSave = (residentId: number) => {
    const newRemarks = editingRemarks[residentId] || '';
    updateInDataMatchIt(residentId, { roomRemarks: newRemarks });
    
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

  const handleLanguageEdit = (residentId: number, currentLanguage: string) => {
    setEditingLanguage({
      ...editingLanguage,
      [residentId]: currentLanguage || ''
    });
  };

  const handleLanguageSave = (residentId: number) => {
    const newLanguage = editingLanguage[residentId] || '';
    updateInDataMatchIt(residentId, { language: newLanguage });
    
    // Remove from editing state
    const newEditing = { ...editingLanguage };
    delete newEditing[residentId];
    setEditingLanguage(newEditing);
  };

  const handleLanguageCancel = (residentId: number) => {
    const newEditing = { ...editingLanguage };
    delete newEditing[residentId];
    setEditingLanguage(newEditing);
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 ${printOrientation};
            margin: 15mm;
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
          }

          .page-break {
            page-break-before: always !important;
            break-before: always !important;
          }

          .ground-floor-section {
            page-break-after: always !important;
            break-after: always !important;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    <DashboardLayout className="no-print">
      <div className="p-6">
        {/* Header - Matching PDF Layout */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">STEENOKKERZEEL NOORD</h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(new Date())}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {noordData.length} personen
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

        {/* Ground Floor Rooms - Page 1 */}
        <div className="ground-floor-section space-y-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Begane Grond</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Kamers 1.06 - 1.09</p>
          </div>
          {groundFloorRooms.map(room => {
            const roomResidents = sortedRoomGroups[room] || [];
            const roomConfig = getRoomConfig(room);
            const maxBeds = roomConfig?.maxBeds || 3;
            
            return (
              <div key={room} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
                {/* Room Header */}
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Kamer {room}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{roomResidents.length} van {maxBeds} bedden bezet</p>
                </div>
                
                {/* Room Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-teal-700 dark:bg-teal-800 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Bed
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Achternaam
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Voornaam
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Nationaliteit
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Taal
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Geslacht
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Opmerkingen
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Badge
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {Array.from({ length: maxBeds }, (_, bedIndex) => {
                        const bedNumber = bedIndex + 1;
                        const resident = roomResidents.find(r => r.bedNumber === bedNumber);
                        const index = bedIndex;
                        
                        return (
                        <tr key={resident?.id || `${room}-bed-${bedNumber}`} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors`}>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {bedNumber}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.lastName : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.firstName : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.nationality : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {resident ? (
                              editingLanguage[resident.id] !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    list="languages-list"
                                    value={editingLanguage[resident.id]}
                                    onChange={(e) => setEditingLanguage({
                                      ...editingLanguage,
                                      [resident.id]: e.target.value
                                    })}
                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-gray-100 bg-white dark:bg-gray-700"
                                    placeholder="Taal bewerken..."
                                    autoComplete="on"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleLanguageSave(resident.id)}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleLanguageCancel(resident.id)}
                                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                                  onClick={() => setEditingLanguage({
                                    ...editingLanguage,
                                    [resident.id]: resident.language || ''
                                  })}
                                >
                                  {resident.language || <span className="text-gray-400 italic">Klik om toe te voegen</span>}
                                </div>
                              )
                            ) : (
                              <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.gender : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {resident ? (
                              editingRemarks[resident.id] !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    list="remarks-list"
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
                                    onClick={() => handleRemarksSave(resident.id)}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleRemarksCancel(resident.id)}
                                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => handleRemarksEdit(resident.id, resident.roomRemarks || '')}
                                  className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px]"
                                >
                                  {resident.roomRemarks ? (
                                    <span className="bg-yellow-200 px-2 py-1 text-xs font-medium rounded">
                                      {resident.roomRemarks}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Klik om opmerking toe te voegen</span>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {resident ? resident.badge : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* First Floor Rooms - Page 2 */}
        <div className="page-break space-y-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Eerste Verdieping</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Kamers 1.14 - 1.19 (Meisjes)</p>
          </div>
          {firstFloorRooms.map(room => {
            const roomResidents = sortedRoomGroups[room] || [];
            const roomConfig = getRoomConfig(room);
            const maxBeds = roomConfig?.maxBeds || 3;
            
            return (
              <div key={room} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
                {/* Room Header */}
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Kamer {room}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{roomResidents.length} van {maxBeds} bedden bezet</p>
                </div>
                
                {/* Room Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-teal-700 dark:bg-teal-800 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Bed
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Achternaam
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Voornaam
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Nationaliteit
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Taal
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Geslacht
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Opmerkingen
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Badge
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {Array.from({ length: maxBeds }, (_, bedIndex) => {
                        const bedNumber = bedIndex + 1;
                        const resident = roomResidents.find(r => r.bedNumber === bedNumber);
                        const index = bedIndex;
                        
                        return (
                        <tr key={resident?.id || `${room}-bed-${bedNumber}`} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors`}>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {bedNumber}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.lastName : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.firstName : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.nationality : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {resident ? (
                              editingLanguage[resident.id] !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    list="languages-list"
                                    value={editingLanguage[resident.id]}
                                    onChange={(e) => setEditingLanguage({
                                      ...editingLanguage,
                                      [resident.id]: e.target.value
                                    })}
                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-gray-100 bg-white dark:bg-gray-700"
                                    placeholder="Taal bewerken..."
                                    autoComplete="on"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleLanguageSave(resident.id)}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleLanguageCancel(resident.id)}
                                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                                  onClick={() => setEditingLanguage({
                                    ...editingLanguage,
                                    [resident.id]: resident.language || ''
                                  })}
                                >
                                  {resident.language || <span className="text-gray-400 italic">Klik om toe te voegen</span>}
                                </div>
                              )
                            ) : (
                              <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {resident ? resident.gender : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {resident ? (
                              editingRemarks[resident.id] !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    list="remarks-list"
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
                                    onClick={() => handleRemarksSave(resident.id)}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleRemarksCancel(resident.id)}
                                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => handleRemarksEdit(resident.id, resident.roomRemarks || '')}
                                  className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px]"
                                >
                                  {resident.roomRemarks ? (
                                    <span className="bg-yellow-200 px-2 py-1 text-xs font-medium rounded">
                                      {resident.roomRemarks}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Klik om opmerking toe te voegen</span>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {resident ? resident.badge : <span className="italic text-gray-400 dark:text-gray-500">Leeg</span>}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          <div>
            Toont <span className="font-medium">{filteredData.length}</span> van{' '}
            <span className="font-medium">{noordData.length}</span> bewoners in Noord gebouw
          </div>
        </div>

        {/* Autocomplete Datalists */}
        <datalist id="languages-list">
          <option value="Nederlands" />
          <option value="Engels" />
          <option value="Frans" />
          <option value="Duits" />
          <option value="Arabisch" />
          <option value="Tigrinya" />
          <option value="Amhaars" />
          <option value="Dari" />
          <option value="Pashto" />
          <option value="Farsi" />
          <option value="Urdu" />
          <option value="Swahili" />
          <option value="Somali" />
          <option value="Lingala" />
          <option value="Spaans" />
          <option value="Portugees" />
          <option value="Russisch" />
          <option value="Turks" />
          <option value="Koerdisch" />
          <option value="Albanees" />
        </datalist>

        <datalist id="remarks-list">
          <option value="Medicatie" />
          <option value="Doktersafspraak" />
          <option value="Advocaat afspraak" />
          <option value="Interview DVZ" />
          <option value="Sociale dienst" />
          <option value="School" />
          <option value="Nederlandse les" />
          <option value="Psycholoog" />
          <option value="Therapie" />
          <option value="Integratie traject" />
          <option value="Werk zoeken" />
          <option value="Stage" />
          <option value="Familiebezoek" />
          <option value="Ziekenhuis" />
          <option value="Tandarts" />
          <option value="Oogarts" />
          <option value="Specialist" />
          <option value="Urgente zorg" />
          <option value="Mentale ondersteuning" />
          <option value="Hulp nodig" />
        </datalist>
      </div>
    </DashboardLayout>

    {/* Print-only layout - matches PDF format exactly */}
    <div className="print-only">
      {/* Header */}
      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
        OOC STEENOKKERZEEL
      </div>
      

      {/* Ground Floor Rooms - Page 1 */}
      <div style={{ pageBreakAfter: 'always', breakAfter: 'always' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#FFFF99', border: '1px solid black' }}>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>
                {new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                LOCK
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                NAAM
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                VOORNAAM
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Nationaliteit
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                TAAL
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Sexe
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                OPMERKINGEN
              </th>
            </tr>
          </thead>
          <tbody>
            {groundFloorRooms.sort().map(room => {
              const roomResidents = sortedRoomGroups[room] || [];
              const roomConfig = getRoomConfig(room);
              const maxBeds = roomConfig?.maxBeds || 5;
              
              return Array.from({ length: maxBeds }, (_, bedIndex) => {
                const bedNumber = bedIndex + 1;
                const resident = roomResidents.find(r => r.bedNumber === bedNumber);
                const isFirstBedInRoom = bedNumber === 1;
                
                return (
                  <tr key={`${room}-${bedNumber}`}>
                    {isFirstBedInRoom && (
                      <td 
                        style={{ 
                          border: '1px solid black', 
                          padding: '4px', 
                          textAlign: 'center', 
                          fontWeight: 'bold',
                          backgroundColor: room === '1.14' ? '#FF0000' : '#FFFF99',
                          color: room === '1.14' ? 'white' : 'black',
                          verticalAlign: 'top'
                        }}
                        rowSpan={maxBeds}
                      >
                        {room}
                        {room === '1.14' && <div style={{ fontSize: '8px' }}>MED</div>}
                      </td>
                    )}
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '30px' }}>
                      {bedNumber}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '120px' }}>
                      {resident?.lastName || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '120px' }}>
                      {resident?.firstName || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '80px' }}>
                      {resident?.nationality || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '80px' }}>
                      {resident?.language || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '40px' }}>
                      {resident?.gender || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', minWidth: '150px' }}>
                      {resident?.roomRemarks || ''}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* First Floor Rooms - Page 2 */}
      <div style={{ pageBreakBefore: 'always', breakBefore: 'always' }}>
        <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
          OOC STEENOKKERZEEL
        </div>
        
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#FFFF99', border: '1px solid black' }}>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>
                {new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                LOCK
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                NAAM
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                VOORNAAM
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Nationaliteit
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                TAAL
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Sexe
              </th>
              <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                OPMERKINGEN
              </th>
            </tr>
          </thead>
          <tbody>
            {firstFloorRooms.sort().map(room => {
              const roomResidents = sortedRoomGroups[room] || [];
              const roomConfig = getRoomConfig(room);
              const maxBeds = roomConfig?.maxBeds || 3;
              
              return Array.from({ length: maxBeds }, (_, bedIndex) => {
                const bedNumber = bedIndex + 1;
                const resident = roomResidents.find(r => r.bedNumber === bedNumber);
                const isFirstBedInRoom = bedNumber === 1;
                
                return (
                  <tr key={`${room}-${bedNumber}`}>
                    {isFirstBedInRoom && (
                      <td 
                        style={{ 
                          border: '1px solid black', 
                          padding: '4px', 
                          textAlign: 'center', 
                          fontWeight: 'bold',
                          backgroundColor: room === '1.14' ? '#FF0000' : '#FFFF99',
                          color: room === '1.14' ? 'white' : 'black',
                          verticalAlign: 'top'
                        }}
                        rowSpan={maxBeds}
                      >
                        {room}
                        {room === '1.14' && <div style={{ fontSize: '8px' }}>MED</div>}
                      </td>
                    )}
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '30px' }}>
                      {bedNumber}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '120px' }}>
                      {resident?.lastName || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '120px' }}>
                      {resident?.firstName || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '80px' }}>
                      {resident?.nationality || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', width: '80px' }}>
                      {resident?.language || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', width: '40px' }}>
                      {resident?.gender || ''}
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', minWidth: '150px' }}>
                      {resident?.roomRemarks || ''}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}