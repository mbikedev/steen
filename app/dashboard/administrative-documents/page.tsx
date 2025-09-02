'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, Filter, Printer, FileText, FolderOpen, ExternalLink } from 'lucide-react';
import { useData } from "../../../lib/DataContextDebug";
import ResidentDocumentsModal from '../../components/ResidentDocumentsModal';

function AdministrativeDocumentsPageContent() {
  const { bewonerslijst } = useData();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle search from URL parameters
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  const filteredResidents = bewonerslijst.filter(resident => {
    const matchesSearch = 
      resident.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.badge.toString().includes(searchTerm) ||
      resident.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.ovNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || resident.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort residents by badge number
  const sortedResidents = filteredResidents.sort((a, b) => a.badge - b.badge);

  const handlePrint = () => {
    window.print();
  };

  const handleResidentClick = (resident: any) => {
    setSelectedResident(resident);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResident(null);
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
              <h2 className="text-lg text-gray-700 dark:text-gray-300 mt-2">Administratieve Documenten - Bewonersoverzicht</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="bg-blue-200 dark:bg-blue-600 px-3 py-2 text-center font-semibold text-black dark:text-white rounded">
                  <FileText className="inline-block w-4 h-4 mr-2" />
                  Bewonersoverzicht
                </div>
                <div className="text-center text-gray-900 dark:text-gray-100">
                  <span className="text-sm">Totaal Bewoners: {sortedResidents.length}</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Klik op een bewoner om documenten te bekijken</p>
                </div>
                <div className="text-right">
                  <button 
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 ml-auto"
                  >
                    <Printer className="w-4 h-4" />
                    Overzicht Afdrukken
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
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
                  <option value="Inactief">Inactief</option>
                </select>
              </div>
            </div>
          </div>

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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            resident.status === 'Actief' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {resident.status}
                          </span>
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
            Totaal Bewoners: {sortedResidents.length} | Gegenereerd: {new Date().toLocaleDateString('nl-BE')}
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