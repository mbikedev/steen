'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, MapPin, Users, MessageSquare, Clock } from 'lucide-react';
import { useData } from "../../../lib/DataContextDebug";
import { formatDate } from '../../../lib/utils';

export default function AfsprakenPage() {
  const { noordData, zuidData, updateInDataMatchIt } = useData();
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Set default date to tomorrow (in local timezone)
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setSelectedDate(tomorrowStr);
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
    alert(`Migration complete: ${updated} appointments updated to tomorrow's date`);
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

  // Get formatted dates
  const getFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get short formatted date for badges
  const getShortFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('nl-NL');
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">Afspraken</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Afspraken worden gemaakt voor de volgende dag en automatisch opgeruimd
            </p>
          </div>

          {/* Date Selection */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <label htmlFor="appointment-date" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Afspraken voor:
              </label>
              <input
                id="appointment-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {selectedDate && getFormattedDate(selectedDate)}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex">
                <Clock className="h-5 w-5 text-blue-400 mr-2" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Belangrijk:</strong> Afspraken worden automatisch opgeruimd na afloop van de dag.</p>
                  <p>Standaard worden afspraken voor <strong>morgen</strong> getoond.</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // First show all data for debugging
                    console.log('🔍 DEBUG: All residents with roomRemarks:');
                    [...noordData, ...zuidData].forEach(resident => {
                      if (resident.roomRemarks) {
                        console.log('  Resident:', resident.firstName, resident.lastName);
                        console.log('  Room:', resident.room);
                        console.log('  RoomRemarks:', JSON.stringify(resident.roomRemarks));
                        console.log('  Type:', typeof resident.roomRemarks);
                        console.log('  Length:', resident.roomRemarks.length);
                        console.log('  ---');
                      }
                    });
                    
                    migrateTodaysAppointments();
                    setTimeout(() => window.location.reload(), 3000);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Debug & Update
                </button>
                <button
                  onClick={() => {
                    // Clear the appointment completely and let user recreate it properly
                    const selah = [...noordData, ...zuidData].find(r => 
                      r.firstName?.includes('Selah') || r.lastName?.includes('Abdela') || r.name?.includes('Selah') || r.badge === 25189
                    );
                    
                    if (selah) {
                      console.log('🗑️ Clearing Selah appointment completely');
                      updateInDataMatchIt(selah.id, { roomRemarks: '' });
                      alert('Cleared Selah appointment. Please recreate it on the Data Match-IT page with tomorrow\'s date.');
                      setTimeout(() => {
                        window.open('/dashboard/data-match-it', '_blank');
                      }, 1000);
                    } else {
                      alert('Selah not found!');
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Clear & Recreate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Totaal Opmerkingen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isClient ? remarksData.length : 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Noord</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isClient ? remarksData.filter(r => r.building === 'Noord').length : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Zuid</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isClient ? remarksData.filter(r => r.building === 'Zuid').length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
              Opmerkingen per Bewoner
            </h3>
            
            {isClient && remarksData.length > 0 ? (
              <div className="space-y-4">
                {remarksData.map((item) => (
                  <div key={`${item.id}-${item.building}`} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.building === 'Noord' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.building}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Afspraak
                          </span>
                          {item.appointmentDate && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {getShortFormattedDate(item.appointmentDate)}
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Kamer {item.room} - Bed {item.bedNumber || 'N/A'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">#{item.badge}</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.name}</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                          <div className="flex items-start">
                            <MessageSquare className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{item.remarks}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Geen opmerkingen</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
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
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <div>
              Toont <span className="font-medium">{isClient ? remarksData.length : 0}</span> opmerkingen
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Laatst bijgewerkt: {isClient ? new Date().toLocaleString('nl-NL') : '---'}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}