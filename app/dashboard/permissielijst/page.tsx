'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, User, FileText, Search, Download, Upload, Plus, Edit, Save, X, Trash2, Clipboard, UserPlus, ArrowLeft, Home, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';

interface YouthRecord {
  id: number;
  badge: string;
  naam: string;
  voornaam: string;
  geboortedatum: string;
  leeftijd: string;
  todos: string;
  aandachtspunten: string;
  datumIn: string;
  intake: string;
  referent: string;
  gb: string;
  nb: string;
  backUp: string;
  hr: string;
  procedure: string;
  voogd: string;
  advocaat: string;
  twijfel: string;
  uitnodiging: string;
  test: string;
  resultaat: string;
  opvolgingDoor: string;
  betekening: string;
  wijzigingMatchIt: string;
  scanDv: string;
  versie: string;
  voorlopigeVersieKlaar: string;
  voorlopigeVersieVerzonden: string;
  definitieveVersie: string;
  procedureles: string;
  og: string;
  mdo: string;
  mdo2: string;
  bxlUitstap: string;
  context: string;
  opbouwContext: string;
  specificaties: string;
  stavaza: string;
  autonomie: string;
  context2: string;
  medisch: string;
  pleegzorg: string;
  aanmeldingNodig: string;
  vistAdoc: string;
  datumTransfer: string;
  transferdossierVerzonden: string;
  out: string;
}

// OUT tab starts empty - residents are moved here when they leave
const staticOutData: YouthRecord[] = [];

// IN data comes purely from "../../../lib/DataContextDebug";
const staticInData: YouthRecord[] = [];

// Convert static data to YouthRecord format with IDs
const outData: YouthRecord[] = staticOutData.map(record => ({
  ...record,
  id: parseInt(record.badge) || Math.random() * 1000000
}));

const inData: YouthRecord[] = staticInData.map(record => ({
  ...record,
  id: parseInt(record.badge) || Math.random() * 1000000
}));

