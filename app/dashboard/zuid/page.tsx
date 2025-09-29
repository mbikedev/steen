'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, MapPin, Users, Printer } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';
import { getRoomConfig } from '../../../lib/bedConfig';

export default function ZuidPage() {
  const { zuidData, updateInDataMatchIt } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [editingRemarks, setEditingRemarks] = useState<{[key: number]: string}>({});
  const [editingLanguage, setEditingLanguage] = useState<{[key: number]: string}>({});
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Remove date fragments from remarks for display only
  const stripDateFromRemarks = (remarks?: string) => {
    if (!remarks) return '';
    let text = remarks;
    // Remove common date formats like YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, DD-MM-YYYY
    text = text.replace(/\b(?:\d{4}[./-]\d{2}[./-]\d{2}|\d{2}[./-]\d{2}[./-]\d{4})\b/g, '').trim();
    // Remove leading separators left over
    text = text.replace(/^[\s\-–—:|]+/, '').trim();
    return text;
  };

  const filteredData = zuidData.filter(resident => {
    const matchesSearch = 
      resident.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.badge.toString().includes(searchTerm) ||
      resident.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoom = !filterRoom || resident.room === filterRoom;
    
    return matchesSearch && matchesRoom;
  });

  const uniqueRooms = [...new Set(zuidData.map(r => r.room))].sort();

  // Group residents by room
  const roomGroups = filteredData.reduce((acc, resident) => {
    if (!acc[resident.room]) {
      acc[resident.room] = [];
    }
    acc[resident.room].push(resident);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  // Get all rooms from config for Zuid building, not just rooms with residents
  const allZuidRooms = ['2.06', '2.07', '2.08', '2.14', '2.15', '2.16', '2.17', '2.18', '2.19'];
  
  // Separate ground floor and first floor rooms - include empty rooms
  const groundFloorRooms = allZuidRooms.filter(room => {
    const roomConfig = getRoomConfig(room);
    return roomConfig?.floor === 'ground';
  });

  const firstFloorRooms = allZuidRooms.filter(room => {
    const roomConfig = getRoomConfig(room);
    return roomConfig?.floor === 'first';
  });

  const medicalRoomNumber = '2.19';
  const groundRoomsForDisplay = groundFloorRooms.filter(room => room !== medicalRoomNumber);
  const firstFloorRoomsForDisplay = firstFloorRooms;

  // Sort residents within each room by badge number for consistent ordering
  // Create new objects to avoid mutating the original data
  const sortedRoomGroups: typeof roomGroups = {};
  Object.keys(roomGroups).forEach(room => {
    // Create a new array with sorted residents
    sortedRoomGroups[room] = [...roomGroups[room]].sort((a, b) => a.badge - b.badge);
    
    // Map to new objects with updated bed numbers based on position
    sortedRoomGroups[room] = sortedRoomGroups[room].map((resident: any, index: number) => ({
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
    const resident = zuidData.find(r => r.id === residentId);
    const currentRemarks = resident?.roomRemarks || '';
    
    // Only update if the remarks have actually changed
    if (newRemarks !== currentRemarks) {
      updateInDataMatchIt(residentId, { roomRemarks: newRemarks });
    }
    
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

  const handleRemarksDelete = (residentId: number) => {
    updateInDataMatchIt(residentId, { roomRemarks: '' });
    // Ensure any editing state is cleared
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
    const resident = zuidData.find(r => r.id === residentId);
    const currentLanguage = resident?.language || '';
    
    // Only update if the language has actually changed
    if (newLanguage !== currentLanguage) {
      updateInDataMatchIt(residentId, { language: newLanguage });
    }
    
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
            margin: 10mm;
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
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    <DashboardLayout className="no-print">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground font-title">STEENOKKERZEEL ZUID</h1>
          </div>
          
          <div className="bg-card shadow-sm rounded-lg p-4 mb-6 border-2 border-border">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-foreground">
                {formatDate(new Date())}
              </div>
              <div className="text-lg font-semibold text-foreground">
                {zuidData.length} personen
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Zoek op naam, badge, kamer..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Room Filter */}
            <select
              className="px-4 py-2 border-2 border-input rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground"
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
              className="px-4 py-2 border-2 border-input rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:ring-2 focus:ring-ring flex items-center gap-2 transition-colors"
            >
              <Printer className="h-5 w-5" />
              Print ({printOrientation === 'portrait' ? 'Portrait' : 'Landscape'})
            </button>

          </div>
        </div>

        {/* Ground Floor Rooms */}
        <div className="space-y-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">Grond</h2>
            <p className="text-sm text-muted-foreground">2.06 - 2.08</p>
          </div>
          {groundRoomsForDisplay.map(room => {
            const roomResidents = sortedRoomGroups[room] || [];
            const roomConfig = getRoomConfig(room);
            const maxBeds = roomConfig?.maxBeds || 5;
            
            return (
              <div key={room} className="bg-card shadow-sm rounded-lg overflow-hidden border-2 border-border">
                {/* Room Header */}
                <div className="bg-muted px-4 py-3 border-b-2 border-border">
                  <h3 className="text-lg font-semibold text-foreground">Kamer {room}</h3>
                  <p className="text-sm text-muted-foreground">{roomResidents.length} van {maxBeds} bedden bezet</p>
                </div>
                
                {/* Room Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y-2 divide-border">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Bed
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Achternaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Voornaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Nationaliteit
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Taal
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Geslacht
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Opmerkingen
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Badge
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y-2 divide-border">
                      {Array.from({ length: maxBeds }, (_, bedIndex) => {
                        const bedNumber = bedIndex + 1;
                        const resident = roomResidents.find((r: any) => r.bedNumber === bedNumber);
                        const index = bedIndex;
                        const isMedicalRoom = room === '2.19';
                        const baseRowClass = index % 2 === 0 ? 'bg-card' : 'bg-muted';
                        const hoverClass = isMedicalRoom ? 'hover:bg-red-200' : 'hover:bg-accent/50';
                        const medicalBackground = isMedicalRoom ? 'bg-red-100' : '';

                        return (
                        <tr key={resident?.id || `${room}-bed-${bedNumber}`} className={`${baseRowClass} ${medicalBackground} ${hoverClass} transition-colors border-b-2 border-border`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r-2 border-border text-center">
                            {isMedicalRoom ? '' : bedNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? resident.lastName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? resident.firstName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? resident.nationality : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r-2 border-border text-center">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
                                    placeholder="Taal bewerken..."
                                    autoComplete="on"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleLanguageSave(resident.id)}
                                    className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-primary/90"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleLanguageCancel(resident.id)}
                                    className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-gray-600"
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
                                  {resident.language || <span className="text-muted-foreground italic">Klik om toe te voegen</span>}
                                </div>
                              )
                            ) : (
                              <span className="italic text-muted-foreground">Leeg</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? (resident.gender === 'M' ? 'Mannelijk' : 'Vrouwelijk') : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r-2 border-border text-center">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
                                    placeholder="Opmerking toevoegen..."
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleRemarksSave(resident.id)}
                                    className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-primary/90"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleRemarksCancel(resident.id)}
                                    className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-gray-600"
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
                                    <span className="inline-flex items-center gap-2">
                                      <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 text-xs font-medium rounded text-black dark:text-yellow-100">
                                        {stripDateFromRemarks(resident.roomRemarks)}
                                      </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRemarksDelete(resident.id); }}
                                        className="px-2 py-0.5 bg-destructive text-white text-xs font-medium rounded hover:bg-destructive/90"
                                        title="Verwijder opmerking"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Klik om opmerking toe te voegen</span>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="italic text-muted-foreground">Leeg</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r-2 border-border text-center">
                            {resident ? resident.badge : <span className="italic text-muted-foreground">Leeg</span>}
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

        {/* First Floor Rooms */}
        <div className="page-break space-y-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">Verdieping</h2>
            <p className="text-sm text-muted-foreground">2.14 - 2.19</p>
          </div>
          {firstFloorRoomsForDisplay.map(room => {
            if (room === medicalRoomNumber) {
              const roomResidents = sortedRoomGroups[room] || [];
              const maxBeds = 3; // MED room has 3 beds
              
              return (
                <div key={room} className="bg-card shadow-sm rounded-lg overflow-hidden border-2 border-red-600">
                  {/* Room Header */}
                  <div className="bg-red-600 px-4 py-3 border-b-2 border-border">
                    <h3 className="text-lg font-semibold text-white text-center tracking-wider">MED</h3>
                    <p className="text-sm text-red-100 text-center">{roomResidents.length} van {maxBeds} bed bezet</p>
                  </div>
                  
                  {/* Room Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-border">
                      <thead className="bg-primary text-primary-foreground">
                        <tr>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Bed
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Achternaam
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Voornaam
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Nationaliteit
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Taal
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Geslacht
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Opmerkingen
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                            Badge
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y-2 divide-border">
                        {Array.from({ length: maxBeds }, (_, bedIndex) => {
                          const bedNumber = bedIndex + 1;
                          const resident = roomResidents.find((r: any) => r.bedNumber === bedNumber);
                          
                          return (
                            <tr key={resident?.id || `${room}-bed-${bedNumber}`} className="hover:bg-red-100 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r-2 border-border text-center">
                                {bedNumber}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                                {resident ? resident.lastName : <span className="italic text-muted-foreground">Leeg</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                                {resident ? resident.firstName : <span className="italic text-muted-foreground">Leeg</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                                {resident ? resident.nationality : <span className="italic text-muted-foreground">Leeg</span>}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-foreground border-r-2 border-border text-center">
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
                                        className="flex-1 px-3 py-2 text-sm border-2 border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
                                        placeholder="Taal bewerken..."
                                        autoComplete="on"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleLanguageSave(resident.id)}
                                        className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-primary/90"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => handleLanguageCancel(resident.id)}
                                        className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-gray-600"
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
                                      {resident.language || <span className="text-muted-foreground italic">Klik om toe te voegen</span>}
                                    </div>
                                  )
                                ) : (
                                  <span className="italic text-muted-foreground">Leeg</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                                {resident ? (resident.gender === 'M' ? 'Mannelijk' : 'Vrouwelijk') : <span className="italic text-muted-foreground">Leeg</span>}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-foreground border-r-2 border-border text-center">
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
                                        className="flex-1 px-3 py-2 text-sm border-2 border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
                                        placeholder="Opmerking toevoegen..."
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleRemarksSave(resident.id)}
                                        className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-primary/90"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => handleRemarksCancel(resident.id)}
                                        className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-gray-600"
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
                                        <span className="inline-flex items-center gap-2">
                                          <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 text-xs font-medium rounded text-black dark:text-yellow-100">
                                            {stripDateFromRemarks(resident.roomRemarks)}
                                          </span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleRemarksDelete(resident.id); }}
                                            className="px-2 py-0.5 bg-destructive text-white text-xs font-medium rounded hover:bg-destructive/90"
                                            title="Verwijder opmerking"
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">Klik om opmerking toe te voegen</span>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <span className="italic text-muted-foreground">Leeg</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r-2 border-border text-center">
                                {resident ? resident.badge : <span className="italic text-muted-foreground">Leeg</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            const roomResidents = sortedRoomGroups[room] || [];
            const roomConfig = getRoomConfig(room);
            const maxBeds = roomConfig?.maxBeds || 3;

            return (
              <div key={room} className="bg-card shadow-sm rounded-lg overflow-hidden border-2 border-border">
                {/* Room Header */}
                <div className="bg-muted px-4 py-3 border-b-2 border-border">
                  <h3 className="text-lg font-semibold text-foreground">Kamer {room}
                  </h3>
                  <p className="text-sm text-muted-foreground">{roomResidents.length} van {maxBeds} bedden bezet</p>
                </div>

                {/* Room Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y-2 divide-border">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Bed
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Achternaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Voornaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Nationaliteit
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Taal
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Geslacht
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Opmerkingen
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r-2 border-border">
                          Badge
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y-2 divide-border">
                      {Array.from({ length: maxBeds }, (_, bedIndex) => {
                        const bedNumber = bedIndex + 1;
                        const resident = roomResidents.find((r: any) => r.bedNumber === bedNumber);
                        const index = bedIndex;

                        return (
                        <tr key={resident?.id || `${room}-bed-${bedNumber}`} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted'} hover:bg-accent/50 transition-colors border-b-2 border-border`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r-2 border-border text-center">
                            {bedNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? resident.lastName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? resident.firstName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? resident.nationality : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r-2 border-border text-center">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
                                    placeholder="Taal bewerken..."
                                    autoComplete="on"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleLanguageSave(resident.id)}
                                    className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-primary/90"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleLanguageCancel(resident.id)}
                                    className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-gray-600"
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
                                  {resident.language || <span className="text-muted-foreground italic">Klik om toe te voegen</span>}
                                </div>
                              )
                            ) : (
                              <span className="italic text-muted-foreground">Leeg</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r-2 border-border text-center">
                            {resident ? (resident.gender === 'M' ? 'Mannelijk' : 'Vrouwelijk') : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r-2 border-border text-center">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-border rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
                                    placeholder="Opmerking toevoegen..."
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleRemarksSave(resident.id)}
                                    className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-primary/90"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleRemarksCancel(resident.id)}
                                    className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded min-w-[32px] h-10 flex items-center justify-center hover:bg-gray-600"
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
                                    <span className="inline-flex items-center gap-2">
                                      <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 text-xs font-medium rounded text-black dark:text-yellow-100">
                                        {stripDateFromRemarks(resident.roomRemarks)}
                                      </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRemarksDelete(resident.id); }}
                                        className="px-2 py-0.5 bg-destructive text-white text-xs font-medium rounded hover:bg-destructive/90"
                                        title="Verwijder opmerking"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      Klik om opmerking toe te voegen
                                    </span>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="italic text-muted-foreground">Leeg</span>
                            )}
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
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Toont <span className="font-medium">{filteredData.length}</span> van{' '}
            <span className="font-medium">{zuidData.length}</span> bewoners in Zuid gebouw
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

    {/* Print-only layout - enhanced compact design */}
    <div className="print-only">
      {/* Ground Floor Rooms - Page 1 (2.06-2.19 incl. MED) */}
      <div style={{ pageBreakAfter: 'always', breakAfter: 'always' }}>
        {/* Header with gradient background */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '1px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            OOC STEENOKKERZEEL - ZUID
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: '10px',
            color: '#e0e7ff',
            marginTop: '2px',
            fontStyle: 'italic'
          }}>
            Bewonersoverzicht Begane Grond - Kamers 2.06 t/m 2.19 (incl. MED)
          </div>
        </div>

        <table style={{ 
          width: '100%', 
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '9px',
          marginTop: '5px',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(90deg, #064e3b 0%, #059669 100%)',
              color: 'white'
            }}>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '10px',
                letterSpacing: '0.5px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                  {formatDate(new Date())}
                </div>
                <div style={{ fontSize: '8px', opacity: 0.9, marginTop: '1px' }}>Kamer</div>
              </th>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                BED
              </th>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                ACHTERNAAM
              </th>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                VOORNAAM
              </th>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                NATIONALITEIT
              </th>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                TAAL
              </th>
              <th style={{ 
                border: '1px solid #047857',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                GESLACHT
              </th>
              <th style={{ 
                border: '1px solid #047857',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                OPMERKINGEN
              </th>
            </tr>
          </thead>
          <tbody>
            {groundRoomsForDisplay.map(room => {
              const roomResidents = sortedRoomGroups[room] || [];
              const roomConfig = getRoomConfig(room);
              const maxBeds = roomConfig?.maxBeds || 5;
              
              return Array.from({ length: maxBeds }, (_, bedIndex) => {
                const bedNumber = bedIndex + 1;
                const resident = roomResidents.find((r: any) => r.bedNumber === bedNumber);
                const isFirstBedInRoom = bedNumber === 1;
                const isEmpty = !resident;
                const isAgeVerificationRoom = room === '2.07' || room === '2.08';
                const isMedicalRoom = room === '2.19';
                
                const rowBgColor = isMedicalRoom
                  ? (isEmpty ? '#fee2e2' : '#fecaca')
                  : (isEmpty ? '#f9fafb' : (bedIndex % 2 === 0 ? '#ffffff' : '#f3f4f6'));

                return (
                  <tr key={`${room}-${bedNumber}`} style={{
                    backgroundColor: rowBgColor
                  }}>
                    {isFirstBedInRoom && (
                      <td 
                        style={{ 
                          border: '1px solid #d1d5db',
                          borderLeft: '3px solid #059669',
                          padding: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          background: isMedicalRoom
                            ? 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)'
                            : isAgeVerificationRoom
                            ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                            : 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
                          color: isMedicalRoom ? '#ffffff' : isAgeVerificationRoom ? '#7c2d12' : '#164e63',
                          verticalAlign: 'middle',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                        }}
                        rowSpan={maxBeds}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{room}</div>
                        {isAgeVerificationRoom && (
                          <div style={{ fontSize: '7px', marginTop: '2px', opacity: 0.9 }}>LEEFTIJDSTWIJFEL</div>
                        )}
                        {isMedicalRoom && (
                          <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 700 }}>MED</div>
                        )}
                      </td>
                    )}
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      padding: '4px',
                      textAlign: 'center',
                      width: '30px',
                      fontWeight: '600',
                      fontSize: '10px',
                      color: isEmpty ? '#9ca3af' : '#1f2937',
                      backgroundColor: isMedicalRoom ? '#fee2e2' : (isEmpty ? 'transparent' : (resident ? '#ecfdf5' : 'transparent'))
                    }}>
                      {isMedicalRoom ? '' : bedNumber}
                    </td>
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      padding: '4px',
                      textAlign: 'left',
                      width: '110px',
                      fontWeight: resident ? '500' : 'normal',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal',
                      fontSize: '8px'
                    }}>
                      {resident?.lastName || (isEmpty ? 'Vrij' : '')}
                    </td>
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      padding: '4px',
                      textAlign: 'left',
                      width: '110px',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal',
                      fontSize: '8px'
                    }}>
                      {resident?.firstName || (isEmpty ? '-' : '')}
                    </td>
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      padding: '4px',
                      textAlign: 'left',
                      width: '80px',
                      fontSize: '8px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.nationality || ''}
                    </td>
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      padding: '4px',
                      textAlign: 'center',
                      width: '60px',
                      fontSize: '8px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.language || ''}
                    </td>
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      padding: '4px',
                      textAlign: 'center',
                      width: '40px',
                      fontWeight: '500',
                      fontSize: '8px',
                      color: resident?.gender === 'M' ? '#1e40af' : (resident?.gender === 'F' || resident?.gender === 'V' ? '#be185d' : '#9ca3af')
                    }}>
                      {resident?.gender || ''}
                    </td>
                    <td style={{ 
                      border: '1px solid #d1d5db',
                      borderRight: '1px solid #a7f3d0',
                      padding: '4px',
                      textAlign: 'left',
                      minWidth: '120px',
                      fontSize: '8px',
                      backgroundColor: resident?.roomRemarks ? '#fef3c7' : 'transparent',
                      color: resident?.roomRemarks ? '#92400e' : '#6b7280',
                      fontWeight: resident?.roomRemarks ? '500' : 'normal'
                    }}>
                      {stripDateFromRemarks(resident?.roomRemarks) || ''}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
        
        {/* Footer for page 1 */}
        <div style={{
          marginTop: '15px',
          padding: '5px',
          borderTop: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '8px',
          color: '#6b7280'
        }}>
          <div>Pagina 1 - Begane Grond</div>
          <div style={{ fontStyle: 'italic' }}>OOC Steenokkerzeel Zuid</div>
        </div>
      </div>

      {/* First Floor Rooms - Page 2 (2.14-2.19) */}
      <div style={{ pageBreakBefore: 'always', breakBefore: 'always' }}>
        {/* Header with gradient background */}
        <div style={{ 
          background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '1px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            OOC STEENOKKERZEEL - ZUID
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: '10px',
            color: '#fed7aa',
            marginTop: '2px',
            fontStyle: 'italic'
          }}>
            Bewonersoverzicht Eerste Verdieping - Kamers 2.14 t/m 2.19 (incl. MED)
          </div>
        </div>
        
        <table style={{ 
          width: '100%', 
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '9px',
          marginTop: '5px',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(90deg, #701a75 0%, #c026d3 100%)',
              color: 'white'
            }}>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '10px',
                letterSpacing: '0.5px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                  {formatDate(new Date())}
                </div>
                <div style={{ fontSize: '8px', opacity: 0.9, marginTop: '1px' }}>Kamer</div>
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                BED
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                ACHTERNAAM
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                VOORNAAM
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                NATIONALITEIT
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                TAAL
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                GESLACHT
              </th>
              <th style={{ 
                border: '1px solid #a21caf',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
                OPMERKINGEN
              </th>
            </tr>
          </thead>
          <tbody>
            {firstFloorRoomsForDisplay.map(room => {
              if (room === medicalRoomNumber) {
                const roomResidents = sortedRoomGroups[room] || [];
                const maxBeds = 3; // MED room has 3 beds
                
                return Array.from({ length: maxBeds }, (_, bedIndex) => {
                  const bedNumber = bedIndex + 1;
                  const resident = roomResidents.find((r: any) => r.bedNumber === bedNumber);
                  const isEmpty = !resident;
                  const rowBgColor = '#fee2e2'; // Light red for MED room
                  
                  return (
                    <tr key={`${room}-${bedNumber}`} style={{
                      backgroundColor: rowBgColor
                    }}>
                      <td 
                        style={{ 
                          border: '1px solid #a21caf',
                          borderLeft: '3px solid #dc2626',
                          padding: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
                          color: '#ffffff',
                          verticalAlign: 'middle'
                        }}
                        rowSpan={maxBeds}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>2.19</div>
                        <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 700 }}>MED</div>
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        padding: '4px',
                        textAlign: 'center',
                        width: '30px',
                        fontWeight: '600',
                        fontSize: '10px',
                        color: isEmpty ? '#9ca3af' : '#1f2937'
                      }}>
                        {bedNumber}
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        padding: '4px',
                        textAlign: 'left',
                        width: '110px',
                        fontWeight: resident ? '500' : 'normal',
                        color: isEmpty ? '#9ca3af' : '#111827',
                        fontStyle: isEmpty ? 'italic' : 'normal',
                        fontSize: '8px'
                      }}>
                        {resident?.lastName || (isEmpty ? 'Vrij' : '')}
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        padding: '4px',
                        textAlign: 'left',
                        width: '110px',
                        color: isEmpty ? '#9ca3af' : '#111827',
                        fontStyle: isEmpty ? 'italic' : 'normal',
                        fontSize: '8px'
                      }}>
                        {resident?.firstName || (isEmpty ? '-' : '')}
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        padding: '4px',
                        textAlign: 'left',
                        width: '80px',
                        fontSize: '8px',
                        color: isEmpty ? '#9ca3af' : '#374151'
                      }}>
                        {resident?.nationality || ''}
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        padding: '4px',
                        textAlign: 'center',
                        width: '60px',
                        fontSize: '8px',
                        color: isEmpty ? '#9ca3af' : '#374151'
                      }}>
                        {resident?.language || ''}
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        padding: '4px',
                        textAlign: 'center',
                        width: '40px',
                        fontWeight: '500',
                        fontSize: '8px',
                        color: resident?.gender === 'M' ? '#1e40af' : (resident?.gender === 'F' || resident?.gender === 'V' ? '#be185d' : '#9ca3af')
                      }}>
                        {resident?.gender || ''}
                      </td>
                      <td style={{ 
                        border: '1px solid #a21caf',
                        borderRight: '2px solid black !important',
                        padding: '4px',
                        textAlign: 'left',
                        minWidth: '120px',
                        fontSize: '8px',
                        backgroundColor: resident?.roomRemarks ? '#fef3c7' : 'transparent',
                        color: resident?.roomRemarks ? '#92400e' : '#6b7280',
                        fontWeight: resident?.roomRemarks ? '500' : 'normal'
                      }}>
                        {stripDateFromRemarks(resident?.roomRemarks) || ''}
                      </td>
                    </tr>
                  );
                });
              }

              const roomResidents = sortedRoomGroups[room] || [];
              const roomConfig = getRoomConfig(room);
              const maxBeds = roomConfig?.maxBeds || 3;

              return Array.from({ length: maxBeds }, (_, bedIndex) => {
                const bedNumber = bedIndex + 1;
                const resident = roomResidents.find((r: any) => r.bedNumber === bedNumber);
                const isFirstBedInRoom = bedNumber === 1;
                const isEmpty = !resident;
                const rowBgColor = isEmpty ? '#fdf4ff' : (bedIndex % 2 === 0 ? '#ffffff' : '#fdf2f8');

                return (
                  <tr key={`${room}-${bedNumber}`} style={{
                    backgroundColor: rowBgColor
                  }}>
                    {isFirstBedInRoom && (
                      <td 
                        style={{ 
                          border: '1px solid #a21caf',
                          borderLeft: '3px solid #c026d3',
                          padding: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                          color: '#7c2d12',
                          verticalAlign: 'middle',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                        }}
                        rowSpan={maxBeds}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{room}</div>
                        {(room === '2.14' || room === '2.15' || room === '2.16' || room === '2.17' || room === '2.18') && 
                          <div style={{ fontSize: '7px', marginTop: '2px', opacity: 0.9 }}>ZONDER LT</div>}
                      </td>
                    )}
                    <td style={{ 
                      border: '1px solid #a21caf',
                      padding: '4px',
                      textAlign: 'center',
                      width: '30px',
                      fontWeight: '600',
                      fontSize: '10px',
                      color: isEmpty ? '#9ca3af' : '#1f2937',
                      backgroundColor: isEmpty ? 'transparent' : (resident ? '#fdf2f8' : 'transparent')
                    }}>
                      {bedNumber}
                    </td>
                    <td style={{ 
                      border: '1px solid #a21caf',
                      padding: '4px',
                      textAlign: 'left',
                      width: '110px',
                      fontWeight: resident ? '500' : 'normal',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal',
                      fontSize: '8px'
                    }}>
                      {resident?.lastName || (isEmpty ? 'Vrij' : '')}
                    </td>
                    <td style={{ 
                      border: '1px solid #a21caf',
                      padding: '4px',
                      textAlign: 'left',
                      width: '110px',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal',
                      fontSize: '8px'
                    }}>
                      {resident?.firstName || (isEmpty ? '-' : '')}
                    </td>
                    <td style={{ 
                      border: '1px solid #a21caf',
                      padding: '4px',
                      textAlign: 'left',
                      width: '80px',
                      fontSize: '8px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.nationality || ''}
                    </td>
                    <td style={{ 
                      border: '1px solid #a21caf',
                      padding: '4px',
                      textAlign: 'center',
                      width: '60px',
                      fontSize: '8px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.language || ''}
                    </td>
                    <td style={{ 
                      border: '1px solid #a21caf',
                      padding: '4px',
                      textAlign: 'center',
                      width: '40px',
                      fontWeight: '500',
                      fontSize: '8px',
                      color: resident?.gender === 'M' ? '#1e40af' : (resident?.gender === 'F' || resident?.gender === 'V' ? '#be185d' : '#9ca3af')
                    }}>
                      {resident?.gender || ''}
                    </td>
                    <td style={{ 
                      border: '1px solid #a21caf',
                      borderRight: '2px solid black !important',
                      padding: '4px',
                      textAlign: 'left',
                      minWidth: '120px',
                      fontSize: '8px',
                      backgroundColor: resident?.roomRemarks ? '#fef3c7' : 'transparent',
                      color: resident?.roomRemarks ? '#92400e' : '#6b7280',
                      fontWeight: resident?.roomRemarks ? '500' : 'normal'
                    }}>
                      {stripDateFromRemarks(resident?.roomRemarks) || ''}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
        
        {/* Footer for page 2 */}
        <div style={{
          marginTop: '15px',
          padding: '5px',
          borderTop: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '8px',
          color: '#6b7280'
        }}>
          <div>Pagina 2 - Eerste Verdieping</div>
          <div style={{ fontStyle: 'italic' }}>OOC Steenokkerzeel Zuid</div>
        </div>
      </div>
    </div>
    </>
  );
}
