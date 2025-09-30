'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, User, FileText, Search, Download, Upload, Plus, Edit, Save, X, Trash2, Clipboard, UserPlus, ArrowLeft, Home, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';
import {
  fetchYouthOverviewData,
  updateYouthOverviewField,
  upsertYouthOverviewRecord,
  syncFromResidentsTable,
  YouthOverviewData
} from '../../../lib/supabase/youth-overview-api';
import type { Database } from '../../../lib/supabase/database.types';

type YouthOverviewRow = Database['public']['Tables']['youth_overview']['Row'];

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
  const [databaseData, setDatabaseData] = useState<YouthOverviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Load data from database on mount
  useEffect(() => {
    setIsClient(true);
    loadDataFromDatabase();
  }, []);

  // Load data from database
  const loadDataFromDatabase = async () => {
    setIsLoading(true);
    try {
      // First sync from residents table to ensure we have the latest data
      await syncFromResidentsTable();

      // Then fetch all youth overview data
      const data = await fetchYouthOverviewData();
      setDatabaseData(data);

      // Initialize cell changes from database data
      const changes: {[key: string]: any} = {};
      data.forEach(record => {
        Object.keys(record).forEach(key => {
          if (record[key as keyof YouthOverviewRow] !== null && record[key as keyof YouthOverviewRow] !== '') {
            const mappedKey = mapDatabaseKeyToUI(key);
            if (mappedKey) {
              changes[`${record.badge}-${mappedKey}`] = record[key as keyof YouthOverviewRow];
            }
          }
        });
      });
      setCellChanges(changes);
    } catch (error) {
      console.error('Error loading data from database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Map database column names to UI column names
  const mapDatabaseKeyToUI = (dbKey: string): string | null => {
    const mapping: {[key: string]: string} = {
      'naam': 'naam',
      'voornaam': 'voornaam',
      'geboortedatum': 'geboortedatum',
      'leeftijd': 'leeftijd',
      'todos': 'todos',
      'aandachtspunten': 'aandachtspunten',
      'datum_in': 'datumIn',
      'intake': 'intake',
      'referent': 'referent',
      'gb': 'gb',
      'nb': 'nb',
      'back_up': 'backUp',
      'hr': 'hr',
      'procedure': 'procedure',
      'voogd': 'voogd',
      'advocaat': 'advocaat',
      'twijfel': 'twijfel',
      'uitnodiging': 'uitnodiging',
      'test': 'test',
      'resultaat': 'resultaat',
      'opvolging_door': 'opvolgingDoor',
      'betekening': 'betekening',
      'wijziging_match_it': 'wijzigingMatchIt',
      'scan_dv': 'scanDv',
      'versie': 'versie',
      'voorlopige_versie_klaar': 'voorlopigeVersieKlaar',
      'voorlopige_versie_verzonden': 'voorlopigeVersieVerzonden',
      'definitieve_versie': 'definitieveVersie',
      'procedureles': 'procedureles',
      'og': 'og',
      'mdo': 'mdo',
      'mdo2': 'mdo2',
      'bxl_uitstap': 'bxlUitstap',
      'context': 'context',
      'opbouw_context': 'opbouwContext',
      'specificaties': 'specificaties',
      'stavaza': 'stavaza',
      'autonomie': 'autonomie',
      'context2': 'context2',
      'medisch': 'medisch',
      'pleegzorg': 'pleegzorg',
      'aanmelding_nodig': 'aanmeldingNodig',
      'vist_adoc': 'vistAdoc',
      'datum_transfer': 'datumTransfer',
      'transferdossier_verzonden': 'transferdossierVerzonden',
      'out_status': 'out',
      'tab_location': 'tabLocation'
    };
    return mapping[dbKey] || null;
  };

  // Map UI column names to database column names
  const mapUIKeyToDatabase = (uiKey: string): string | null => {
    const mapping: {[key: string]: string} = {
      'naam': 'naam',
      'voornaam': 'voornaam',
      'geboortedatum': 'geboortedatum',
      'leeftijd': 'leeftijd',
      'todos': 'todos',
      'aandachtspunten': 'aandachtspunten',
      'datumIn': 'datum_in',
      'intake': 'intake',
      'referent': 'referent',
      'gb': 'gb',
      'nb': 'nb',
      'backUp': 'back_up',
      'hr': 'hr',
      'procedure': 'procedure',
      'voogd': 'voogd',
      'advocaat': 'advocaat',
      'twijfel': 'twijfel',
      'uitnodiging': 'uitnodiging',
      'test': 'test',
      'resultaat': 'resultaat',
      'opvolgingDoor': 'opvolging_door',
      'betekening': 'betekening',
      'wijzigingMatchIt': 'wijziging_match_it',
      'scanDv': 'scan_dv',
      'versie': 'versie',
      'voorlopigeVersieKlaar': 'voorlopige_versie_klaar',
      'voorlopigeVersieVerzonden': 'voorlopige_versie_verzonden',
      'definitieveVersie': 'definitieve_versie',
      'procedureles': 'procedureles',
      'og': 'og',
      'mdo': 'mdo',
      'mdo2': 'mdo2',
      'bxlUitstap': 'bxl_uitstap',
      'context': 'context',
      'opbouwContext': 'opbouw_context',
      'specificaties': 'specificaties',
      'stavaza': 'stavaza',
      'autonomie': 'autonomie',
      'context2': 'context2',
      'medisch': 'medisch',
      'pleegzorg': 'pleegzorg',
      'aanmeldingNodig': 'aanmelding_nodig',
      'vistAdoc': 'vist_adoc',
      'datumTransfer': 'datum_transfer',
      'transferdossierVerzonden': 'transferdossier_verzonden',
      'out': 'out_status',
      'tabLocation': 'tab_location'
    };
    return mapping[uiKey] || null;
  };

  // Save cell changes to database
  const saveToDatabase = async (badge: string, field: string, value: any) => {
    const dbField = mapUIKeyToDatabase(field);
    if (!dbField) {
      console.error('Unknown field:', field);
      return;
    }

    setIsSaving(true);
    try {
      // Check if record exists in database
      const existingRecord = databaseData.find(r => r.badge === badge);

      if (!existingRecord) {
        // Create new record with all current data for this badge
        const newRecord: YouthOverviewData = {
          badge,
          [dbField]: value,
          tab_location: activeTab
        };

        // Add all other fields from cellChanges for this badge
        Object.keys(cellChanges).forEach(key => {
          if (key.startsWith(`${badge}-`)) {
            const fieldName = key.replace(`${badge}-`, '');
            const dbFieldName = mapUIKeyToDatabase(fieldName);
            if (dbFieldName && dbFieldName !== dbField) {
              newRecord[dbFieldName as keyof YouthOverviewData] = cellChanges[key];
            }
          }
        });

        await upsertYouthOverviewRecord(newRecord);
      } else {
        // Update existing record
        await updateYouthOverviewField(badge, dbField as keyof YouthOverviewData, value);
      }

      // Reload data to ensure consistency
      await loadDataFromDatabase();
    } catch (error) {
      console.error('Error saving to database:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleSaveCell = async () => {
    if (editingCell) {
      const key = `${editingCell.badge}-${editingCell.col}`;
      setCellChanges(prev => ({
        ...prev,
        [key]: editValue
      }));

      // Save to database
      await saveToDatabase(editingCell.badge, editingCell.col, editValue);

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
    <div className="min-h-screen bg-background">
      <div className="h-screen flex flex-col bg-background">
        {/* Header with Return Button */}
        <div className="flex-shrink-0 bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Return to Dashboard button */}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-foreground to-foreground hover:from-foreground/90 hover:to-foreground/90 text-background rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Terug naar Dashboard"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              {hasAgeDoubtJa && (
                <button
                  onClick={handleEscapeToNormalView}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded-lg transition-colors text-foreground"
                  title="Terug naar volledig overzicht (ESC)"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">ESC - Volledig Overzicht</span>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground font-title">
                  {hasAgeDoubtJa ? 'LEEFTIJDSTWIJFEL MODUS' : 'OVERZICHT JONGEREN'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasAgeDoubtJa 
                    ? 'Focus op leeftijdsverificatie - alleen relevante kolommen zichtbaar' 
                    : 'Beheer en volg alle jongeren in het systeem'
                  }
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {isSaving && (
                <span className="text-primary font-medium mr-4">
                  Opslaan...
                </span>
              )}
              {hasAgeDoubtJa
                ? 'Klik ESC om terug te gaan naar volledig overzicht'
                : 'Data wordt automatisch opgeslagen'
              }
            </div>
          </div>
        </div>

        {/* Age Doubt Resident Display */}
        {hasAgeDoubtJa && (
          <div className="bg-destructive/10 border-2 border-destructive px-6 py-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded font-bold text-sm">
                  LEEFTIJDSTWIJFEL
                </div>
                <div className="flex flex-wrap gap-4">
                  {currentData.filter((record) => {
                    const cellKey = `${record.badge}-twijfel`;
                    const savedValue = cellChanges[cellKey];
                    const twijfelValue = savedValue !== undefined ? savedValue : record.twijfel;
                    return twijfelValue === 'Ja';
                  }).map(resident => (
                    <div key={resident.badge} className="bg-card px-4 py-2 rounded-lg border-2 border-destructive">
                      <span className="font-bold text-2xl text-destructive">
                        {resident.voornaam} {resident.naam}
                      </span>
                      <span className="ml-3 text-xl font-semibold text-muted-foreground">
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
        <div className="flex-shrink-0 bg-muted border-b border-border px-6 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('IN')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeTab === 'IN'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-accent'
                }`}
              >
                IN ({inDataCount})
              </button>
              <button
                onClick={() => setActiveTab('OUT')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeTab === 'OUT'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-accent'
                }`}
              >
                OUT ({outDataCount})
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Zoek op badge, naam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring dark:text-gray-100"
                />
              </div>
              
              {/* Scroll Control Buttons */}
              <div className="flex items-center gap-1 bg-card rounded-lg p-1 shadow-md border border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 px-2 font-medium">Scroll:</span>
                
                {/* Horizontal arrows */}
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollTable('left')}
                    className="p-2 bg-gradient-to-r from-foreground to-foreground hover:from-foreground/90 hover:to-foreground/90 text-background rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Links"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollTable('right')}
                    className="p-2 bg-gradient-to-r from-foreground to-foreground hover:from-foreground/90 hover:to-foreground/90 text-background rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Rechts"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-gray-300 mx-1" />
                
                {/* Vertical arrows */}
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollTable('up')}
                    className="p-2 bg-gradient-to-r from-foreground to-foreground hover:from-foreground/90 hover:to-foreground/90 text-background rounded-lg transition-all duration-200 hover:shadow-md"
                    title="Scroll Omhoog"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollTable('down')}
                    className="p-2 bg-gradient-to-r from-foreground to-foreground hover:from-foreground/90 hover:to-foreground/90 text-background rounded-lg transition-all duration-200 hover:shadow-md"
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
            <table className="min-w-full border-collapse border border-border dark:border-gray-600">
              <thead className="sticky top-0 bg-card z-10">
                {/* First header row - Group headers */}
                <tr className="bg-accent">
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={8}>Bewoners</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={6}>Aankomst</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={4}>Aanvullen op MATCH-IT: OK?</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={8}>Leeftijdstwijfel</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={4}>IBP</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={4}>Gesprekken</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={4}>Permissies (Aanvullen bijzondere profielen)</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={5}>Transferaanvraag</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={2}>IJH</th>
                  <th className="border border-border px-2 py-1 text-xs font-bold bg-foreground text-background text-center" colSpan={3}>Out</th>
                </tr>
                
                {/* Second header row - Column headers */}
                <tr className="bg-foreground text-background">
                  <th className="border border-border px-2 py-2 text-center text-xs font-medium text-background w-12">
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
                      className="rounded border-border text-foreground focus:ring-ring"
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
                            ? 'bg-foreground border-border text-background'
                            : isMatchITColumn
                            ? 'bg-foreground border-border text-background'
                            : isLeeftijdstwijfelColumn
                            ? 'bg-foreground border-border text-background'
                            : isIBPColumn 
                            ? 'bg-foreground border-border text-background'
                            : isGesprekkenColumn
                            ? 'bg-foreground border-border text-background'
                            : isPermissiesColumn
                            ? 'bg-foreground border-border text-background'
                            : isTransferColumn
                            ? 'bg-foreground border-border text-background'
                            : isIJHColumn
                            ? 'bg-foreground border-border text-background'
                            : isOutColumn
                            ? 'bg-foreground border-border text-background'
                            : 'border-border text-background'
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
                          ? 'bg-accent hover:bg-accent/80'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <td className="border border-border px-2 py-1 text-center">
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
                          className="rounded border-border text-foreground focus:ring-ring"
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
                            className="border border-border px-2 py-1 text-sm text-foreground"
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
                                      // Save to database
                                      saveToDatabase(editingCell.badge, editingCell.col, newValue);
                                    }
                                    
                                    // Close editing immediately
                                    setEditingCell(null);
                                    setEditValue('');
                                  }}
                                  className="rounded border-border text-foreground focus:ring-ring"
                                  autoFocus
                                />
                                <span className="text-sm">Verzonden</span>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-destructive hover:text-destructive/80"
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
                                  className="w-full px-1 py-0.5 border border-foreground rounded text-sm bg-background text-foreground"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-foreground hover:text-foreground/80"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-destructive hover:text-destructive/80"
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

                                      // Save to database
                                      saveToDatabase(editingCell.badge, editingCell.col, newValue);

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
                                  className="w-full px-1 py-0.5 border border-foreground rounded text-sm bg-background text-foreground"
                                  autoFocus
                                >
                                  <option value="">-</option>
                                  <option value="Meerderjarig">Meerderjarig</option>
                                  <option value="Minderjarig">Minderjarig</option>
                                </select>
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-foreground hover:text-foreground/80"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-destructive hover:text-destructive/80"
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
                                  className="w-full px-1 py-0.5 border border-foreground rounded text-sm bg-background text-foreground"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-foreground hover:text-foreground/80"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-destructive hover:text-destructive/80"
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

                                      // Save to database
                                      saveToDatabase(editingCell.badge, editingCell.col, newValue);

                                      // Re-enable Age Doubt Mode if Twijfel is set to "Ja"
                                      if (editingCell.col === 'twijfel' && newValue === 'Ja') {
                                        setAgeDoubtModeDisabled(false);
                                      }
                                    }
                                    
                                    // Close editing immediately
                                    setEditingCell(null);
                                    setEditValue('');
                                  }}
                                  className="w-full px-1 py-0.5 border border-foreground rounded text-sm bg-background text-foreground"
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
                                  className="p-0.5 text-foreground hover:text-foreground/80"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-destructive hover:text-destructive/80"
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
                                  className="w-full px-1 py-0.5 border border-foreground rounded text-sm bg-background text-foreground"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-0.5 text-foreground hover:text-foreground/80"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-0.5 text-destructive hover:text-destructive/80"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="cursor-pointer hover:bg-accent p-1 rounded">
                                {col.key === 'uitnodiging' ? (
                                  // Uitnodiging: Show checkbox status
                                  value === 'true' || value === true ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      ✓ Verzonden
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Klik om te selecteren</span>
                                  )
                                ) : col.key === 'test' ? (
                                  // Test: Show formatted date
                                  value ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      📅 {value}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Klik voor datum</span>
                                  )
                                ) : col.key === 'resultaat' ? (
                                  // Resultaat: Show age result
                                  value === 'Meerderjarig' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      👤 Meerderjarig
                                    </span>
                                  ) : value === 'Minderjarig' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      👶 Minderjarig
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Klik om te bepalen</span>
                                  )
                                ) : col.key === 'opvolgingDoor' ? (
                                  // Opvolging door: Show educator name
                                  value ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      👨‍🏫 {value}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Klik om opvoeder toe te wijzen</span>
                                  )
                                ) : col.key === 'twijfel' ? (
                                  value === 'Ja' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                      ⚠ Ja
                                    </span>
                                  ) : value === 'Nee' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      ✓ Nee
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Klik om te kiezen</span>
                                  )
                                ) : col.key === 'hr' || col.key === 'procedure' || col.key === 'voogd' || col.key === 'advocaat' ? (
                                  value === 'OK' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                      ✓ OK
                                    </span>
                                  ) : value === 'GEEN VOOGD' || value === 'GEEN ADVOCAAT' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                      ✗ {value}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">Klik om OK te zetten</span>
                                  )
                                ) : col.key === 'datumIn' ? (
                                  // Datum In: Display with no-wrap styling and formatted date
                                  <span style={{display: 'inline-block', whiteSpace: 'nowrap', fontSize: '0.75rem'}}>
                                    {value ? formatDate(value) : '-'}
                                  </span>
                                ) : (
                                  value || <span className="text-muted-foreground">-</span>
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
                    <td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                      {isLoading ?
                        'Laden...' :
                        (isClient ?
                          (activeTab === 'OUT' ? 'Geen uitgaande bewoners' : 'Geen data gevonden') :
                          'Laden...'
                        )
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