'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, Clock, Users, Edit3, Save, X, Check, FileText, Printer, Search } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';
import { weekendPermissionsApi } from '../../../lib/api-service';

// Permission types
type PermissionType = 'none' | 'daily';
type DayPermission = {
  type: PermissionType;
  departureTime?: string;
  returnTime?: string;
  overnight?: boolean;
};

type WeekendPermission = {
  residentId: number;
  badge: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  week: string; // ISO week format (YYYY-Www)
  friday: DayPermission;
  saturday: DayPermission;
  sunday: DayPermission;
  monday?: DayPermission; // Optional for holidays
  notes?: string;
  status: string; // Will contain "OK", "Xmn te laat", or "pending"
  actualArrivalTime?: string; // Format: HH:MM
  lastModified: string;
};

// Get current week in ISO format
const getCurrentWeek = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNumber = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

// Check if Monday is a holiday (enhanced with Belgian holidays)
const isMondayHoliday = (weekString: string): boolean => {
  try {
    const [year, week] = weekString.split('-W');
    const yearNum = parseInt(year);
    const weekNum = parseInt(week);
    
    // Calculate Monday of the given week
    const firstDayOfYear = new Date(yearNum, 0, 1);
    const daysToAdd = (weekNum - 1) * 7 + (1 - firstDayOfYear.getDay());
    const monday = new Date(yearNum, 0, 1 + daysToAdd);
    
    const month = monday.getMonth() + 1;
    const day = monday.getDate();
    
    // Belgian public holidays that could fall on a Monday
    const holidays = [
      { month: 1, day: 1 }, // New Year's Day
      { month: 5, day: 1 }, // Labor Day
      { month: 7, day: 21 }, // National Day
      { month: 8, day: 15 }, // Assumption of Mary
      { month: 11, day: 1 }, // All Saints' Day
      { month: 11, day: 11 }, // Armistice Day
      { month: 12, day: 25 }, // Christmas Day
    ];
    
    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  } catch (error) {
    console.warn('Error checking holiday status:', error);
    return false;
  }
};

