'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, MapPin, Users, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';

export default function AfsprakenPage() {
  const { noordData, zuidData, updateInDataMatchIt } = useData();
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Set default date to day after tomorrow (in local timezone)
    const today = new Date();
    const dayAfterTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
    setSelectedDate(dayAfterTomorrowStr);
  }, []);

  // Get all remarks from Noord and Zuid data
  const getAllRemarks = () => {
    if (!isClient) return [];
    
    const extractRemarks = (residents: any[], building: string) => {
      const result: any[] = [];
      
      residents.forEach(resident => {
        // Skip general remarks as they are used for kitchen list, not appointments
        // Only show room-specific remarks on appointments page
        
        // Add room remarks if they exist (appointments/afspraken only)
        if (resident.roomRemarks && resident.roomRemarks.trim() !== '') {
          // Parse appointment data - format: "DATE|REMARK" or just "REMARK" for legacy
          const remarkParts = resident.roomRemarks.split('|');
          let appointmentDate = selectedDate; // Default to selected date
          let appointmentText = resident.roomRemarks;
          
          if (remarkParts.length === 2) {
            appointmentDate = remarkParts[0];
            appointmentText = remarkParts[1];
          }
          
          // Show appointments for the selected date (but also show today's for debugging)
          const today = new Date().toISOString().split('T')[0];
          if (appointmentDate === selectedDate || appointmentDate === today) {
            result.push({
              id: `${resident.id}-room-${appointmentDate}`,
              name: resident.name || `${resident.firstName} ${resident.lastName}`,
              badge: resident.badge,
              room: resident.room,
              building: building,
              remarks: appointmentText,
              bedNumber: resident.bedNumber,
              type: 'Appointment',
              appointmentDate: appointmentDate
            });
          }
        }
      });
      
      return result;
    };

    const noordRemarks = extractRemarks(noordData, 'Noord');
    const zuidRemarks = extractRemarks(zuidData, 'Zuid');

    return [...noordRemarks, ...zuidRemarks].sort((a, b) => a.room.localeCompare(b.room));
  };

  const remarksData = getAllRemarks();

  // Function to clean up old appointments (previous days)
  const cleanupOldAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    
    [...noordData, ...zuidData].forEach(resident => {
      if (resident.roomRemarks && resident.roomRemarks.includes('|')) {
        const remarkParts = resident.roomRemarks.split('|');
        if (remarkParts.length === 2) {
          const appointmentDate = remarkParts[0];
          // Remove appointments from yesterday and earlier
          if (appointmentDate < today) {
            updateInDataMatchIt(resident.id, { roomRemarks: '' });
          }
        }
      }
    });
  };

  // Function to migrate today's appointments to tomorrow
  const migrateTodaysAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];
    
    console.log('🔄 Migration: Today =', today, 'Tomorrow =', tomorrow);
    console.log('🔄 Noord data length:', noordData.length);
    console.log('🔄 Zuid data length:', zuidData.length);
    
    let updated = 0;
    [...noordData, ...zuidData].forEach(resident => {
      console.log(`🔍 Checking resident ${resident.firstName} ${resident.lastName} (${resident.name}):`, {
        roomRemarks: resident.roomRemarks,
        hasRemarks: !!resident.roomRemarks,
        hasPipe: resident.roomRemarks?.includes('|')
      });
      
      if (resident.roomRemarks && resident.roomRemarks.includes('|')) {
        const remarkParts = resident.roomRemarks.split('|');
        if (remarkParts.length === 2) {
          const appointmentDate = remarkParts[0];
          const appointmentText = remarkParts[1];
          console.log(`  📅 Appointment date: ${appointmentDate}, Text: ${appointmentText}`);
          // Migrate appointments from today to tomorrow
          if (appointmentDate === today) {
            console.log(`✅ Migrating appointment for ${resident.firstName} ${resident.lastName} from ${today} to ${tomorrow}`);
            const newAppointmentData = `${tomorrow}|${appointmentText}`;
            updateInDataMatchIt(resident.id, { roomRemarks: newAppointmentData });
            updated++;
          }
        }
      } else if (resident.roomRemarks && resident.roomRemarks.trim() !== '') {
        // Handle legacy appointments without date prefix
        console.log(`🔄 Converting legacy appointment for ${resident.firstName} ${resident.lastName}: "${resident.roomRemarks}"`);
        const newAppointmentData = `${tomorrow}|${resident.roomRemarks}`;
        updateInDataMatchIt(resident.id, { roomRemarks: newAppointmentData });
        updated++;
      }
    });
    
    console.log(`📊 Migration complete: ${updated} appointments updated`);
  };

  // Auto cleanup and migration when data is loaded
  useEffect(() => {
    if (isClient && (noordData.length > 0 || zuidData.length > 0)) {
      console.log('🔄 Running migration and cleanup...');
      migrateTodaysAppointments();
      cleanupOldAppointments();
    }
  }, [isClient, noordData, zuidData]);

  // Function to add new appointment
  const addAppointment = (residentId: number, appointmentText: string) => {
    const appointmentData = `${selectedDate}|${appointmentText}`;
    updateInDataMatchIt(residentId, { roomRemarks: appointmentData });
  };

  // Function to delete appointment
  const deleteAppointment = (residentId: number) => {
    updateInDataMatchIt(residentId, { roomRemarks: '' });
  };

  // Get formatted dates
  const getFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return formatDate(date);
  };

  // Get short formatted date for badges
  const getShortFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return formatDate(date);
  };

  // For Opmerkingen per Bewoner: display date + 1 day instead of actual
  const getShortFormattedDatePlusOne = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
    return formatDate(date);
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
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <DashboardLayout className="no-print">
        <div className="p-6 bg-card min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground font-title">Afspraken</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Afspraken worden gemaakt voor de volgende dag en automatisch opgeruimd
            </p>
          </div>

          {/* Date Selection */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-foreground" />
              <label htmlFor="appointment-date" className="text-sm font-medium text-foreground">
                Afspraken voor:
              </label>
              <input
                id="appointment-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring dark:bg-background dark:border-border"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedDate && getFormattedDate(selectedDate)}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-accent/10 border border-border rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex">
                <Clock className="h-5 w-5 text-foreground mr-2" />
                <div className="text-sm text-foreground">
                  <p><strong>Belangrijk:</strong> Afspraken worden automatisch opgeruimd na afloop van de dag.</p>
                  <p>Standaard worden afspraken voor <strong>overmorgen</strong> getoond.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-card rounded-lg shadow border border-border p-4">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-foreground mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Opmerkingen</p>
                <p className="text-2xl font-bold text-foreground">{isClient ? remarksData.length : 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow border border-border p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-foreground mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Noord</p>
                <p className="text-2xl font-bold text-foreground">
                  {isClient ? remarksData.filter(r => r.building === 'Noord').length : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow border border-border p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-foreground mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Zuid</p>
                <p className="text-2xl font-bold text-foreground">
                  {isClient ? remarksData.filter(r => r.building === 'Zuid').length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks List */}
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
              Opmerkingen per Bewoner
            </h3>
            
            {isClient && remarksData.length > 0 ? (
              <div className="space-y-4">
                {remarksData.map((item) => (
                  <div key={`${item.id}-${item.building}`} className="border border-border rounded-lg p-4 bg-background">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.building === 'Noord' ? 'bg-accent text-accent-foreground' : 'bg-accent text-accent-foreground'
                          }`}>
                            {item.building}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Afspraak
                          </span>
                          {item.appointmentDate && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                              {getShortFormattedDatePlusOne(item.appointmentDate)}
                            </span>
                          )}
                          <span className="text-sm font-medium text-foreground">
                            Kamer {item.room} - Bed {item.bedNumber || 'N/A'}
                          </span>
                          <span className="text-sm text-muted-foreground">#{item.badge}</span>
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">{item.name}</h4>
                        <div className="bg-muted rounded-md p-3">
                          <div className="flex items-start">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                            <span className="inline-block text-sm sm:text-base font-semibold text-foreground bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-100 px-2 py-1 rounded">
                              {item.remarks}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <button
                          onClick={() => {
                            if (window.confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) {
                              // Extract resident ID from the item id (format: "residentId-room-date")
                              const residentId = parseInt(item.id.split('-')[0]);
                              deleteAppointment(residentId);
                            }
                          }}
                          className="inline-flex items-center p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors duration-200"
                          title="Afspraak verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">Geen opmerkingen</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isClient ? 
                    'Er zijn momenteel geen opmerkingen genoteerd voor bewoners.' :
                    'Laden...'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-sm text-foreground">
          <div className="flex justify-between items-center">
            <div>
              Toont <span className="font-medium">{isClient ? remarksData.length : 0}</span> opmerkingen
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Laatst bijgewerkt: {isClient ? new Date().toLocaleString('nl-NL') : '---'}
            </div>
          </div>
        </div>
        </div>
      </DashboardLayout>

      {/* Print-only layout */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.3px' }}>Afspraken voor:</div>
          <div style={{ fontSize: '16px', color: '#111', marginTop: '6px', fontWeight: 600 }}>
            {selectedDate ? (() => {
              const [y, m, d] = selectedDate.split('-');
              const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
              return formatDate(date);
            })() : ''}
          </div>
          <div style={{ height: '1px', backgroundColor: '#000', opacity: 0.1, marginTop: '10px' }} />
        </div>

        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '11px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' as unknown as undefined }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f4f7' }}>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Gebouw</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Kamer</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Bed</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Badge</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Naam</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Opmerking</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>Datum</th>
            </tr>
          </thead>
          <tbody>
            {remarksData.map((item, idx) => (
              <tr key={`${item.id}-${item.building}-print`} style={{ backgroundColor: idx % 2 ? '#fbfbfb' : 'transparent' }}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    backgroundColor: item.building === 'Noord' ? '#e6f0ff' : '#ffeede',
                    color: item.building === 'Noord' ? '#1e3a8a' : '#9a3412'
                  }}>
                    {item.building}
                  </span>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.room}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.bedNumber || ''}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>#{item.badge}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <span style={{ backgroundColor: '#fff8c5', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                    {item.remarks}
                  </span>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.appointmentDate ? getShortFormattedDatePlusOne(item.appointmentDate) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}