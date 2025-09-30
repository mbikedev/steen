'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, MapPin, Users, Printer } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';
import { getRoomConfig } from '../../../lib/bedConfig';

export default function NoordPage() {
  const { noordData, updateInDataMatchIt } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [editingRemarks, setEditingRemarks] = useState<{[key: number]: string}>({});
  const [editingLanguage, setEditingLanguage] = useState<{[key: number]: string}>({});
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Helper function to convert gender codes to Dutch
  const formatGender = (gender: string | undefined) => {
    if (!gender) return 'Geen gegevens';
    switch (gender.toUpperCase()) {
      case 'M': return 'Mannelijk';
      case 'F': return 'Vrouwelijk';
      default: return `Onbekend (${gender})`;
    }
  };

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
    const resident = noordData.find(r => r.id === residentId);
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

  const handleRemarksDelete = (residentId: number) => {
    updateInDataMatchIt(residentId, { roomRemarks: '' });
    // Ensure any editing state is cleared
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
    const resident = noordData.find(r => r.id === residentId);
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
            margin: 5mm;
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
      <div className="p-6 text-foreground">
        {/* Header - Matching PDF Layout */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground font-title">STEENOKKERZEEL NOORD</h1>
          </div>
          
          <div className="bg-card shadow-sm rounded-lg p-4 mb-6 border-2 border-border">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-foreground border-r border-border align-middle h-16">
                {formatDate(new Date())}
              </div>
              <div className="text-lg font-semibold text-foreground border-r border-border align-middle h-16">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Zoek op naam, badge, kamer..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
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

        {/* Ground Floor Rooms - Page 1 */}
        <div className="ground-floor-section space-y-6 mb-12">
          <div className="mb-6 pb-4 border-b-4 border-primary">
            <h2 className="text-2xl font-bold text-primary">Begane Grond</h2>
            <p className="text-sm text-muted-foreground">1.06 - 1.09</p>
          </div>
          {groundFloorRooms.map(room => {
            const roomResidents = sortedRoomGroups[room] || [];
            const roomConfig = getRoomConfig(room);
            const maxBeds = roomConfig?.maxBeds || 3;

            return (
              <div key={room} className="bg-card shadow-lg rounded-lg overflow-hidden border-4 border-primary mb-8">
                {/* Room Header */}
                <div className="bg-primary px-6 py-4 border-b-4 border-primary">
                  <h3 className="text-xl font-bold text-primary-foreground">Kamer {room}</h3>
                  <p className="text-sm text-primary-foreground/80">{roomResidents.length} van {maxBeds} bedden bezet</p>
                </div>
                
                {/* Room Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-teal-700 text-white">
                      <tr>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Bed
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Achternaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Voornaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Nationaliteit
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Taal
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Geslacht
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Opmerkingen
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Badge
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {Array.from({ length: maxBeds }, (_, bedIndex) => {
                        const bedNumber = bedIndex + 1;
                        const resident = roomResidents.find(r => r.bedNumber === bedNumber);
                        const index = bedIndex;
                        
                        return (
                        <tr key={resident?.id || `${room}-bed-${bedNumber}`} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted'} hover:bg-accent/50 transition-colors border-b border-border`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r border-border text-center align-middle h-14">
                            {bedNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? resident.lastName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? resident.firstName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? resident.nationality : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-input rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
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
                                  className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? formatGender(resident.gender) : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-input rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
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
                                  className="cursor-pointer hover:bg-muted p-1 rounded min-h-[24px]"
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r border-border text-center align-middle h-14">
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

        {/* First Floor Rooms - Page 2 */}
        <div className="page-break space-y-6 mt-12">
          <div className="mb-6 pb-4 border-b-4 border-primary">
            <h2 className="text-2xl font-bold text-primary">Eerste Verdieping</h2>
            <p className="text-sm text-muted-foreground">1.14 - 1.19 (Meisjes)</p>
          </div>
          {firstFloorRooms.map(room => {
            const roomResidents = sortedRoomGroups[room] || [];
            const roomConfig = getRoomConfig(room);
            const maxBeds = roomConfig?.maxBeds || 3;

            return (
              <div key={room} className="bg-card shadow-lg rounded-lg overflow-hidden border-4 border-primary mb-8">
                {/* Room Header */}
                <div className="bg-primary px-6 py-4 border-b-4 border-primary">
                  <h3 className="text-xl font-bold text-primary-foreground">Kamer {room}</h3>
                  <p className="text-sm text-primary-foreground/80">{roomResidents.length} van {maxBeds} bedden bezet</p>
                </div>
                
                {/* Room Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-teal-700 text-white">
                      <tr>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Bed
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Achternaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Voornaam
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Nationaliteit
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Taal
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Geslacht
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Opmerkingen
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-bold uppercase tracking-wider border-r border-border align-middle h-12 bg-primary text-primary-foreground">
                          Badge
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {Array.from({ length: maxBeds }, (_, bedIndex) => {
                        const bedNumber = bedIndex + 1;
                        const resident = roomResidents.find(r => r.bedNumber === bedNumber);
                        const index = bedIndex;
                        
                        return (
                        <tr key={resident?.id || `${room}-bed-${bedNumber}`} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted'} hover:bg-accent/50 transition-colors border-b border-border`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r border-border text-center align-middle h-14">
                            {bedNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? resident.lastName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? resident.firstName : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? resident.nationality : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-input rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
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
                                  className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
                            {resident ? formatGender(resident.gender) : <span className="italic text-muted-foreground">Leeg</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground border-r border-border text-center align-middle h-14">
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
                                    className="flex-1 px-3 py-2 text-sm border-2 border-input rounded focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
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
                                  className="cursor-pointer hover:bg-muted p-1 rounded min-h-[24px]"
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-foreground border-r border-border text-center align-middle h-14">
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

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
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

    {/* Print-only layout - enhanced design */}
    <div className="print-only">
      

      {/* Ground Floor Rooms - Page 1 */}
      <div>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 4px',
          fontSize: '8px',
          marginTop: '0'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)',
              color: 'white'
            }}>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  {formatDate(new Date())}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>Kamer</div>
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                BED
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                ACHTERNAAM
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                VOORNAAM
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                NATIONALITEIT
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                TAAL
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                GESLACHT
              </th>
              <th style={{
                border: '2px solid #0284c7',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
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
                const isEmpty = !resident;
                
                return (
                  <tr key={`${room}-${bedNumber}`} style={{
                    backgroundColor: isEmpty ? '#f0f9ff' : (bedIndex % 2 === 0 ? '#ffffff' : '#e0f2fe'),
                    borderBottom: bedNumber === maxBeds ? '4px solid #0284c7' : '1px solid #bae6fd'
                  }}>
                    {isFirstBedInRoom && (
                      <td
                        style={{
                          border: '2px solid #0284c7',
                          borderLeft: '4px solid #0284c7',
                          padding: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                          color: 'white',
                          verticalAlign: 'middle',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}
                        rowSpan={maxBeds}
                      >
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{room}</div>
                      </td>
                    )}
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'center',
                      width: '40px',
                      fontWeight: '600',
                      fontSize: '12px',
                      color: isEmpty ? '#9ca3af' : '#1f2937',
                      backgroundColor: isEmpty ? 'transparent' : (resident ? '#dbeafe' : 'transparent')
                    }}>
                      {bedNumber}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'left',
                      width: '130px',
                      fontWeight: resident ? '500' : 'normal',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal'
                    }}>
                      {resident?.lastName || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'left',
                      width: '130px',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal'
                    }}>
                      {resident?.firstName || (isEmpty ? '-' : '')}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'left',
                      width: '100px',
                      fontSize: '10px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.nationality || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'center',
                      width: '80px',
                      fontSize: '10px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.language || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'center',
                      width: '50px',
                      fontWeight: '500',
                      color: resident?.gender === 'M' ? '#1e40af' : (resident?.gender === 'F' ? '#be185d' : '#9ca3af')
                    }}>
                      {resident?.gender || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      borderRight: '2px solid #0284c7',
                      padding: '4px',
                      textAlign: 'left',
                      minWidth: '150px',
                      fontSize: '10px',
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
      </div>

      {/* First Floor Rooms - Page 2 */}
      <div style={{ pageBreakBefore: 'always', breakBefore: 'always' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 4px',
          fontSize: '8px',
          marginTop: '0'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)',
              color: 'white'
            }}>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  {formatDate(new Date())}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>Kamer</div>
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                BED
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                ACHTERNAAM
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                VOORNAAM
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                NATIONALITEIT
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                TAAL
              </th>
              <th style={{
                border: '2px solid #0284c7',
                borderRight: '2px solid rgba(255,255,255,0.3)',
                padding: '6px 4px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
                GESLACHT
              </th>
              <th style={{
                border: '2px solid #0284c7',
                padding: '6px 4px',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '11px',
                letterSpacing: '0.5px'
              }}>
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
                const isEmpty = !resident;
                
                return (
                  <tr key={`${room}-${bedNumber}`} style={{
                    backgroundColor: isEmpty ? '#f0f9ff' : (bedIndex % 2 === 0 ? '#ffffff' : '#e0f2fe'),
                    borderBottom: bedNumber === maxBeds ? '4px solid #0284c7' : '1px solid #bae6fd'
                  }}>
                    {isFirstBedInRoom && (
                      <td
                        style={{
                          border: '2px solid #0284c7',
                          borderLeft: '4px solid #0284c7',
                          padding: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                          color: 'white',
                          verticalAlign: 'middle',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}
                        rowSpan={maxBeds}
                      >
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{room}</div>
                      </td>
                    )}
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'center',
                      width: '40px',
                      fontWeight: '600',
                      fontSize: '12px',
                      color: isEmpty ? '#9ca3af' : '#1f2937',
                      backgroundColor: isEmpty ? 'transparent' : (resident ? '#dbeafe' : 'transparent')
                    }}>
                      {bedNumber}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'left',
                      width: '130px',
                      fontWeight: resident ? '500' : 'normal',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal'
                    }}>
                      {resident?.lastName || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'left',
                      width: '130px',
                      color: isEmpty ? '#9ca3af' : '#111827',
                      fontStyle: isEmpty ? 'italic' : 'normal'
                    }}>
                      {resident?.firstName || (isEmpty ? '-' : '')}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'left',
                      width: '100px',
                      fontSize: '10px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.nationality || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'center',
                      width: '80px',
                      fontSize: '10px',
                      color: isEmpty ? '#9ca3af' : '#374151'
                    }}>
                      {resident?.language || ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      padding: '4px',
                      textAlign: 'center',
                      width: '50px',
                      fontWeight: '500',
                      color: resident?.gender === 'M' ? '#1e40af' : (resident?.gender === 'F' || resident?.gender === 'V' ? '#be185d' : '#9ca3af')
                    }}>
                      {resident?.gender === 'F' || resident?.gender === 'V' ? 'V' : ''}
                    </td>
                    <td style={{
                      border: '2px solid #bae6fd',
                      borderRight: '2px solid #0284c7',
                      padding: '4px',
                      textAlign: 'left',
                      minWidth: '150px',
                      fontSize: '10px',
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
      </div>
    </div>
    </>
  );
}
