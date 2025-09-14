'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, Filter, FileText, FolderOpen, ExternalLink, ChevronDown } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from "../../../lib/utils";
import ResidentDocumentsModal from '../../components/ResidentDocumentsModal';

function AdministrativeDocumentsPageContent() {
  const { bewonerslijst, outResidents, moveToOutAndDelete } = useData();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('IN');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<{[key: number]: boolean}>({});
  
  // Handle search from URL parameters
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // IN residents are all current residents in bewonerslijst (OUT residents are already excluded)
  // OUT residents come from separate outResidents state
  const inResidents = bewonerslijst;

  // Apply filters based on selected document type
  const getFilteredResidents = (residents: any[]) => {
    if (!residents || !Array.isArray(residents)) {
      return [];
    }
    
    return residents.filter(resident => {
      if (!resident) return false;
      
      const matchesSearch = 
        (resident.lastName && resident.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resident.firstName && resident.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resident.badge && resident.badge.toString().includes(searchTerm)) ||
        (resident.nationality && resident.nationality.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resident.ovNumber && resident.ovNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !filterStatus || resident.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredInResidents = getFilteredResidents(inResidents || []);
  const filteredOutResidents = getFilteredResidents(outResidents || []);

  // Use appropriate residents based on selected document type
  const currentResidents = selectedDocumentType === 'IN' ? filteredInResidents : filteredOutResidents;
  
  // Sort residents by badge number
  const sortedResidents = currentResidents.sort((a, b) => a.badge - b.badge);


  const handleResidentClick = (resident: any) => {
    setSelectedResident(resident);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResident(null);
  };

  const handleStatusChange = (residentId: number, newStatus: string) => {
    console.log(`🔄 handleStatusChange called with residentId: ${residentId}, newStatus: ${newStatus}`);
    console.log(`📋 bewonerslijst length:`, bewonerslijst?.length);
    console.log(`🔍 Looking for resident with ID: ${residentId} in bewonerslijst`);
    console.log(`📋 Available resident IDs in bewonerslijst:`, bewonerslijst?.map(r => ({ id: r.id, badge: r.badge, name: `${r.first_name} ${r.last_name}` })));
    
    if (newStatus === 'OUT') {
      let resident = bewonerslijst.find(r => r.id === residentId);
      console.log(`🔄 Found resident in bewonerslijst by ID:`, resident);
      
      // If not found by ID, try to find by badge number (fallback)
      if (!resident) {
        console.log(`🔍 Resident not found by ID, trying to find by badge number...`);
        // We need to get the badge number from the current residents list
        const currentResident = currentResidents.find(r => r.id === residentId);
        if (currentResident) {
          console.log(`🔍 Found current resident with badge:`, currentResident.badge);
          resident = bewonerslijst.find(r => r.badge === currentResident.badge);
          console.log(`🔄 Found resident in bewonerslijst by badge:`, resident);
        }
      }
      
      const confirmed = window.confirm(
        `Weet u zeker dat u ${resident?.first_name} ${resident?.last_name} wilt verplaatsen naar OUT?\n\nDe bewoner wordt verplaatst naar de OUT sectie van Administratieve Documenten en verwijderd uit alle andere lijsten.`
      );
      
      if (!confirmed) {
        console.log('❌ User cancelled OUT action');
        setEditingStatus({ ...editingStatus, [residentId]: false });
        return;
      }
      
      console.log('✅ User confirmed OUT action, calling moveToOutAndDelete');
      // Move to OUT and delete from all lists
      moveToOutAndDelete(residentId);
      setEditingStatus({ ...editingStatus, [residentId]: false });
    } else {
      // For other status changes, update normally (though this shouldn't happen in OUT section)
      console.log(`🔄 Other status change: ${newStatus}`);
      setEditingStatus({ ...editingStatus, [residentId]: false });
    }
  };

  const handleStatusClick = (e: React.MouseEvent, residentId: number) => {
    e.stopPropagation(); // Prevent row click
    setEditingStatus({ ...editingStatus, [residentId]: true });
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
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
          {/* Header */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">OOC STEENOKKERZEEL</h1>
              <div className="flex items-center justify-center mt-2">
                <span className="text-lg text-gray-700 dark:text-gray-300 mr-2">Administratieve Documenten</span>
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-lg font-semibold transition-colors"
                  >
                    <span>{selectedDocumentType}</span>
                    <ChevronDown className={`w-4 h-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg z-50 min-w-full">
                      <button
                        onClick={() => {
                          setSelectedDocumentType('IN');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          selectedDocumentType === 'IN' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        IN
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDocumentType('OUT');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          selectedDocumentType === 'OUT' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        OUT
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-lg text-gray-700 dark:text-gray-300 ml-2">- Bewonersoverzicht</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className={`px-3 py-2 text-center font-semibold text-black dark:text-white rounded ${
                  selectedDocumentType === 'IN' ? 'bg-green-200 dark:bg-green-600' : 'bg-orange-200 dark:bg-orange-600'
                }`}>
                  <FileText className="inline-block w-4 h-4 mr-2" />
                  Bewonersoverzicht ({selectedDocumentType})
                </div>
                <div className="text-center text-gray-900 dark:text-gray-100">
                  <span className="text-sm">Totaal Bewoners: {sortedResidents.length}</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Klik op een bewoner om documenten te bekijken</p>
                </div>
                <div className="text-right">
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls - Only show for IN */}
          {selectedDocumentType === 'IN' && (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Zoek op naam, badgenummer, nationaliteit..."
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Alle Statussen</option>
                  <option value="Actief">Actief</option>
                  <option value="OUT">OUT</option>
                </select>
              </div>
              </div>
            </div>
          )}

          {/* Content based on selected document type */}
          {selectedDocumentType === 'IN' ? (
            <div>
              {/* Resident Directory Table */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Badge Nr.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Volledige Naam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kamer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nationaliteit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedResidents.map((resident, index) => (
                    <tr 
                      key={resident.badge} 
                      className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'} hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors`}
                      onClick={() => handleResidentClick(resident)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {resident.badge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                          <div className="font-medium">{resident.lastName}, {resident.firstName}</div>
                          <FolderOpen className="w-4 h-4 ml-2 text-gray-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {resident.room || 'Niet toegewezen'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {resident.nationality}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-between">
                          <div className="relative">
                            {editingStatus[resident.id] ? (
                              <select
                                autoFocus
                                value={resident.status}
                                onChange={(e) => handleStatusChange(resident.id, e.target.value)}
                                onBlur={() => setEditingStatus({ ...editingStatus, [resident.id]: false })}
                                className="text-xs font-semibold rounded-full px-2 py-1 border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="Actief">Actief</option>
                                <option value="OUT">OUT</option>
                              </select>
                            ) : (
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                  resident.status === 'Actief' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : resident.status === 'OUT'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                                onClick={(e) => handleStatusClick(e, resident.id)}
                                title="Klik om status te wijzigen"
                              >
                                {resident.status}
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>

              {sortedResidents.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Geen bewoners gevonden die aan uw zoekcriteria voldoen.
                </div>
              )}
            </div>
          ) : (
            /* OUT - Show residents with OUT status */
            <div>
              {/* Search and Filter Controls for OUT */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Zoek op naam, badgenummer, nationaliteit..."
                      className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="text-center text-gray-600 dark:text-gray-400">
                    <span className="text-sm">OUT Bewoners: {sortedResidents.length}</span>
                    <p className="text-xs mt-1">Bewoners die zijn uitgegaan</p>
                  </div>
                </div>
              </div>

              {sortedResidents.length > 0 ? (
                /* OUT Residents Table */
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-orange-50 dark:bg-orange-900/20">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Badge Nr.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Volledige Naam
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Kamer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Nationaliteit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedResidents.map((resident, index) => (
                          <tr 
                            key={resident.badge} 
                            className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-orange-50/50 dark:bg-orange-900/10'} hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors`}
                            onClick={() => handleResidentClick(resident)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600 dark:text-orange-400">
                              {resident.badge}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex items-center">
                                <div className="font-medium">{resident.lastName}, {resident.firstName}</div>
                                <FolderOpen className="w-4 h-4 ml-2 text-gray-400" />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {resident.room || 'Niet toegewezen'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {resident.nationality}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-between">
                                <div className="relative">
                                  {editingStatus[resident.id] ? (
                                    <select
                                      autoFocus
                                      value={resident.status}
                                      onChange={(e) => handleStatusChange(resident.id, e.target.value)}
                                      onBlur={() => setEditingStatus({ ...editingStatus, [resident.id]: false })}
                                      className="text-xs font-semibold rounded-full px-2 py-1 border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="Actief">Actief</option>
                                      <option value="OUT">OUT</option>
                                    </select>
                                  ) : (
                                    <span 
                                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                      onClick={(e) => handleStatusClick(e, resident.id)}
                                      title="Klik om status te wijzigen"
                                    >
                                      {resident.status}
                                    </span>
                                  )}
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Empty state when no OUT residents */
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 border dark:border-gray-700">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20">
                      <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                      Geen OUT bewoners
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Er zijn momenteel geen bewoners met OUT status.
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Bewoners verschijnen hier wanneer hun status wordt gewijzigd naar OUT.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Print Version */}
      <div className="print-only">
        {/* Print Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          borderBottom: '2px solid #000',
          paddingBottom: '10px'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '0 0 10px 0',
            color: '#000'
          }}>
            OOC STEENOKKERZEEL
          </h1>
          <h2 style={{ 
            fontSize: '16px', 
            margin: '0',
            color: '#333'
          }}>
            Administratieve Documenten - Bewonersoverzicht
          </h2>
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '5px'
          }}>
            Totaal Bewoners: {sortedResidents.length} | Gegenereerd: {formatDate(new Date())}
          </div>
        </div>

        {/* Print Table */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '10px',
          border: '1px solid #000'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ 
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'left',
                fontWeight: 'bold',
                width: '12%'
              }}>
                BADGE NR.
              </th>
              <th style={{ 
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'left',
                fontWeight: 'bold',
                width: '35%'
              }}>
                VOLLEDIGE NAAM
              </th>
              <th style={{ 
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'left',
                fontWeight: 'bold',
                width: '15%'
              }}>
                KAMER
              </th>
              <th style={{ 
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'left',
                fontWeight: 'bold',
                width: '25%'
              }}>
                NATIONALITEIT
              </th>
              <th style={{ 
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'left',
                fontWeight: 'bold',
                width: '13%'
              }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResidents.map((resident, index) => (
              <tr key={resident.badge} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ 
                  border: '1px solid #000',
                  padding: '6px',
                  fontWeight: 'bold',
                  color: '#0066cc'
                }}>
                  {resident.badge}
                </td>
                <td style={{ 
                  border: '1px solid #000',
                  padding: '6px',
                  fontWeight: '500'
                }}>
                  {resident.lastName}, {resident.firstName}
                </td>
                <td style={{ 
                  border: '1px solid #000',
                  padding: '6px'
                }}>
                  {resident.room || 'Niet toegewezen'}
                </td>
                <td style={{ 
                  border: '1px solid #000',
                  padding: '6px'
                }}>
                  {resident.nationality}
                </td>
                <td style={{ 
                  border: '1px solid #000',
                  padding: '6px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: resident.status === 'Actief' ? '#008000' : '#cc0000'
                }}>
                  {resident.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Footer */}
        <div style={{
          marginTop: '20px',
          fontSize: '8px',
          color: '#666',
          textAlign: 'center',
          borderTop: '1px solid #ccc',
          paddingTop: '10px'
        }}>
          OOC Steenokkerzeel - Administratieve Documenten | Pagina 1
        </div>
      </div>

      {/* Resident Documents Modal */}
      {selectedResident && (
        <ResidentDocumentsModal
          resident={selectedResident}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

export default function AdministrativeDocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdministrativeDocumentsPageContent />
    </Suspense>
  );
}