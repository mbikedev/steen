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
            transform: scale(0.85);
            transform-origin: top left;
            width: 117.65%;
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
            <h1 className="text-2xl font-bold text-foreground font-title">OOC STEENOKKERZEEL</h1>
          </div>
          
          <div className="bg-card shadow-sm rounded-lg p-4 mb-6 border border-border">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="bg-yellow-200 px-3 py-2 text-center font-semibold text-black">
                Bewonerslijst
              </div>
              <div className="text-center text-foreground">
                {formatDate(new Date())}
              </div>
              <div className="text-right">
                <div className="text-foreground">Aantal: <span className="font-bold">{bewonerslijst.length}</span> jongeren</div>
                <div className="text-sm text-muted-foreground">Gemiddeld verblijf</div>
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
                  placeholder="Zoek op naam, badge, nationaliteit..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground"
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
              className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground"
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

        {/* Table */}
        <div className="bg-card shadow-sm rounded-lg overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-teal-700 text-white">
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
              <tbody className="bg-card divide-y divide-border">
                {filteredResidents.map((resident, index) => (
                  <tr key={resident.id} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted'} hover:bg-accent transition-colors`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                      {resident.badge}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.firstName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.room}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.nationality}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.ovNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.registerNumber}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs text-foreground" style={{minWidth: '90px'}}>
                      <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{formatDate(resident.dateOfBirth)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.age}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.gender === 'M' ? 'Mannelijk' : 'Vrouwelijk'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.referencePerson}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs text-foreground" style={{minWidth: '90px'}}>
                      <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{formatDate(resident.dateIn)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {resident.daysOfStay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
        <div style={{ backgroundColor: '#FFFF99', padding: '2px 4px', border: '1px solid black', fontWeight: 'bold' }}>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid black' }}>
        <thead>
          <tr style={{ backgroundColor: '#99CCFF', fontWeight: 'bold' }}>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '35px', fontSize: '8px' }}>Badge</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '70px', fontSize: '8px' }}>Achternaam</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '70px', fontSize: '8px' }}>Voornaam</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '25px', fontSize: '8px' }}>Kamer</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '55px', fontSize: '8px' }}>Nationaliteit</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '60px', fontSize: '8px' }}>OV Nr</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '70px', fontSize: '8px' }}>Nat Nr</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '55px', fontSize: '8px' }}>Geb.datum</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '25px', fontSize: '8px' }}>Leeftijd</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '25px', fontSize: '8px' }}>Geslacht</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'left', width: '70px', fontSize: '8px' }}>Ref.persoon</th>
            <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '55px', fontSize: '8px' }}>Aankomst</th>
            <th style={{ border: '1px solid black', borderRight: '2px solid black !important', padding: '2px', textAlign: 'center', width: '35px', fontSize: '8px' }}>Dagen</th>
          </tr>
        </thead>
        <tbody>
          {filteredResidents.map((resident, index) => (
            <tr key={resident.id}>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>{resident.badge}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.lastName, 10)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.firstName, 10)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>{resident.room}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.nationality, 8)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.ovNumber, 9)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.registerNumber, 11)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {formatDate(resident.dateOfBirth)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>{resident.age}</td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>
                {resident.gender === 'M' ? 'M' : 'V'}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {truncateText(resident.referencePerson, 10)}
              </td>
              <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {formatDate(resident.dateIn)}
              </td>
              <td style={{ border: '1px solid black', borderRight: '2px solid black !important', padding: '1px', textAlign: 'center' }}>{resident.daysOfStay}</td>
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