export default function WeekendPermissiePage() {
  const router = useRouter();
  const { dataMatchIt, isLoading } = useData();
  
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [permissions, setPermissions] = useState<WeekendPermission[]>([]);
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isHolidayWeek, setIsHolidayWeek] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [highlightedResident, setHighlightedResident] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showOnlySearchResult, setShowOnlySearchResult] = useState(false);

  // Handle search functionality
  const handleSearch = (searchValue: string) => {
    if (!searchValue || searchValue.length < 2 || !dataMatchIt) {
      setSearchResult(null);
      setShowOnlySearchResult(false);
      return;
    }
    
    const searchLower = searchValue.toLowerCase().trim();
    
    // Search in residents
    const found = dataMatchIt.find(resident => {
      const fullName = `${resident.first_name} ${resident.last_name}`.toLowerCase();
      const reversedName = `${resident.last_name} ${resident.first_name}`.toLowerCase();
      const badge = resident.badge?.toString() || '';
      
      return fullName.includes(searchLower) || 
             reversedName.includes(searchLower) ||
             badge.includes(searchLower) ||
             (resident.nationality && resident.nationality.toLowerCase().includes(searchLower)) ||
             (resident.ov_number && resident.ov_number.toLowerCase().includes(searchLower));
    });
    
    if (found) {
      setSearchResult(found);
      setShowOnlySearchResult(true);
    } else {
      setSearchResult(null);
      setShowOnlySearchResult(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    setHighlightedResident(null);
    setShowOnlySearchResult(false);
  };

  // Load permissions from database
  const loadPermissionsFromDB = async (week: string) => {
    try {
      const result = await weekendPermissionsApi.getByWeek(week);
      if (result.success && result.data.length > 0) {
        // Convert database format to UI format
        const dbPermissions = result.data.map((dbPerm: any) => ({
          residentId: dbPerm.resident_id,
          badge: dbPerm.badge,
          firstName: dbPerm.first_name,
          lastName: dbPerm.last_name,
          dateOfBirth: dbPerm.date_of_birth,
          age: dbPerm.age,
          week: dbPerm.week,
          friday: { type: dbPerm.friday_type as PermissionType },
          saturday: { type: dbPerm.saturday_type as PermissionType },
          sunday: { type: dbPerm.sunday_type as PermissionType },
          monday: dbPerm.monday_type ? { type: dbPerm.monday_type as PermissionType } : undefined,
          notes: dbPerm.notes || '',
          status: dbPerm.status,
          actualArrivalTime: dbPerm.actual_arrival_time || '',
          lastModified: dbPerm.last_modified
        }));
        
        // Merge with current residents (in case new residents were added)
        const currentResidentIds = new Set(dataMatchIt.map(r => r.id));
        const validDbPermissions = dbPermissions.filter((p: any) => 
          currentResidentIds.has(p.residentId)
        );
        
        // Add any missing residents
        const existingResidentIds = new Set(validDbPermissions.map((p: any) => p.residentId));
        const missingResidents = dataMatchIt
          .filter(r => !existingResidentIds.has(r.id))
          .map(resident => ({
            residentId: resident.id,
            badge: String(resident.badge),
            firstName: resident.first_name || '',
            lastName: resident.last_name || '',
            dateOfBirth: resident.date_of_birth || '',
            age: resident.age || 0,
            week: week,
            friday: { type: 'none' as PermissionType },
            saturday: { type: 'none' as PermissionType },
            sunday: { type: 'none' as PermissionType },
            monday: isMondayHoliday(week) ? { type: 'none' as PermissionType } : undefined,
            notes: '',
            status: 'pending' as const,
            lastModified: new Date().toISOString()
          }));
        
        setPermissions([...validDbPermissions, ...missingResidents]);
        setSaveStatus('✅ Loaded from database');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading permissions from database:', error);
      setSaveStatus('❌ Failed to load from database');
      return false;
    }
  };

  // Save permissions to database
  const savePermissionsToDB = async (permissionsToSave: WeekendPermission[]) => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      setSaveStatus('💾 Saving...');
      
      const result = await weekendPermissionsApi.saveWeekPermissions(permissionsToSave);
      
      if (result.success && result.data) {
        const { saved, errors } = result.data;
        if (errors.length > 0) {
          setSaveStatus(`⚠️ Saved ${saved}, ${errors.length} errors`);
          console.warn('Save errors:', errors);
        } else {
          setSaveStatus(`✅ Saved ${saved} permissions`);
        }
        
        // Also save to localStorage as backup
        localStorage.setItem(`weekend-permissions-${currentWeek}`, JSON.stringify(permissionsToSave));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setSaveStatus('❌ Save failed, using localStorage');
      // Fallback to localStorage
      localStorage.setItem(`weekend-permissions-${currentWeek}`, JSON.stringify(permissionsToSave));
    } finally {
      setIsSaving(false);
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Check for holiday when week changes
  useEffect(() => {
    setIsHolidayWeek(isMondayHoliday(currentWeek));
  }, [currentWeek]);

  // Save permissions to localStorage
  useEffect(() => {
    if (permissions.length > 0) {
      const storageKey = `weekend_permissions_${currentWeek}`;
      localStorage.setItem(storageKey, JSON.stringify(permissions));
    }
  }, [permissions, currentWeek]);

  // Load permissions from database or localStorage when week changes
  useEffect(() => {
    const initializePermissions = async () => {
      if (dataMatchIt.length === 0) return;

      // Try to load from database first
      const loadedFromDB = await loadPermissionsFromDB(currentWeek);
      
      if (!loadedFromDB) {
        // Fallback to localStorage
        const storageKey = `weekend_permissions_${currentWeek}`;
        const savedPermissions = localStorage.getItem(storageKey);
        
        if (savedPermissions) {
          try {
            const parsed = JSON.parse(savedPermissions);
            // Verify that saved permissions match current residents
            const currentResidentIds = new Set(dataMatchIt.map(r => r.id));
            const validPermissions = parsed.filter((p: WeekendPermission) => 
              currentResidentIds.has(p.residentId)
            );
            
            if (validPermissions.length > 0) {
              setPermissions(validPermissions);
              setSaveStatus('📁 Loaded from localStorage');
              return;
            }
          } catch (error) {
            console.warn('Failed to load saved permissions:', error);
          }
        }
        
        // Create new permissions if no saved data
        const weekPermissions = dataMatchIt.map(resident => ({
          residentId: resident.id,
          badge: String(resident.badge),
          firstName: resident.first_name || '',
          lastName: resident.last_name || '',
          dateOfBirth: resident.date_of_birth || '',
          age: resident.age || 0,
          week: currentWeek,
          friday: { type: 'none' as PermissionType },
          saturday: { type: 'none' as PermissionType },
          sunday: { type: 'none' as PermissionType },
          monday: isMondayHoliday(currentWeek) ? { type: 'none' as PermissionType } : undefined,
          notes: '',
          status: 'pending' as const,
          lastModified: new Date().toISOString()
        }));
        setPermissions(weekPermissions);
        setSaveStatus('🆕 Created new permissions');
      }
    };

    initializePermissions();
  }, [dataMatchIt, currentWeek]);

  // Get week dates for display
  const getWeekDates = (weekString: string) => {
    const [year, week] = weekString.split('-W');
    const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
    const friday = new Date(date);
    friday.setDate(date.getDate() + (5 - date.getDay()));
    
    return {
      friday: new Date(friday),
      saturday: new Date(friday.getTime() + 24 * 60 * 60 * 1000),
      sunday: new Date(friday.getTime() + 2 * 24 * 60 * 60 * 1000),
      monday: new Date(friday.getTime() + 3 * 24 * 60 * 60 * 1000)
    };
  };

  const weekDates = getWeekDates(currentWeek);

  // Navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    const [year, week] = currentWeek.split('-W');
    const weekNum = parseInt(week);
    
    if (direction === 'next') {
      if (weekNum >= 52) {
        setCurrentWeek(`${parseInt(year) + 1}-W01`);
      } else {
        setCurrentWeek(`${year}-W${(weekNum + 1).toString().padStart(2, '0')}`);
      }
    } else {
      if (weekNum <= 1) {
        setCurrentWeek(`${parseInt(year) - 1}-W52`);
      } else {
        setCurrentWeek(`${year}-W${(weekNum - 1).toString().padStart(2, '0')}`);
      }
    }
  };

  // Permission management functions
  const updatePermission = (residentId: number, day: keyof Pick<WeekendPermission, 'friday' | 'saturday' | 'sunday' | 'monday'>, permission: Partial<DayPermission>) => {
    setPermissions(prev => {
      const updated = prev.map(p => {
        if (p.residentId === residentId) {
          return {
            ...p,
            [day]: { ...p[day], ...permission },
            lastModified: new Date().toISOString()
          };
        }
        return p;
      });
      
      // Auto-save to database
      savePermissionsToDB(updated);
      return updated;
    });
  };


  // Editing functions
  const startEdit = (residentId: number, field: string) => {
    const permission = permissions.find(p => p.residentId === residentId);
    if (permission) {
      let value = '';
      if (field === 'notes') {
        value = permission.notes || '';
      } else if (field === 'status') {
        value = permission.status;
      } else if (field.includes('Time')) {
        const [day, timeType] = field.split('.');
        const dayData = permission[day as keyof Pick<WeekendPermission, 'friday' | 'saturday' | 'sunday' | 'monday'>] as DayPermission;
        value = dayData?.[timeType as 'departureTime' | 'returnTime'] || '';
      }
      
      setEditingCell({ id: residentId, field });
      setEditValue(value);
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const { id, field } = editingCell;
    
    setPermissions(prev => {
      const updated = prev.map(p => {
        if (p.residentId === id) {
          if (field === 'notes') {
            return { ...p, notes: editValue, lastModified: new Date().toISOString() };
          } else if (field === 'actualArrivalTime') {
            // Calculate status based on arrival time
            const newStatus = calculateArrivalStatus(editValue);
            return { 
              ...p, 
              actualArrivalTime: editValue, 
              status: newStatus,
              lastModified: new Date().toISOString() 
            };
          } else if (field === 'status') {
            return { ...p, status: editValue, lastModified: new Date().toISOString() };
          } else if (field.includes('Time')) {
            const [day, timeType] = field.split('.');
            const dayData = p[day as keyof Pick<WeekendPermission, 'friday' | 'saturday' | 'sunday' | 'monday'>] as DayPermission;
            return {
              ...p,
              [day]: {
                ...dayData,
                [timeType]: editValue
              },
              lastModified: new Date().toISOString()
            };
          }
        }
        return p;
      });
      
      // Auto-save to database
      savePermissionsToDB(updated);
      return updated;
    });
    
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Export permissions to CSV
  const exportToCSV = () => {
    const headers = [
      'Badge', 'Achternaam', 'Voornaam', 'Geboortedatum', 'Leeftijd',
      'Vrijdag', 'Zaterdag', 'Zondag',
      ...(isHolidayWeek ? ['Maandag'] : []),
      'Opmerkingen', 'Aankomst Tijd', 'Status', 'Laatst Gewijzigd'
    ];
    
    const rows = permissions.map(p => [
      p.badge, p.lastName, p.firstName, formatDate(p.dateOfBirth), p.age.toString(),
      p.friday.type, p.saturday.type, p.sunday.type,
      ...(isHolidayWeek && p.monday ? [p.monday.type] : []),
      p.notes || '', p.actualArrivalTime || '', p.status, formatDate(p.lastModified)
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekend_permissies_${currentWeek}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print permissions
  const printPermissions = () => {
    window.print();
  };

  // Validate time format
  const validateTime = (time: string): boolean => {
    if (!time) return true;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Calculate status based on arrival time
  const calculateArrivalStatus = (actualArrivalTime: string): string => {
    if (!actualArrivalTime || !validateTime(actualArrivalTime)) {
      return 'pending';
    }

    const [arrivalHours, arrivalMinutes] = actualArrivalTime.split(':').map(Number);
    const arrivalTimeInMinutes = arrivalHours * 60 + arrivalMinutes;
    const deadlineInMinutes = 20 * 60; // 20:00 = 1200 minutes

    if (arrivalTimeInMinutes <= deadlineInMinutes) {
      return 'OK';
    } else {
      const lateMinutes = arrivalTimeInMinutes - deadlineInMinutes;
      const lateHours = Math.floor(lateMinutes / 60);
      const remainingMinutes = lateMinutes % 60;
      
      if (lateHours > 0) {
        return `${lateHours}u${remainingMinutes.toString().padStart(2, '0')}mn te laat`;
      } else {
        return `${lateMinutes}mn te laat`;
      }
    }
  };

  // Check if resident is under 16 (no permissions allowed)
  const isUnder16 = (age: number): boolean => {
    return age < 16;
  };

  // Check if resident arrived within the last 7 days
  const isNewArrival = (dateIn: string): boolean => {
    if (!dateIn) return false;
    
    try {
      const arrivalDate = new Date(dateIn);
      const today = new Date();
      const diffTime = today.getTime() - arrivalDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 7 && diffDays >= 0;
    } catch (error) {
      console.warn('Error calculating arrival days:', error);
      return false;
    }
  };

  // Get row background color based on age and arrival date
  const getRowBackgroundColor = (age: number, dateIn: string, index: number): string => {
    if (isUnder16(age)) {
      return 'bg-accent'; // Red for under 16
    }
    if (isNewArrival(dateIn)) {
      return 'bg-accent'; // Green for new arrivals (≤7 days)
    }
    // Default alternating rows
    return index % 2 === 0 ? 'bg-card' : 'bg-muted';
  };

  // Render editable cell
  const renderEditableCell = (residentId: number, field: string, value: string, type: 'text' | 'time' | 'select' = 'text', options?: string[]) => {
    const isEditing = editingCell?.id === residentId && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-1 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            >
              {options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-1 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          )}
          <button onClick={saveEdit} className="text-foreground hover:text-foreground/80">
            <Check className="h-3 w-3" />
          </button>
          <button onClick={cancelEdit} className="text-destructive hover:text-destructive/80">
            <X className="h-3 w-3" />
          </button>
        </div>
      );
    }
    
    return (
      <div
        className="cursor-pointer hover:bg-yellow-100 px-1 py-1 rounded text-xs flex items-center justify-between group"
        onClick={() => startEdit(residentId, field)}
      >
        <span>{value || '-'}</span>
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
      </div>
    );
  };

  // Render permission type selector
  const renderPermissionSelector = (residentId: number, day: keyof Pick<WeekendPermission, 'friday' | 'saturday' | 'sunday' | 'monday'>) => {
    const permission = permissions.find(p => p.residentId === residentId);
    const dayPermission = permission?.[day] as DayPermission;
    const resident = dataMatchIt.find(r => r.id === residentId);
    const isUnder16Resident = resident ? isUnder16(resident.age || 0) : false;
    
    return (
      <select
        value={dayPermission?.type || 'none'}
        onChange={(e) => {
          if (isUnder16Resident) return; // Prevent changes for under 16
          
          const type = e.target.value as PermissionType;
          if (type === 'daily') {
            updatePermission(residentId, day, {
              type: 'daily',
              departureTime: '08:00',
              returnTime: '20:00',
              overnight: false
            });
          } else if (type === 'none') {
            updatePermission(residentId, day, { type: 'none' });
          }
        }}
        disabled={isUnder16Resident}
        className={`w-full px-1 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-ring ${
          isUnder16Resident 
            ? 'bg-gray-200 cursor-not-allowed opacity-50' 
            : dayPermission?.type === 'daily'
              ? 'bg-accent text-accent-foreground border-border font-semibold'
              : 'bg-white dark:bg-gray-700'
        }`}
        title={isUnder16Resident ? 'Geen permissies toegestaan voor bewoners onder 16 jaar' : ''}
      >
        <option value="none">{isUnder16Resident ? 'Niet toegestaan' : 'Geen'}</option>
        {!isUnder16Resident && <option value="daily">Dagpermissie</option>}
      </select>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
            <p>Laden van bewonersdata...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 bg-background min-h-screen">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="bg-card shadow-sm rounded-lg p-4 border border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Zoek bewoners (min. 2 letters)... ESC = terug"
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        clearSearch();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Header */}
        <div className="mb-6">
          <div className="bg-white shadow-sm rounded-lg p-4 mb-4 border dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Title */}
              <div className="bg-purple-200 px-3 py-2 text-center font-semibold rounded">
                <div className="text-lg md:text-xl font-bold text-black">WEEKEND PERMISSIE</div>
                <div className="text-sm mt-1 text-black">
                  Week {currentWeek.split('-W')[1]} - {currentWeek.split('-W')[0]}
                  {isHolidayWeek && <span className="ml-2 px-2 py-1 bg-accent rounded text-xs">FEESTDAG</span>}
                </div>
                {saveStatus && (
                  <div className="text-xs mt-1 text-black">
                    {saveStatus}
                  </div>
                )}
              </div>
              
              {/* Week Navigation */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigateWeek('prev')}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                  >
                    ← Vorige
                  </button>
                  <button
                    onClick={() => setCurrentWeek(getCurrentWeek())}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                  >
                    Deze week
                  </button>
                  <button
                    onClick={() => navigateWeek('next')}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                  >
                    Volgende →
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(weekDates.friday)} - {formatDate(weekDates.sunday)}
                  {isHolidayWeek && ` tot ${formatDate(weekDates.monday)}`}
                </div>
              </div>
              
              {/* Stats */}
              <div className="text-center md:text-right">
                <div className="text-foreground">
                  Bewoners: <span className="font-bold">
                    {showOnlySearchResult ? '1' : dataMatchIt.length}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Permissies: <span className="font-bold">{
                    permissions
                      .filter(permission => showOnlySearchResult ? permission.residentId === searchResult?.id : true)
                      .filter(p => 
                        p.friday.type !== 'none' || p.saturday.type !== 'none' || p.sunday.type !== 'none' || 
                        (p.monday && p.monday.type !== 'none')
                      ).length
                  }</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPermissions(prev => prev.map(p => ({
                ...p,
                friday: { type: 'none' },
                saturday: { type: 'none' },
                sunday: { type: 'none' },
                monday: p.monday ? { type: 'none' } : undefined,
                lastModified: new Date().toISOString()
              })));
            }}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm"
          >
            Alle permissies wissen
          </button>
          
          {/* Save/Export/Print Actions */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => savePermissionsToDB(permissions)}
              disabled={isSaving}
              className={`px-3 py-1 text-primary-foreground rounded text-sm flex items-center gap-1 ${
                isSaving 
                  ? 'bg-muted cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={printPermissions}
              className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-purple-700 text-white">
                <tr>
                  <th className="px-2 py-2 text-left font-bold border-r border-purple-600">Badge</th>
                  <th className="px-2 py-2 text-left font-bold border-r border-purple-600">Achternaam</th>
                  <th className="px-2 py-2 text-left font-bold border-r border-purple-600">Voornaam</th>
                  <th className="px-2 py-2 text-left font-bold border-r border-purple-600">Geboortedatum</th>
                  <th className="px-2 py-2 text-left font-bold border-r border-purple-600">Leeftijd</th>
                  <th className="px-2 py-2 text-center font-bold border-r border-purple-600">
                    Vrijdag<br/>{formatDate(weekDates.friday).split(' ')[0]}
                  </th>
                  <th className="px-2 py-2 text-center font-bold border-r border-purple-600">
                    Zaterdag<br/>{formatDate(weekDates.saturday).split(' ')[0]}
                  </th>
                  <th className="px-2 py-2 text-center font-bold border-r border-purple-600">
                    Zondag<br/>{formatDate(weekDates.sunday).split(' ')[0]}
                  </th>
                  {isHolidayWeek && (
                    <th className="px-2 py-2 text-center font-bold border-r border-purple-600 bg-foreground">
                      Maandag (Feestdag)<br/>{formatDate(weekDates.monday).split(' ')[0]}
                    </th>
                  )}
                  <th className="px-2 py-2 text-left font-bold border-r border-purple-600">Opmerkingen</th>
                  <th className="px-2 py-2 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {permissions
                  .filter(permission => showOnlySearchResult ? permission.residentId === searchResult?.id : true)
                  .map((permission, index) => {
                  const resident = dataMatchIt.find(r => r.id === permission.residentId);
                  const rowBgColor = getRowBackgroundColor(
                    permission.age, 
                    resident?.date_in || '', 
                    index
                  );
                  const isMinor = isUnder16(permission.age);
                  const isNewResident = resident ? isNewArrival(resident.date_in || '') : false;
                  
                  return (
                  <tr 
                    key={permission.residentId}
                    id={`resident-row-${permission.residentId}`}
                    className={`${rowBgColor} hover:bg-accent border-b border-border ${
                      isMinor ? 'relative' : ''
                    } ${
                      highlightedResident === permission.residentId ? 'ring-4 ring-yellow-400 bg-yellow-100' : ''
                    }`}
                    title={
                      isMinor 
                        ? 'Bewoner onder 16 jaar - geen permissies toegestaan' 
                        : isNewResident 
                        ? 'Nieuwe bewoner (minder dan 7 dagen)' 
                        : ''
                    }
                  >
                    <td className="px-2 py-2 font-medium border-r border-gray-200 dark:border-gray-600">{permission.badge}</td>
                    <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-600">{permission.lastName}</td>
                    <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-600">{permission.firstName}</td>
                    <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-600">{formatDate(permission.dateOfBirth)}</td>
                    <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-600">{permission.age}</td>
                    
                    {/* Friday */}
                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-600">
                      <div className="space-y-1">
                        {renderPermissionSelector(permission.residentId, 'friday')}
                      </div>
                    </td>
                    
                    {/* Saturday */}
                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-600">
                      <div className="space-y-1">
                        {renderPermissionSelector(permission.residentId, 'saturday')}
                      </div>
                    </td>
                    
                    {/* Sunday */}
                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-600">
                      <div className="space-y-1">
                        {renderPermissionSelector(permission.residentId, 'sunday')}
                      </div>
                    </td>
                    
                    {/* Monday (Holiday) */}
                    {isHolidayWeek && permission.monday && (
                      <td className="px-1 py-1 border-r border-gray-200 bg-accent">
                        <div className="space-y-1">
                          {renderPermissionSelector(permission.residentId, 'monday')}
                          {permission.monday.type !== 'none' && (
                            <div className="grid grid-cols-2 gap-1">
                              {renderEditableCell(permission.residentId, 'monday.departureTime', permission.monday.departureTime || '', 'time')}
                              {renderEditableCell(permission.residentId, 'monday.returnTime', permission.monday.returnTime || '', 'time')}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    
                    {/* Notes */}
                    <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-600">
                      {renderEditableCell(permission.residentId, 'notes', permission.notes || '')}
                    </td>
                    
                    {/* Status */}
                    <td className="px-2 py-2">
                      <div className="space-y-1">
                        {/* Arrival Time Input */}
                        <div className="text-xs">
                          <label className="block text-gray-600 mb-1">Aankomst:</label>
                          {renderEditableCell(permission.residentId, 'actualArrivalTime', permission.actualArrivalTime || '', 'time')}
                        </div>
                        {/* Status Display */}
                        <div className={`text-xs font-semibold px-2 py-1 rounded text-center ${
                          permission.status === 'OK' 
                            ? 'bg-accent text-accent-foreground'
                            : permission.status === 'pending'
                              ? 'bg-gray-100 text-gray-700 dark:text-gray-300'
                              : 'bg-destructive/10 text-destructive'
                        }`}>
                          {permission.status}
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Legenda:</h4>
          
          {/* Permission Types */}
          <div className="mb-4">
            <h5 className="font-medium mb-2 text-foreground">Types:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent border border-border rounded"></div>
                <span><strong>Dagpermissie:</strong> Voor één dag, terugkeer voor 20:00 dezelfde dag</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                <span><strong>Geen permissie:</strong> Bewoner blijft in de faciliteit</span>
              </div>
            </div>
          </div>
          
          {/* Color Coding */}
          <div>
            <h5 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Kleurcodering:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent border border-border rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Rood:</strong> Onder 16 jaar (geen permissies toegestaan)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent border border-border rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Groen:</strong> Nieuwe bewoner (≤7 dagen aanwezig)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Wit/Grijs:</strong> Normale bewoners
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
