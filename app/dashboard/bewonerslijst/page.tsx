'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, Filter, Printer } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';

// Utility function to truncate text for print
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 1) + '…' : text;
};

function BewonerslijstPageContent() {
  const { bewonerslijst } = useData();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
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
            transform: scale(0.7);
            transform-origin: top left;
            width: 142.86%;
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">OOC STEENOKKERZEEL</h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="bg-yellow-200 dark:bg-yellow-600 px-3 py-2 text-center font-semibold text-black dark:text-white">
                Bewonerslijst
              </div>
              <div className="text-center text-gray-900 dark:text-gray-100">
                {formatDate(new Date())}
              </div>
              <div className="text-right">
                <div className="text-black dark:text-gray-100">Aantal: <span className="font-bold">{bewonerslijst.length}</span> jongeren</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gemiddeld verblijf</div>
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
                  placeholder="Zoek op naam, badge, nationaliteit..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-gray-100 bg-white dark:bg-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-gray-100"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Alle statussen</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
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
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Badge
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Achternaam
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Voornaam
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Wooneenheid
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Nationaliteit
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    OV Nummer
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Nationaal Nummer
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight whitespace-nowrap" style={{fontSize: '0.625rem', minWidth: '90px'}}>
                    Geboortedatum
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Leeftijd
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Geslacht
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Referentiepersoon
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight whitespace-nowrap" style={{fontSize: '0.625rem', minWidth: '90px'}}>
                    Datum In
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-tight" style={{fontSize: '0.625rem'}}>
                    Dagen verblijf
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredResidents.map((resident, index) => (
                  <tr key={resident.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {resident.badge}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.firstName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.room}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.nationality}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.ovNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.registerNumber}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100" style={{minWidth: '90px'}}>
                      <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{formatDate(resident.dateOfBirth)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.age}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.gender === 'M' ? 'Mannelijk' : 'Vrouwelijk'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.referencePerson}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100" style={{minWidth: '90px'}}>
                      <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{formatDate(resident.dateIn)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {resident.daysOfStay}
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
            Toont <span className="font-medium">{filteredResidents.length}</span> van{' '}
            <span className="font-medium">{bewonerslijst.length}</span> bewoners
          </div>
        </div>
      </div>
    </DashboardLayout>

    {/* Print-only layout - optimized for single page */}
    <div className="print-only">
      {/* Info bar matching PDF layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '10px' }}>
        <div style={{ backgroundColor: '#FFFF99', padding: '3px 6px', border: '1px solid black', fontWeight: 'bold' }}>
          Bewonerslijst
        </div>
        <div style={{ fontWeight: 'bold' }}>
          {formatDate(new Date())}
        </div>
        <div style={{ textAlign: 'right' }}>
          {bewonerslijst.length} jongeren
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid black' }}>
        <thead>
          <tr style={{ backgroundColor: '#99CCFF', fontWeight: 'bold' }}>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '40px' }}>Badge</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '80px' }}>Achternaam</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '80px' }}>Voornaam</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '30px' }}>Wooneenheid</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '60px' }}>Nationaliteit</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '70px' }}>OV Nummer</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '80px' }}>Nationaal Nummer</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '60px' }}>Geboortedatum</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '30px' }}>Leeftijd</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '30px' }}>Geslacht</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '80px' }}>Referentiepersoon</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '60px' }}>Aankomstdatum</th>
            <th style={{ border: '1px solid black', borderRight: '2px solid black !important', padding: '2px', textAlign: 'center', width: '40px' }}>Dagen verblijf</th>
          </tr>
        </thead>
        <tbody>
          {filteredResidents.map((resident, index) => (
            <tr key={resident.id}>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{resident.badge}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.lastName, 12)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.firstName, 12)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{resident.room}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.nationality, 10)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.ovNumber, 11)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.registerNumber, 13)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {formatDate(resident.dateOfBirth)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{resident.age}</td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>
                {resident.gender === 'M' ? 'M' : 'V'}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.referencePerson, 12)}
              </td>
              <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {formatDate(resident.dateIn)}
              </td>
              <td style={{ border: '1px solid black', borderRight: '2px solid black !important', padding: '2px', textAlign: 'center' }}>{resident.daysOfStay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

export default function BewonerslijstPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BewonerslijstPageContent />
    </Suspense>
  );
}