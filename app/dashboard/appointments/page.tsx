'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, MapPin, Users, MessageSquare, Clock } from 'lucide-react';
import { useData } from '../../../lib/DataContext';
import { formatDate } from '../../../lib/utils';

export default function AfsprakenPage() {
  const { noordData, zuidData } = useData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get all remarks from Noord and Zuid data
  const getAllRemarks = () => {
    if (!isClient) return [];
    
    const noordRemarks = noordData
      .filter(resident => resident.remarks && resident.remarks.trim() !== '')
      .map(resident => ({
        id: resident.id,
        name: resident.name,
        badge: resident.badge,
        room: resident.room,
        building: 'Noord',
        remarks: resident.remarks,
        bedNumber: resident.bedNumber
      }));

    const zuidRemarks = zuidData
      .filter(resident => resident.remarks && resident.remarks.trim() !== '')
      .map(resident => ({
        id: resident.id,
        name: resident.name,
        badge: resident.badge,
        room: resident.room,
        building: 'Zuid',
        remarks: resident.remarks,
        bedNumber: resident.bedNumber
      }));

    return [...noordRemarks, ...zuidRemarks].sort((a, b) => a.room.localeCompare(b.room));
  };

  const remarksData = getAllRemarks();

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">Afspraken</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Overzicht van alle opmerkingen en afspraken voor bewoners in Noord en Zuid
            </p>
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
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Kamer {item.room} - Bed {item.bedNumber}
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