export default function PermissielijstPage() {
  const { dataMatchIt, setAgeVerificationStatus } = useData();
  const [activeTab, setActiveTab] = useState('IN');
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{badge: string, col: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isPasting, setIsPasting] = useState(false);
  const [lastPasteDebug, setLastPasteDebug] = useState<string | null>(null);
  const [ageDoubtModeDisabled, setAgeDoubtModeDisabled] = useState(true); // Start with Age Doubt Mode disabled (show normal view)
  const [cellChanges, setCellChanges] = useState<{[key: string]: any}>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    // Load saved cell changes from localStorage
    const savedChanges = localStorage.getItem('permissielijst-cell-changes');
    if (savedChanges) {
      try {
        setCellChanges(JSON.parse(savedChanges));
      } catch (error) {
        console.error('Failed to load saved cell changes:', error);
      }
    }
  }, []);

  // Save cell changes to localStorage whenever they change
  useEffect(() => {
    if (isClient && Object.keys(cellChanges).length > 0) {
      localStorage.setItem('permissielijst-cell-changes', JSON.stringify(cellChanges));
    }
  }, [cellChanges, isClient]);

  // Merge data-match-it data with static outData, using data-match-it as source of truth for basic info
  const mergeWithDataMatchIt = (staticData: YouthRecord[]): YouthRecord[] => {
    return staticData.map(record => {
      // Find matching record in data-match-it by badge
      const matchItRecord = dataMatchIt.find(dmRecord => dmRecord.badge.toString() === record.badge);
      
      if (matchItRecord) {
        // Use data-match-it as source of truth for these fields
        return {
          ...record,
          id: matchItRecord.id,
          badge: matchItRecord.badge.toString(),
          naam: matchItRecord.lastName,
          voornaam: matchItRecord.firstName,
          geboortedatum: matchItRecord.dateOfBirth || '',
          leeftijd: matchItRecord.age.toString(),
          referent: matchItRecord.referencePerson || '',
          datumIn: matchItRecord.dateIn || ''
        };
      }
      
      // If no match found, use the static data but ensure ID exists
      return {
        ...record,
        id: parseInt(record.badge) || Math.random() * 1000000
      };
    });
  };

  // Add any new records from data-match-it that don't exist in static data
  const getCompleteData = (staticData: YouthRecord[], isInTab: boolean = false): YouthRecord[] => {
    const mergedStaticData = mergeWithDataMatchIt(staticData);
    
    // For OUT tab, return only static data (which is empty)
    if (!isInTab) {
      return mergedStaticData;
    }
    
    const existingBadges = new Set(mergedStaticData.map(r => r.badge));
    
    // Add new records from data-match-it that aren't in static data (only for IN tab)
    const newRecordsFromDataMatchIt = dataMatchIt
      .filter(dmRecord => !existingBadges.has(dmRecord.badge.toString()))
      .map(dmRecord => ({
        id: dmRecord.id,
        badge: dmRecord.badge.toString(),
        naam: dmRecord.lastName,
        voornaam: dmRecord.firstName,
        geboortedatum: dmRecord.dateOfBirth || '',
        leeftijd: dmRecord.age.toString(),
        todos: '',
        aandachtspunten: '',
        datumIn: dmRecord.dateIn || '',
        intake: isInTab ? 'Te plannen' : '',
        referent: dmRecord.referencePerson || '',
        gb: '',
        nb: '',
        backUp: '',
        hr: '',
        procedure: '',
        voogd: '',
        advocaat: '',
        twijfel: '',
        uitnodiging: '',
        test: '',
        resultaat: '',
        opvolgingDoor: '',
        betekening: '',
        wijzigingMatchIt: '',
        scanDv: '',
        versie: '',
        voorlopigeVersieKlaar: '',
        voorlopigeVersieVerzonden: '',
        definitieveVersie: '',
        procedureles: '',
        og: '',
        mdo: '',
        mdo2: '',
        bxlUitstap: '',
        context: '',
        opbouwContext: '',
        specificaties: '',
        stavaza: '',
        autonomie: '',
        context2: '',
        medisch: isInTab ? 'Medische intake vereist' : '',
        pleegzorg: '',
        aanmeldingNodig: '',
        vistAdoc: '',
        datumTransfer: '',
        transferdossierVerzonden: '',
        out: ''
      }));
    
    return [...mergedStaticData, ...newRecordsFromDataMatchIt];
  };

  const currentData = activeTab === 'IN' 
    ? getCompleteData(inData, true) 
    : getCompleteData(outData, false);
  
  // Calculate correct counts for merged data
  const inDataCount = getCompleteData(inData, true).length;
  const outDataCount = getCompleteData(outData, false).length; // This will be 0

  // Check if any record has Twijfel = "Ja" and Age Doubt Mode is not disabled
  const hasAgeDoubtJa = useMemo(() => {
    if (ageDoubtModeDisabled) return false;
    return currentData.some((record) => {
      const cellKey = `${record.badge}-twijfel`; // Use badge as stable identifier
      const savedValue = cellChanges[cellKey];
      const twijfelValue = savedValue !== undefined ? savedValue : record.twijfel;
      return twijfelValue === 'Ja';
    });
  }, [currentData, cellChanges, ageDoubtModeDisabled]);

  // Age verification columns to show when Twijfel = "Ja"
  const ageVerificationColumns = ['twijfel', 'uitnodiging', 'test', 'resultaat', 'opvolgingDoor'];

  // Filter columns based on Twijfel status
  const visibleColumns = useMemo(() => {
    const allColumns = [
      { key: 'badge', label: 'Badge', width: '80px' },
      { key: 'naam', label: 'Naam', width: '120px' },
      { key: 'voornaam', label: 'Voornaam', width: '120px' },
      { key: 'geboortedatum', label: 'Geboortedatum', width: '120px' },
      { key: 'leeftijd', label: 'Leeftijd', width: '80px' },
      { key: 'todos', label: "TO DO's", width: '150px' },
      { key: 'aandachtspunten', label: 'Aandachtspunten', width: '150px' },
      { key: 'datumIn', label: 'Datum in', width: '110px' },
      { key: 'intake', label: 'Intake', width: '100px' },
      { key: 'referent', label: 'Referent', width: '150px' },
      { key: 'gb', label: 'GB', width: '150px' },
      { key: 'nb', label: 'NB', width: '150px' },
      { key: 'backUp', label: 'Back up', width: '150px' },
      { key: 'hr', label: 'HR', width: '80px' },
      { key: 'procedure', label: 'Procedure', width: '100px' },
      { key: 'voogd', label: 'Voogd', width: '100px' },
      { key: 'advocaat', label: 'Advocaat', width: '100px' },
      { key: 'twijfel', label: 'Twijfel?', width: '80px' },
      { key: 'uitnodiging', label: 'Uitnodiging', width: '100px' },
      { key: 'test', label: 'Test', width: '100px' },
      { key: 'resultaat', label: 'Resultaat', width: '150px' },
      { key: 'opvolgingDoor', label: 'Opvolging door', width: '150px' },
      { key: 'betekening', label: 'Betekening', width: '100px' },
      { key: 'wijzigingMatchIt', label: 'Wijziging match it', width: '120px' },
      { key: 'scanDv', label: 'Scan DV', width: '100px' },
      { key: 'versie', label: 'Versie (Light/RTPL/Volledig)', width: '150px' },
      { key: 'voorlopigeVersieKlaar', label: 'Voorlopige versie klaar', width: '150px' },
      { key: 'voorlopigeVersieVerzonden', label: 'Voorlopige versie verzonden', width: '150px' },
      { key: 'definitieveVersie', label: 'Definitieve versie', width: '150px' },
      { key: 'procedureles', label: 'Procedureles', width: '120px' },
      { key: 'og', label: 'OG', width: '100px' },
      { key: 'mdo', label: 'MDO', width: '100px' },
      { key: 'mdo2', label: 'MDO 2', width: '100px' },
      { key: 'bxlUitstap', label: 'BXL uitstap', width: '120px' },
      { key: 'context', label: 'Context', width: '150px' },
      { key: 'opbouwContext', label: 'Opbouw context', width: '150px' },
      { key: 'specificaties', label: 'Specificaties', width: '150px' },
      { key: 'stavaza', label: 'STAVAZA', width: '200px' },
      { key: 'autonomie', label: 'Autonomie', width: '150px' },
      { key: 'context2', label: 'Context2', width: '150px' },
      { key: 'medisch', label: 'Medisch', width: '150px' },
      { key: 'pleegzorg', label: 'Pleegzorg', width: '150px' },
      { key: 'aanmeldingNodig', label: 'Aanmelding nodig?', width: '150px' },
      { key: 'vistAdoc', label: 'Vist? ADOC?', width: '120px' },
      { key: 'datumTransfer', label: 'Datum transfer', width: '120px' },
      { key: 'transferdossierVerzonden', label: 'Transferdossier verzonden', width: '180px' },
      { key: 'out', label: 'OUT?', width: '80px' },
    ];

    // If in Age Doubt Mode, show only age verification columns
    if (hasAgeDoubtJa) {
      return allColumns.filter(col => ageVerificationColumns.includes(col.key));
    }

    // In normal view, always show all columns including age verification columns
    // so users can see saved age doubt data
    return allColumns;
  }, [hasAgeDoubtJa]);

  const columns = visibleColumns;

  // Filter data based on search and age doubt mode
  const filteredData = useMemo(() => {
    let data = currentData;
    
    // In age doubt mode, show only residents with Twijfel = "Ja"
    if (hasAgeDoubtJa) {
      data = data.filter((record) => {
        const cellKey = `${record.badge}-twijfel`; // Use badge as stable identifier
        const savedValue = cellChanges[cellKey];
        const twijfelValue = savedValue !== undefined ? savedValue : record.twijfel;
        return twijfelValue === 'Ja';
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter(record => (
        record.badge.toLowerCase().includes(searchLower) ||
        record.naam.toLowerCase().includes(searchLower) ||
        record.voornaam.toLowerCase().includes(searchLower)
      ));
    }
    
    return data;
  }, [currentData, hasAgeDoubtJa, cellChanges, searchTerm]);

  // Handle cell editing
  const handleCellClick = (badge: string, col: string, value: any) => {
    setEditingCell({ badge, col });
    // Special handling for checkbox columns
    if (col === 'uitnodiging') {
      setEditValue(value === 'true' || value === true ? 'true' : 'false');
    } else {
      setEditValue(value || '');
    }
  };

  const handleSaveCell = () => {
    if (editingCell) {
      const key = `${editingCell.badge}-${editingCell.col}`;
      setCellChanges(prev => ({
        ...prev,
        [key]: editValue
      }));
      
      // If the Resultaat column is updated, save to DataContext
      if (editingCell.col === 'resultaat') {
        if (editValue === 'Meerderjarig' || editValue === 'Minderjarig') {
          setAgeVerificationStatus(editingCell.badge, editValue as 'Meerderjarig' | 'Minderjarig');
        } else {
          setAgeVerificationStatus(editingCell.badge, null);
        }
      }
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle ESC - exit Age Doubt Mode without clearing confirmed "Ja" values
  const handleEscapeToNormalView = useCallback(() => {
    // Exit Age Doubt Mode by disabling it - don't clear any saved Twijfel values
    // The confirmed "Ja" values should remain visible in normal view
    setAgeDoubtModeDisabled(true);
  }, []);

  // Add keyboard listener for ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && hasAgeDoubtJa && !editingCell) {
        event.preventDefault();
        handleEscapeToNormalView();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasAgeDoubtJa, editingCell, handleEscapeToNormalView]);

  const router = useRouter();

  // Scroll functions
  const scrollTable = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!tableContainerRef.current) return;
    
    const scrollAmount = 200; // pixels to scroll
    const container = tableContainerRef.current;
    
    switch (direction) {
      case 'left':
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        break;
      case 'right':
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        break;
      case 'up':
        container.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        break;
      case 'down':
        container.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Header with Return Button */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Return to Dashboard button */}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Terug naar Dashboard"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              {hasAgeDoubtJa && (
                <button
                  onClick={handleEscapeToNormalView}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  title="Terug naar volledig overzicht (ESC)"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">ESC - Volledig Overzicht</span>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">
                  {hasAgeDoubtJa ? 'LEEFTIJDSTWIJFEL MODUS' : 'OVERZICHT JONGEREN'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {hasAgeDoubtJa 
                    ? 'Focus op leeftijdsverificatie - alleen relevante kolommen zichtbaar' 
                    : 'Beheer en volg alle jongeren in het systeem'
                  }
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasAgeDoubtJa 
                ? 'Klik ESC om terug te gaan naar volledig overzicht' 
                : 'Gebruik Ctrl+V om data vanuit Excel te plakken'
              }
            </div>
          </div>
        </div>

        {/* Age Doubt Resident Display */}
        {hasAgeDoubtJa && (
          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-400 px-6 py-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
                  LEEFTIJDSTWIJFEL
                </div>
                <div className="flex flex-wrap gap-4">
                  {currentData.filter((record) => {
                    const cellKey = `${record.badge}-twijfel`;
                    const savedValue = cellChanges[cellKey];
                    const twijfelValue = savedValue !== undefined ? savedValue : record.twijfel;
                    return twijfelValue === 'Ja';
                  }).map(resident => (
                    <div key={resident.badge} className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border-2 border-red-400 dark:border-red-500">
                      <span className="font-bold text-2xl text-red-700 dark:text-red-300">
                        {resident.voornaam} {resident.naam}
                      </span>
                      <span className="ml-3 text-xl font-semibold text-gray-700 dark:text-gray-300">
                        Badge: {resident.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Search */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('IN')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeTab === 'IN'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                IN ({inDataCount})
              </button>
              <button
                onClick={() => setActiveTab('OUT')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeTab === 'OUT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                OUT ({outDataCount})
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Zoek op badge, naam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              
              {/* Scroll Control Buttons */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md border border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 font-medium">Scroll:</span>
                
                {/* Horizontal arrows */}
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollTable('left')}
                    className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Links"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollTable('right')}
                    className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Rechts"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                
                {/* Vertical arrows */}
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollTable('up')}
                    className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Omhoog"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollTable('down')}
                    className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Omlaag"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table with Scroll Arrows */}
        <div className="flex-1 overflow-hidden relative">
          <div ref={tableContainerRef} className="h-full overflow-auto">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                {/* First header row - Group headers */}
                <tr className="bg-blue-50 dark:bg-blue-900">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-bold bg-gray-700 dark:bg-gray-600 text-white text-center" colSpan={8}>Bewoners</th>
                  <th className="border border-amber-400 dark:border-amber-500 px-2 py-1 text-xs font-bold bg-amber-600 dark:bg-amber-700 text-white text-center" colSpan={6}>Aankomst</th>
                  <th className="border border-indigo-400 dark:border-indigo-500 px-2 py-1 text-xs font-bold bg-indigo-900 dark:bg-indigo-700 text-white text-center" colSpan={4}>Aanvullen op MATCH-IT: OK?</th>
                  <th className="border border-purple-400 dark:border-purple-500 px-2 py-1 text-xs font-bold bg-purple-600 dark:bg-purple-700 text-white text-center" colSpan={8}>Leeftijdstwijfel</th>
                  <th className="border border-blue-400 dark:border-blue-500 px-2 py-1 text-xs font-bold bg-blue-600 dark:bg-blue-700 text-white text-center" colSpan={4}>IBP</th>
                  <th className="border border-green-400 dark:border-green-500 px-2 py-1 text-xs font-bold bg-green-600 dark:bg-green-700 text-white text-center" colSpan={4}>Gesprekken</th>
                  <th className="border border-cyan-400 dark:border-cyan-500 px-2 py-1 text-xs font-bold bg-cyan-600 dark:bg-cyan-700 text-white text-center" colSpan={4}>Permissies (Aanvullen bijzondere profielen)</th>
                  <th className="border border-orange-400 dark:border-orange-500 px-2 py-1 text-xs font-bold bg-orange-600 dark:bg-orange-700 text-white text-center" colSpan={5}>Transferaanvraag</th>
                  <th className="border border-pink-400 dark:border-pink-500 px-2 py-1 text-xs font-bold bg-pink-600 dark:bg-pink-700 text-white text-center" colSpan={2}>IJH</th>
                  <th className="border border-red-400 dark:border-red-500 px-2 py-1 text-xs font-bold bg-red-600 dark:bg-red-700 text-white text-center" colSpan={3}>Out</th>
                </tr>
                
                {/* Second header row - Column headers */}
                <tr className="bg-teal-700 dark:bg-teal-800 text-white">
                  <th className="border border-teal-600 dark:border-teal-700 px-2 py-2 text-center text-xs font-medium text-white w-12">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every(record => selectedRecords.has(record.badge))}
                      onChange={() => {
                        const newSelected = new Set(selectedRecords);
                        if (filteredData.every(record => selectedRecords.has(record.badge))) {
                          // Deselect all filtered records
                          filteredData.forEach(record => newSelected.delete(record.badge));
                        } else {
                          // Select all filtered records
                          filteredData.forEach(record => newSelected.add(record.badge));
                        }
                        setSelectedRecords(newSelected);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {columns.map((col) => {
                    const isAankomstColumn = ['datumIn', 'intake', 'referent', 'gb', 'nb', 'backUp'].includes(col.key);
                    const isMatchITColumn = ['hr', 'procedure', 'voogd', 'advocaat'].includes(col.key);
                    const isIBPColumn = ['versie', 'voorlopigeVersieKlaar', 'voorlopigeVersieVerzonden', 'definitieveVersie'].includes(col.key);
                    const isGesprekkenColumn = ['procedureles', 'og', 'mdo', 'mdo2'].includes(col.key);
                    const isPermissiesColumn = ['bxlUitstap', 'context', 'opbouwContext', 'specificaties'].includes(col.key);
                    const isTransferColumn = ['stavaza', 'autonomie', 'context2', 'medisch', 'pleegzorg'].includes(col.key);
                    const isIJHColumn = ['aanmeldingNodig', 'vistAdoc'].includes(col.key);
                    const isOutColumn = ['datumTransfer', 'transferdossierVerzonden', 'out'].includes(col.key);
                    const isLeeftijdstwijfelColumn = ['twijfel', 'uitnodiging', 'test', 'resultaat', 'opvolgingDoor', 'betekening', 'wijzigingMatchIt', 'scanDv'].includes(col.key);
                    return (
                      <th
                        key={col.key}
                        className={`border px-2 py-2 text-left text-xs font-medium ${
                          isAankomstColumn
                            ? 'bg-amber-600 dark:bg-amber-700 border-amber-500 dark:border-amber-600 text-white'
                            : isMatchITColumn
                            ? 'bg-indigo-600 dark:bg-indigo-700 border-indigo-500 dark:border-indigo-600 text-white'
                            : isLeeftijdstwijfelColumn
                            ? 'bg-purple-600 dark:bg-purple-700 border-purple-500 dark:border-purple-600 text-white'
                            : isIBPColumn 
                            ? 'bg-blue-600 dark:bg-blue-700 border-blue-500 dark:border-blue-600 text-white'
                            : isGesprekkenColumn
                            ? 'bg-green-600 dark:bg-green-700 border-green-500 dark:border-green-600 text-white'
                            : isPermissiesColumn
                            ? 'bg-cyan-600 dark:bg-cyan-700 border-cyan-500 dark:border-cyan-600 text-white'
                            : isTransferColumn
                            ? 'bg-orange-600 dark:bg-orange-700 border-orange-500 dark:border-orange-600 text-white'
                            : isIJHColumn
                            ? 'bg-pink-600 dark:bg-pink-700 border-pink-500 dark:border-pink-600 text-white'
                            : isOutColumn
                            ? 'bg-red-600 dark:bg-red-700 border-red-500 dark:border-red-600 text-white'
                            : 'border-teal-600 dark:border-teal-700 text-white'
                        }`}
                        style={{ minWidth: col.width, width: col.width }}
                      >
                        {col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {isClient && filteredData.length > 0 ? (
                  filteredData.map((record, rowIndex) => {
                    const isSelected = selectedRecords.has(record.badge);
                    return (
                    <tr 
                      key={record.badge} 
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newSelected = new Set(selectedRecords);
                            if (isSelected) {
                              newSelected.delete(record.badge);
                            } else {
                              newSelected.add(record.badge);
                            }
                            setSelectedRecords(newSelected);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {columns.map((col) => {
                        const isEditing = editingCell?.badge === record.badge && editingCell?.col === col.key;
                        const cellKey = `${record.badge}-${col.key}`;
                        const savedValue = cellChanges[cellKey];
                        const value = savedValue !== undefined ? savedValue : record[col.key as keyof YouthRecord];
                        
                        return (
                          <td
                            key={col.key}
                            className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                            style={{ minWidth: col.width, width: col.width }}
                            onClick={() => !isEditing && handleCellClick(record.badge, col.key, value)}
                          >
                            {isEditing && col.key === 'uitnodiging' ? (
                              // Uitnodiging: Checkbox
                              <div className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={editValue === 'true'}
                                  onChange={(e) => {
                                    const newValue = e.target.checked ? 'true' : 'false';
                                    setEditValue(newValue);
                                    
                                    // Save immediately
                                    if (editingCell) {
                                      const key = `${editingCell.badge}-${editingCell.col}`;
                                      setCellChanges(prev => ({
                                        ...prev,
                                        [key]: newValue
                                      }));
                                    }
                                    
                                    // Close editing immediately
                                    setEditingCell(null);
                                    setEditValue('');
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  autoFocus
                                />
                                <span className="text-sm">Verzonden</span>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : isEditing && col.key === 'test' ? (
                              // Test: Date picker
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : isEditing && col.key === 'resultaat' ? (
                              // Resultaat: Meerderjarig/Minderjarig dropdown
                              <div className="flex items-center gap-1">
                                <select
                                  value={editValue}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setEditValue(newValue);
                                    
                                    // Save immediately
                                    if (editingCell) {
                                      const key = `${editingCell.badge}-${editingCell.col}`;
                                      setCellChanges(prev => ({
                                        ...prev,
                                        [key]: newValue
                                      }));
                                      
                                      // Update age verification status in DataContext
                                      if (newValue === 'Meerderjarig' || newValue === 'Minderjarig') {
                                        setAgeVerificationStatus(editingCell.badge, newValue as 'Meerderjarig' | 'Minderjarig');
                                      } else {
                                        setAgeVerificationStatus(editingCell.badge, null);
                                      }
                                    }
                                    
                                    // Close editing immediately
                                    setEditingCell(null);
                                    setEditValue('');
                                  }}
                                  className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                                  autoFocus
                                >
                                  <option value="">-</option>
                                  <option value="Meerderjarig">Meerderjarig</option>
                                  <option value="Minderjarig">Minderjarig</option>
                                </select>
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : isEditing && col.key === 'opvolgingDoor' ? (
                              // Opvolging door: Text input for educator name
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder="Naam opvoeder..."
                                  className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : isEditing && (col.key === 'hr' || col.key === 'procedure' || col.key === 'voogd' || col.key === 'advocaat' || col.key === 'twijfel') ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={editValue}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setEditValue(newValue);
                                    
                                    // Save immediately
                                    if (editingCell) {
                                      const key = `${editingCell.badge}-${editingCell.col}`;
                                      setCellChanges(prev => ({
                                        ...prev,
                                        [key]: newValue
                                      }));

                                      // Re-enable Age Doubt Mode if Twijfel is set to "Ja"
                                      if (editingCell.col === 'twijfel' && newValue === 'Ja') {
                                        setAgeDoubtModeDisabled(false);
                                      }
                                    }
                                    
                                    // Close editing immediately
                                    setEditingCell(null);
                                    setEditValue('');
                                  }}
                                  className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                                  autoFocus
                                >
                                  <option value="">-</option>
                                  {col.key === 'twijfel' ? (
                                    <>
                                      <option value="Ja">Ja</option>
                                      <option value="Nee">Nee</option>
                                    </>
                                  ) : col.key === 'voogd' ? (
                                    <>
                                      <option value="OK">OK</option>
                                      <option value="GEEN VOOGD">GEEN VOOGD</option>
                                    </>
                                  ) : col.key === 'advocaat' ? (
                                    <>
                                      <option value="OK">OK</option>
                                      <option value="GEEN ADVOCAAT">GEEN ADVOCAAT</option>
                                    </>
                                  ) : (
                                    <option value="OK">OK</option>
                                  )}
                                </select>
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm dark:bg-gray-700"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                {col.key === 'uitnodiging' ? (
                                  // Uitnodiging: Show checkbox status
                                  value === 'true' || value === true ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      ✓ Verzonden
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Klik om te selecteren</span>
                                  )
                                ) : col.key === 'test' ? (
                                  // Test: Show formatted date
                                  value ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      📅 {value}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Klik voor datum</span>
                                  )
                                ) : col.key === 'resultaat' ? (
                                  // Resultaat: Show age result
                                  value === 'Meerderjarig' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      👤 Meerderjarig
                                    </span>
                                  ) : value === 'Minderjarig' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                      👶 Minderjarig
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Klik om te bepalen</span>
                                  )
                                ) : col.key === 'opvolgingDoor' ? (
                                  // Opvolging door: Show educator name
                                  value ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      👨‍🏫 {value}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Klik om opvoeder toe te wijzen</span>
                                  )
                                ) : col.key === 'twijfel' ? (
                                  value === 'Ja' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      ⚠ Ja
                                    </span>
                                  ) : value === 'Nee' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      ✓ Nee
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Klik om te kiezen</span>
                                  )
                                ) : col.key === 'hr' || col.key === 'procedure' || col.key === 'voogd' || col.key === 'advocaat' ? (
                                  value === 'OK' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      ✓ OK
                                    </span>
                                  ) : value === 'GEEN VOOGD' || value === 'GEEN ADVOCAAT' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      ✗ {value}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Klik om OK te zetten</span>
                                  )
                                ) : col.key === 'datumIn' ? (
                                  // Datum In: Display with no-wrap styling and formatted date
                                  <span style={{display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.75rem'}}>
                                    {value ? formatDate(value) : '-'}
                                  </span>
                                ) : (
                                  value || <span className="text-gray-400">-</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                  })
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                      {isClient ? 
                        (activeTab === 'OUT' ? 'Geen uitgaande bewoners' : 'Geen data gevonden') :
                        'Laden...'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}