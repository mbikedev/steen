'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Home, Users, Bed, MapPin, Plus, Search } from 'lucide-react';

// Mock data based on the room PDFs
const mockRooms = [
  // Noord Building - Block 1
  { id: 1, number: '1.06', building: 'Noord', floor: 1, capacity: 4, occupied: 4, residents: ['Abdela Selah Ali', 'Adhanom Filmon Asfha', 'Kahsay Merhawi Mengstu', 'Kidanemariam Kibrom'] },
  { id: 2, number: '1.07', building: 'Noord', floor: 1, capacity: 4, occupied: 4, residents: ['Abraha Michael Kinfe', 'Amine Faniel Amanuel', 'Lemlem Abel Mikiele', 'Balde Mamadou Saliou'] },
  { id: 3, number: '1.08', building: 'Noord', floor: 1, capacity: 5, occupied: 5, residents: ['Gergish Faniel Habtay', 'Gebrehiwet Dinar', 'Gebremaraim Adhanom', 'Habtemichael Michaele', 'Tewelde Faniel'] },
  { id: 4, number: '1.09', building: 'Noord', floor: 1, capacity: 5, occupied: 5, residents: ['Tesfazghi Abel Kesete', 'Haile Amaniel Abraham', 'Haile Merhawi Weldu', 'Gebrezgabiher Thomas', 'Kidane Daniel Berhe'] },
  { id: 5, number: '1.14', building: 'Noord', floor: 1, capacity: 3, occupied: 0, residents: [] },
  { id: 6, number: '1.15', building: 'Noord', floor: 1, capacity: 3, occupied: 0, residents: [] },
  { id: 7, number: '1.16', building: 'Noord', floor: 1, capacity: 3, occupied: 2, residents: ['Mirfat Issa Stephen', 'Abunaja Wafa M I'] },
  { id: 8, number: '1.17', building: 'Noord', floor: 1, capacity: 3, occupied: 2, residents: ['Sahle Ruta Weldeslasie', 'Berhane Muzit Mehari'] },
  { id: 9, number: '1.18', building: 'Noord', floor: 1, capacity: 3, occupied: 1, residents: ['Teweldebrhan Saba Teklezghi'] },
  { id: 10, number: '1.19', building: 'Noord', floor: 1, capacity: 3, occupied: 2, residents: ['Kumbela Marta Da Silva', 'Diallo Aminata'] },
  
  // Zuid Building - Block 2
  { id: 11, number: '2.06', building: 'Zuid', floor: 2, capacity: 4, occupied: 3, residents: ['Gerebrhan Tesfamariam', 'Hétu Aliyou Nsangou', 'Mohammed Seid Abdelkhadr'] },
  { id: 12, number: '2.07', building: 'Zuid', floor: 2, capacity: 4, occupied: 2, residents: ['Girmay Filmon Tesfamichael', 'Tewelde Samsom Kifle'] },
  { id: 13, number: '2.08', building: 'Zuid', floor: 2, capacity: 5, occupied: 5, residents: ['Diomande Mory', 'Diallo Thierno Idrissa', 'Gerezgiher Samiel', 'Behbodi Bahram', 'Nazari Ahmad Zafar'] },
  { id: 14, number: '2.09', building: 'Zuid', floor: 2, capacity: 5, occupied: 5, residents: ['Cherif Mohamed', 'Conde Abdoul Karim', 'Baye Fasil Alebacho', 'Zundai Fazal Hadi', 'Mahtsen Ambesajer'] },
  { id: 15, number: '2.14', building: 'Zuid', floor: 2, capacity: 3, occupied: 3, residents: ['Araya Even Fsaha', 'Tesfay Tedros Dagenew', 'Suleman Omerdin'] },
  { id: 16, number: '2.15', building: 'Zuid', floor: 2, capacity: 3, occupied: 3, residents: ['Safi Ismail', 'Teklemichael Simon Luul', 'Jabarkhel Noor Agha'] },
  { id: 17, number: '2.16', building: 'Zuid', floor: 2, capacity: 3, occupied: 3, residents: ['Hakimi Shaheen', 'Hussaini Ali Reza', 'Zahir Said'] },
  { id: 18, number: '2.17', building: 'Zuid', floor: 2, capacity: 3, occupied: 3, residents: ['Tchawou Allan Pharel', 'Tesfaldet Ateshim', 'Ebrahemkhil Mirwais'] },
  { id: 19, number: '2.18', building: 'Zuid', floor: 2, capacity: 3, occupied: 2, residents: ['Gebremeskel Awet Weldrufael', 'Teklebrhan Mekaflti Bahta'] },
];

export default function AccommodationsPage() {
  const [rooms, setRooms] = useState(mockRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.residents.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBuilding = !filterBuilding || room.building === filterBuilding;
    
    const matchesAvailability = 
      !filterAvailability ||
      (filterAvailability === 'available' && room.occupied < room.capacity) ||
      (filterAvailability === 'full' && room.occupied === room.capacity);
    
    return matchesSearch && matchesBuilding && matchesAvailability;
  });

  const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupied, 0);
  const availableBeds = totalBeds - occupiedBeds;

  return (
    <DashboardLayout>
      <div className="p-6 bg-card min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground font-title">Accommodations Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage rooms and bed assignments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-foreground" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Rooms</p>
                <p className="text-xl font-semibold text-foreground">{rooms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Bed className="h-8 w-8 text-foreground" />
              <div className="ml-3">
                <p className="text-sm text-muted-foreground">Beds</p>
                <p className="text-xl font-semibold text-foreground">{totalBeds}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-300">Occupied</p>
                <p className="text-xl font-semibold text-foreground">{occupiedBeds}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-300">Available</p>
                <p className="text-xl font-semibold text-foreground">{availableBeds}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by room number or resident name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring bg-white text-black dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 bg-white text-foreground rounded-lg focus:ring-2 focus:ring-ring"
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
          >
            <option value="">All Buildings</option>
            <option value="Noord">Noord</option>
            <option value="Zuid">Zuid</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 bg-white text-foreground rounded-lg focus:ring-2 focus:ring-ring"
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
          >
            <option value="">All Rooms</option>
            <option value="available">Available</option>
            <option value="full">Full</option>
          </select>
          <button className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Room
          </button>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <div key={room.id} className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Room {room.number}</h3>
                  <p className="text-sm text-muted-foreground">Building - Floor {room.floor}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  room.occupied === room.capacity 
                    ? 'bg-foreground/10 text-foreground' 
                    : room.occupied > 0 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-foreground/10 text-foreground'
                }`}>
                  {room.occupied === room.capacity ? 'Full' : room.occupied > 0 ? 'Partial' : 'Empty'}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-300">Occupancy</span>
                  <span className="font-medium text-foreground">{room.occupied}/{room.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      room.occupied === room.capacity ? 'bg-foreground' : 'bg-foreground/70'
                    }`}
                    style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Residents:</p>
                {room.residents.length > 0 ? (
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {room.residents.slice(0, 3).map((resident, idx) => (
                      <li key={idx} className="truncate">• {resident}</li>
                    ))}
                    {room.residents.length > 3 && (
                      <li className="text-muted-foreground">+{room.residents.length - 3} more</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No residents</p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1 text-xs bg-accent text-accent-foreground rounded hover:bg-accent/80">
                  View Details
                </button>
                <button className="flex-1 px-3 py-1 text-xs bg-muted text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}