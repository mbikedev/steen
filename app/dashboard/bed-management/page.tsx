'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, Bed, Users, Home, UserCheck, UserX } from 'lucide-react';
import { useData } from '../../../lib/DataContext';
import { formatDate } from '../../../lib/utils';
import { ALL_ROOMS, CAPACITY } from '../../../lib/bedConfig';

export default function BedManagementPage() {
  const { bedOccupancy, occupancyStats } = useData();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState<'all' | 'noord' | 'zuid'>('all');
  const [filterFloor, setFilterFloor] = useState<'all' | 'ground' | 'first'>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredRooms = bedOccupancy.filter(room => {
    const matchesSearch = 
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.residents.some(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBuilding = filterBuilding === 'all' || room.building === filterBuilding;
    
    const roomConfig = ALL_ROOMS.find(r => r.roomNumber === room.roomNumber);
    const matchesFloor = filterFloor === 'all' || roomConfig?.floor === filterFloor;
    
    return matchesSearch && matchesBuilding && matchesFloor;
  });

  const getOccupancyColor = (rate: number) => {
    if (rate === 0) return 'text-gray-500 bg-gray-100';
    if (rate < 50) return 'text-green-700 bg-green-100';
    if (rate < 80) return 'text-yellow-700 bg-yellow-100';
    if (rate < 100) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  const getRoomSpecialization = (roomNumber: string) => {
    const roomConfig = ALL_ROOMS.find(r => r.roomNumber === roomNumber);
    if (roomConfig?.specialization === 'girls') return 'Meisjes (1e verdieping)';
    if (roomConfig?.specialization === 'minors') return 'Minors <17 (1e verdieping)';
    return 'Algemeen (begane grond)';
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-title">Bedden Beheer</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Overzicht van alle kamers en bed bezetting in OOC Steenokkerzeel
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
              <div className="flex items-center">
                <Bed className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Totaal Bedden</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isClient ? occupancyStats.totalBeds : CAPACITY.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Bezet</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isClient ? occupancyStats.occupiedBeds : 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Beschikbaar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isClient ? occupancyStats.availableBeds : CAPACITY.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Bezettingsgraad</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isClient ? occupancyStats.occupancyRate.toFixed(1) : '0.0'}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op kamer of bewoner naam..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-black dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Building Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value as any)}
            >
              <option value="all">Alle gebouwen</option>
              <option value="noord">Noord</option>
              <option value="zuid">Zuid</option>
            </select>

            {/* Floor Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value as any)}
            >
              <option value="all">Alle verdiepingen</option>
              <option value="ground">Begane grond</option>
              <option value="first">Eerste verdieping</option>
            </select>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isClient && filteredRooms.map((room) => {
            const roomConfig = ALL_ROOMS.find(r => r.roomNumber === room.roomNumber);
            return (
              <div key={room.roomNumber} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700">
                {/* Room Header */}
                <div className={`px-4 py-3 ${room.building === 'noord' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Kamer {room.roomNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(room.occupancyRate)}`}>
                      {room.occupancyRate.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="px-4 py-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Bezetting:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{room.occupiedBeds} / {room.maxBeds} bedden</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Gebouw:</span>
                      <span className="font-medium capitalize text-gray-900 dark:text-gray-100">{room.building}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Type:</span>
                      <span className="font-medium text-xs text-gray-900 dark:text-gray-100">{getRoomSpecialization(room.roomNumber)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            room.occupancyRate === 0 ? 'bg-gray-300' :
                            room.occupancyRate < 50 ? 'bg-green-500' :
                            room.occupancyRate < 80 ? 'bg-yellow-500' :
                            room.occupancyRate < 100 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${room.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Residents List */}
                {room.residents.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Bewoners:</h4>
                    <div className="space-y-1">
                      {room.residents.map((resident) => (
                        <div key={resident.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-900 dark:text-gray-100">
                            Bed {resident.bedNumber}: {resident.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">#{resident.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty Room */}
                {room.residents.length === 0 && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Kamer is leeg</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Capaciteit Overzicht</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{CAPACITY.noord.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Noord Bedden</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                BG: {CAPACITY.noord.ground} | 1e: {CAPACITY.noord.first}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{CAPACITY.zuid.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Zuid Bedden</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                BG: {CAPACITY.zuid.ground} | 1e: {CAPACITY.zuid.first}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{CAPACITY.noord.first}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Meisjes Bedden</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">1e verdieping Noord</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{CAPACITY.zuid.first}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Minors Bedden</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">1e verdieping Zuid</div>
            </div>
          </div>
        </div>

        {/* Results Footer */}
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <div>
              Toont <span className="font-medium">{isClient ? filteredRooms.length : ALL_ROOMS.length}</span> van{' '}
              <span className="font-medium">{isClient ? bedOccupancy.length : ALL_ROOMS.length}</span> kamers
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Laatst bijgewerkt: {isClient ? new Date().toLocaleString('nl-NL') : '---'}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}