'use client';

import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import AddResidentModal from '../components/AddResidentModal';
import UploadDocModal from '../components/UploadDocModal';
import { useData } from "../../lib/DataContextDebug";
import { formatDateWithDay } from '../../lib/utils';

export default function DashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { bewonerslijst, occupancyStats } = useData();
  
  // Get actual resident count from Bewonerslijst data
  const totalResidents = bewonerslijst.length;

  const handleAddResident = (newResident: any) => {
    // In a real app, this would save to database
    console.log('New resident added:', newResident);
    // You could redirect to residents page or show success message
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      // In a real app, this would upload to server
      console.log('Files uploaded:', Array.from(files).map(f => f.name));
      setIsUploadModalOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-2 h-12 rounded-full mr-4"></div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Dashboard Overzicht
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Welkom bij het OOC Steenokkerzeel Beheersysteem</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {formatDateWithDay(new Date())}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vandaag
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Bed Occupancy */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Occupancy */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 13h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Bezette Bedden</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {occupancyStats.occupiedBeds} / {occupancyStats.totalBeds}
                    </dd>
                    <dd className="text-sm text-gray-500 dark:text-gray-400">
                      {occupancyStats.occupancyRate.toFixed(1)}% bezetting
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 px-6 py-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold text-green-600 dark:text-green-400">{occupancyStats.availableBeds}</span> beschikbare bedden
              </div>
            </div>
          </div>

          {/* Noord Building */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Noord Gebouw</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {occupancyStats.noord.occupied} / {occupancyStats.noord.total}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {occupancyStats.noord.rate.toFixed(1)}% bezetting
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-600">Meisjes:</span> {occupancyStats.girls.occupied}/{occupancyStats.girls.total} ({occupancyStats.girls.rate.toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Zuid Building */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Zuid Gebouw</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {occupancyStats.zuid.occupied} / {occupancyStats.zuid.total}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {occupancyStats.zuid.rate.toFixed(1)}% bezetting
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-orange-600">Minors:</span> {occupancyStats.minors.occupied}/{occupancyStats.minors.total} ({occupancyStats.minors.rate.toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Total Residents */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden shadow-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Totaal Bewoners</dt>
                    <dd className="text-lg font-semibold text-gray-900">{totalResidents}</dd>
                    <dd className="text-xs text-gray-500">
                      Geregistreerd in systeem
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 px-5 py-3">
              <div className="text-sm">
                <a href="/dashboard/bewonerslijst" className="font-medium text-purple-600 hover:text-purple-500">Bekijk bewoners</a>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Documentenbeheer</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload documenten, Excel bestanden, afbeeldingen en andere bestanden</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2 font-medium transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Documenten
              </button>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <div className="font-medium">Excel Bestanden</div>
                <div className="text-xs">XLS, XLSX rekenbladen</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Documenten</div>
                <div className="text-xs">PDF, DOC, DOCX, PPT</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Afbeeldingen</div>
                <div className="text-xs">JPG, PNG, GIF, TIFF</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Andere Bestanden</div>
                <div className="text-xs">TXT, RTF, ODT en meer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recente Activiteit</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Nieuwe bewoner <a href="#" className="font-medium text-gray-900">Ahmed Hassan</a> geregistreerd</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime="2024-01-20">1 uur geleden</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Medische afspraak ingepland voor <a href="#" className="font-medium text-gray-900">Maria Silva</a></p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime="2024-01-20">3 uur geleden</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Document ingediend door <a href="#" className="font-medium text-gray-900">John Doe</a></p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime="2024-01-20">5 uur geleden</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Snelle Acties</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Bewoner Toevoegen</p>
                  </div>
                </button>

                <button 
                  onClick={() => window.location.href = '/dashboard/residents-grid'}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Residents Grid</p>
                  </div>
                </button>

                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 col-span-2"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Document Uploaden</p>
                  </div>
                </button>

              </div>
            </div>
          </div>
        </div>

        <AddResidentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddResident}
        />

        <UploadDocModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleFileUpload}
        />
      </div>
    </DashboardLayout>
  );
}
