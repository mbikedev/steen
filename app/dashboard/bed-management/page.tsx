'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, Bed, Users, Home, UserCheck, UserX } from 'lucide-react';
import { useData } from "../../../lib/DataContext";
import { formatDate } from '../../../lib/utils';
import { ALL_ROOMS, CAPACITY } from '../../../lib/bedConfig';

export default function BedManagementPage() {
  const { bedOccupancy, occupancyStats, refreshAll, refreshEssential } = useData();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState<'all' | 'noord' | 'zuid'>('all');
  const [filterFloor, setFilterFloor] = useState<'all' | 'ground' | 'first'>('all');

  useEffect(() => {
    setIsClient(true);
    // Use refreshEssential to avoid overwhelming the connection
    if (refreshEssential) {
      console.log('🔄 Bed Management: Loading essential data (residents & rooms)');
      refreshEssential().catch(err => {
        console.error('❌ Bed Management: Essential data loading failed:', err);
      });
    }
  }, [refreshEssential]);

  const filteredRooms = bedOccupancy.filter(room => {
    const matchesSearch = 
      room.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.residents.some(r => r.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBuilding = filterBuilding === 'all' || room.building === filterBuilding;
    
    const roomConfig = ALL_ROOMS.find(r => r.roomNumber === room.roomNumber);
    const matchesFloor = filterFloor === 'all' || roomConfig?.floor === filterFloor;
    
    return matchesSearch && matchesBuilding && matchesFloor;
  });

  const getOccupancyColor = (rate: number) => {
    if (rate === 0) return 'text-muted-foreground bg-muted';
    if (rate < 50) return 'text-accent-foreground bg-accent';
    if (rate < 80) return 'text-yellow-700 bg-yellow-100';
    if (rate < 100) return 'text-accent-foreground bg-accent';
    return 'text-accent-foreground bg-accent';
  };

  const getRoomSpecialization = (roomNumber: string) => {
    const roomConfig = ALL_ROOMS.find(r => r.roomNumber === roomNumber);
    if (roomConfig?.specialization === 'girls') return 'Meisjes';
    if (roomConfig?.specialization === 'medical') return 'Medisch';
    if (roomConfig?.specialization === 'minors') return 'Minors <17';
    // Check floor and building for boys rooms
    if (roomConfig?.floor === 'ground') return 'Jongens (begane grond)';
    if (roomConfig?.floor === 'first' && roomConfig?.building === 'noord') return 'Jongens (1e verdieping)';
    if (roomConfig?.floor === 'first' && roomConfig?.building === 'zuid') return 'Jongens (1e verdieping)';
    return 'Algemeen';
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-background min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground font-title">Bedden Beheer</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Overzicht van alle kamers en bed bezetting in OOC Steenokkerzeel
            </p>
          </div>


          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-card rounded-lg shadow border border-border p-4">
              <div className="flex items-center">
                <Bed className="h-8 w-8 text-foreground mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Totaal Bedden</p>
                  <p className="text-2xl font-bold text-foreground">{isClient ? (occupancyStats?.totalBeds ?? 0) : (CAPACITY?.total ?? 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow border border-border p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-foreground mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Bezet</p>
                  <p className="text-2xl font-bold text-foreground">{isClient ? (occupancyStats?.occupiedBeds ?? 0) : 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow border border-border p-4">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-muted-foreground mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Beschikbaar</p>
                  <p className="text-2xl font-bold text-foreground">{isClient ? (occupancyStats?.availableBeds ?? 0) : (CAPACITY?.total ?? 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow border border-border p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Bezettingsgraad</p>
                  <p className="text-2xl font-bold text-foreground">{isClient ? ((occupancyStats?.occupancyRate ?? 0).toFixed(1)) : '0.0'}%</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Zoek op kamer of bewoner naam..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Building Filter */}
            <select
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value as any)}
            >
              <option value="all">Alle gebouwen</option>
              <option value="noord">Noord</option>
              <option value="zuid">Zuid</option>
            </select>

            {/* Floor Filter */}
            <select
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value as any)}
            >
              <option value="all">Alle verdiepingen</option>
              <option value="ground">Begane grond</option>
              <option value="first">Eerste verdieping</option>
            </select>
          </div>
        </div>

        {/* Room Sections - Separated by Building */}
        {isClient && (() => {
          // Separate rooms by building
          const noordRooms = filteredRooms.filter(room => room.building === 'noord');
          const zuidRooms = filteredRooms.filter(room => room.building === 'zuid');
          
          // Function to render room card
          const renderRoomCard = (room: any) => {
            const roomConfig = ALL_ROOMS.find(r => r.roomNumber === room.roomNumber);
            return (
              <div key={room.roomNumber} className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
                {/* Room Header */}
                <div className={`px-4 py-3 ${room.building === 'noord' ? 'bg-foreground' : 'bg-foreground'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-primary-foreground font-semibold flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Kamer {room.roomNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(room.occupancyRate || 0)}`}>
                      {(room.occupancyRate || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="px-4 py-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bezetting:</span>
                      <span className="font-medium text-foreground">{room.occupiedBeds} / {room.maxBeds} bedden</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gebouw:</span>
                      <span className="font-medium capitalize text-foreground">{room.building}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-xs text-foreground">{getRoomSpecialization(room.roomNumber)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (room.occupancyRate || 0) === 0 ? 'bg-muted-foreground/50' :
                            (room.occupancyRate || 0) < 50 ? 'bg-accent' :
                            (room.occupancyRate || 0) < 80 ? 'bg-yellow-500' :
                            (room.occupancyRate || 0) < 100 ? 'bg-accent' :
                            'bg-destructive'
                          }`}
                          style={{ width: `${room.occupancyRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Residents List */}
                {room.residents.length > 0 && (
                  <div className="px-4 py-3 bg-muted border-t border-border">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Bewoners:</h4>
                    <div className="space-y-1">
                      {room.residents.map((resident, index) => (
                        <div key={resident.id || `${room.roomNumber}-${index}`} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">
                            Bed {resident.bedNumber}: {resident.name}
                          </span>
                          <span className="text-muted-foreground">#{resident.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty Room */}
                {room.residents.length === 0 && (
                  <div className="px-4 py-3 bg-muted border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">Kamer is leeg</p>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="space-y-8">
              {/* Noord Section */}
              {noordRooms.length > 0 && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-foreground rounded"></div>
                      <h2 className="text-xl font-bold text-foreground">Noord Gebouw</h2>
                      <span className="text-sm text-muted-foreground">
                        ({noordRooms.length} kamer{noordRooms.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Kamernummers: 1.06 - 1.09 (Begane grond - Jongens), 1.14 - 1.19 (Eerste verdieping - Jongens)
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {noordRooms.map(renderRoomCard)}
                  </div>
                </div>
              )}

              {/* Zuid Section */}
              {zuidRooms.length > 0 && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-foreground rounded"></div>
                      <h2 className="text-xl font-bold text-foreground">Zuid Gebouw</h2>
                      <span className="text-sm text-muted-foreground">
                        ({zuidRooms.length} kamer{zuidRooms.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Kamernummers: 2.06 - 2.08 (Begane grond - Jongens), 2.14 - 2.19 (Eerste verdieping - Jongens + MED)
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {zuidRooms.map(renderRoomCard)}
                  </div>
                </div>
              )}

              {/* No rooms message */}
              {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Geen kamers gevonden</h3>
                    <p className="text-sm text-muted-foreground">Probeer je zoekfilters aan te passen</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Enhanced Summary Footer with Building-specific Stats */}
        <div className="mt-8 space-y-6">
          {/* Building-specific Statistics */}
          {isClient && (() => {
            const noordRooms = bedOccupancy.filter(room => room.building === 'noord');
            const zuidRooms = bedOccupancy.filter(room => room.building === 'zuid');
            
            const noordStats = {
              totalBeds: noordRooms.reduce((sum, room) => sum + room.maxBeds, 0),
              occupiedBeds: noordRooms.reduce((sum, room) => sum + room.occupiedBeds, 0),
              availableBeds: noordRooms.reduce((sum, room) => sum + (room.maxBeds - room.occupiedBeds), 0),
              occupancyRate: noordRooms.length > 0 ? 
                (noordRooms.reduce((sum, room) => sum + room.occupiedBeds, 0) / 
                 noordRooms.reduce((sum, room) => sum + room.maxBeds, 0)) * 100 : 0
            };
            
            const zuidStats = {
              totalBeds: zuidRooms.reduce((sum, room) => sum + room.maxBeds, 0),
              occupiedBeds: zuidRooms.reduce((sum, room) => sum + room.occupiedBeds, 0),
              availableBeds: zuidRooms.reduce((sum, room) => sum + (room.maxBeds - room.occupiedBeds), 0),
              occupancyRate: zuidRooms.length > 0 ? 
                (zuidRooms.reduce((sum, room) => sum + room.occupiedBeds, 0) / 
                 zuidRooms.reduce((sum, room) => sum + room.maxBeds, 0)) * 100 : 0
            };

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Noord Building Stats */}
                <div className="bg-card rounded-lg shadow border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-foreground rounded"></div>
                    <h3 className="text-lg font-semibold text-foreground">Noord Gebouw</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{noordStats.totalBeds}</div>
                      <div className="text-sm text-muted-foreground">Totaal Bedden</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{noordStats.occupiedBeds}</div>
                      <div className="text-sm text-muted-foreground">Bezet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{noordStats.availableBeds}</div>
                      <div className="text-sm text-muted-foreground">Beschikbaar</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{noordStats.occupancyRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Bezettingsgraad</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Kamers: 1.06-1.09 (BG - Jongens), 1.14-1.19 (1e - Jongens)
                  </div>
                </div>

                {/* Zuid Building Stats */}
                <div className="bg-card rounded-lg shadow border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-foreground rounded"></div>
                    <h3 className="text-lg font-semibold text-foreground">Zuid Gebouw</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{zuidStats.totalBeds}</div>
                      <div className="text-sm text-muted-foreground">Totaal Bedden</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{zuidStats.occupiedBeds}</div>
                      <div className="text-sm text-muted-foreground">Bezet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{zuidStats.availableBeds}</div>
                      <div className="text-sm text-muted-foreground">Beschikbaar</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{zuidStats.occupancyRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Bezettingsgraad</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Kamers: 2.06-2.08 (BG - Jongens), 2.14-2.18 (1e - Jongens), 2.19 (1e - MED)
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Overall Capacity Summary */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Totaal Capaciteit Overzicht</h3>
            
            {/* Building Capacities */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{CAPACITY?.noord?.total ?? 0}</div>
                <div className="text-sm text-muted-foreground">Noord Capaciteit</div>
                <div className="text-xs text-muted-foreground">
                  BG: {CAPACITY?.noord?.ground ?? 0} | 1e: {CAPACITY?.noord?.first ?? 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{CAPACITY?.zuid?.total ?? 0}</div>
                <div className="text-sm text-muted-foreground">Zuid Capaciteit</div>
                <div className="text-xs text-muted-foreground">
                  BG: {CAPACITY?.zuid?.ground ?? 0} | 1e: {CAPACITY?.zuid?.first ?? 0}
                </div>
              </div>
            </div>
            
            {/* Gender and Medical Distribution */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{CAPACITY?.boys ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Jongens</div>
                  <div className="text-xs text-muted-foreground">Noord + Zuid (BG & 1e)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{CAPACITY?.girls ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Meisjes</div>
                  <div className="text-xs text-muted-foreground">Zuid 1e verdieping</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{CAPACITY?.medical ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Medische bedden</div>
                  <div className="text-xs text-muted-foreground">Kamer 2.19</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{CAPACITY?.total ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Totale Capaciteit</div>
                  <div className="text-xs text-muted-foreground">Alle bedden</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Footer */}
        <div className="mt-4 text-sm text-muted-foreground">
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
