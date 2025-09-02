'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import AddResidentModal from '../components/AddResidentModal';
import UploadDocModal from '../components/UploadDocModal';
import { useData } from "../../lib/DataContextDebug";
import { formatDateWithDay } from '../../lib/utils';

export default function DashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { bewonerslijst, occupancyStats } = useData();
  const router = useRouter();
  
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6">
        {/* Hero Header */}
        <div className="mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl"></div>
          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 dark:border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-4 h-16 rounded-full mr-6 shadow-lg"></div>
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-400 to-purple-400 w-4 h-8 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
                    Dashboard Overzicht
                  </h1>
                  <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 font-medium">
                    ✨ Welkom bij het OOC Steenokkerzeel Beheersysteem
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">Systeem Online</span>
                  </div>
                </div>
              </div>
              <div className="text-right bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/50">
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {formatDateWithDay(new Date())}
                </p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                  📅 Vandaag
                </p>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Live dashboard data
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Total Occupancy */}
          <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-950/30 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl border border-emerald-200/50 dark:border-emerald-700/30 hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10 dark:from-emerald-400/10 dark:to-green-500/20"></div>
            <div className="relative p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-2xl shadow-2xl group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 13h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate uppercase tracking-wide">🏠 Bezette Bedden</dt>
                    <dd className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {occupancyStats.occupiedBeds} / {occupancyStats.totalBeds}
                    </dd>
                    <dd className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      {occupancyStats.occupancyRate.toFixed(1)}% bezetting
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 px-8 py-4 border-t border-emerald-200/50 dark:border-emerald-700/30">
              <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                🛏️ <span className="font-bold text-emerald-800 dark:text-emerald-200">{occupancyStats.availableBeds}</span> beschikbare bedden
              </div>
            </div>
          </div>

          {/* Noord Building */}
          <div className="group relative bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/30 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl border border-blue-200/50 dark:border-blue-700/30 hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-600/10 dark:from-blue-400/10 dark:to-cyan-500/20"></div>
            <div className="relative p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-600 rounded-2xl shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate uppercase tracking-wide">🏢 Noord Gebouw</dt>
                    <dd className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {occupancyStats.noord.occupied} / {occupancyStats.noord.total}
                    </dd>
                    <dd className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      {occupancyStats.noord.rate.toFixed(1)}% bezetting
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-8 py-4 border-t border-blue-200/50 dark:border-blue-700/30">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                👩 <span className="font-bold text-blue-800 dark:text-blue-200">Meisjes:</span> {occupancyStats.girls.occupied}/{occupancyStats.girls.total} ({occupancyStats.girls.rate.toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Zuid Building */}
          <div className="group relative bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-950/30 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl border border-orange-200/50 dark:border-orange-700/30 hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-600/10 dark:from-orange-400/10 dark:to-amber-500/20"></div>
            <div className="relative p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 rounded-2xl shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-300 group-hover:scale-110">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate uppercase tracking-wide">🏢 Zuid Gebouw</dt>
                    <dd className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {occupancyStats.zuid.occupied} / {occupancyStats.zuid.total}
                    </dd>
                    <dd className="text-sm text-orange-600 dark:text-orange-400 font-semibold mt-1">
                      {occupancyStats.zuid.rate.toFixed(1)}% bezetting
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 px-8 py-4 border-t border-orange-200/50 dark:border-orange-700/30">
              <div className="text-sm text-orange-700 dark:text-orange-300 font-semibold">
                🧒 <span className="font-bold text-orange-800 dark:text-orange-200">Minors:</span> {occupancyStats.minors.occupied}/{occupancyStats.minors.total} ({occupancyStats.minors.rate.toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Total Residents */}
          <div className="group relative bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-950/30 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl border border-purple-200/50 dark:border-purple-700/30 hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/10 dark:from-purple-400/10 dark:to-indigo-500/20"></div>
            <div className="relative p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 rounded-2xl shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-purple-600 dark:text-purple-400 truncate uppercase tracking-wide">👥 Totaal Bewoners</dt>
                    <dd className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalResidents}</dd>
                    <dd className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
                      Geregistreerd in systeem
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 px-8 py-4 border-t border-purple-200/50 dark:border-purple-700/30">
              <div className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
                👥 Actieve bewoners in het systeem
              </div>
            </div>
          </div>
        </div>


        {/* Enhanced Quick Actions */}
        <div className="mb-12">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-blue-600/10 dark:from-violet-500/20 dark:to-blue-500/20 rounded-3xl"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/50 dark:border-gray-700/50">
              <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-600/50">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
                  ⚡ Snelle Acties
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Belangrijkste functies voor dagelijks beheer</p>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200/50 dark:border-blue-700/30 px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/10 group-hover:from-blue-500/10 group-hover:to-indigo-600/20 transition-all duration-300"></div>
                    <div className="relative flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">🆕 Bewoner Toevoegen</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Nieuwe bewoner registreren</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/dashboard/residents-grid'}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-950/50 border border-emerald-200/50 dark:border-emerald-700/30 px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10 group-hover:from-emerald-500/10 group-hover:to-green-600/20 transition-all duration-300"></div>
                    <div className="relative flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">📊 Bewoners Overzicht</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Visuele foto-overzicht</p>
                      </div>
                    </div>
                  </button>
                </div>
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
