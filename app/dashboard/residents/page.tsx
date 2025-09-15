'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddResidentModal from '../../components/AddResidentModal';
import ViewResidentModal from '../../components/ViewResidentModal';
import EditResidentModal from '../../components/EditResidentModal';
import { Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';

// Mock data based on the PDF structure
const mockResidents = [
  { 
    id: 1, 
    badge: 25097, 
    name: 'Allan Pharel Tchawou',
    firstName: 'Allan Pharel', 
    lastName: 'Tchawou', 
    block: 'A',
    room: '2.17', 
    nationality: 'Kameroen', 
    ovNumber: 'OV001234',
    registerNumber: 'REG001',
    dateOfBirth: '1995-03-15',
    age: 29,
    gender: 'M', 
    referencePerson: 'John Doe',
    dateIn: '2024-01-15',
    daysOfStay: 223,
    status: 'active' 
  },
  { 
    id: 2, 
    badge: 25112, 
    name: 'Mohamed Cherif',
    firstName: 'Mohamed', 
    lastName: 'Cherif', 
    block: 'B',
    room: '2.09', 
    nationality: 'Guinea', 
    ovNumber: 'OV001235',
    registerNumber: 'REG002',
    dateOfBirth: '1992-07-22',
    age: 32,
    gender: 'M', 
    referencePerson: 'Jane Smith',
    dateIn: '2024-02-01',
    daysOfStay: 206,
    status: 'active' 
  },
  { 
    id: 3, 
    badge: 25113, 
    name: 'Abdoul Karim Conde',
    firstName: 'Abdoul Karim', 
    lastName: 'Conde', 
    block: 'B',
    room: '2.09', 
    nationality: 'Guinée', 
    ovNumber: 'OV001236',
    registerNumber: 'REG003',
    dateOfBirth: '1988-11-10',
    age: 35,
    gender: 'M', 
    referencePerson: 'Mike Johnson',
    dateIn: '2024-01-20',
    daysOfStay: 218,
    status: 'active' 
  },
];

export default function ResidentsPage() {
  const [residents, setResidents] = useState(mockResidents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  const filteredResidents = residents.filter(resident => {
    const matchesSearch = 
      resident.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.badge.toString().includes(searchTerm) ||
      resident.ovNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.registerNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoom = !filterRoom || resident.room === filterRoom;
    const matchesNationality = !filterNationality || resident.nationality === filterNationality;
    
    return matchesSearch && matchesRoom && matchesNationality;
  });

  const uniqueRooms = [...new Set(residents.map(r => r.room))].sort();
  const uniqueNationalities = [...new Set(residents.map(r => r.nationality))].sort();

  const handleAddResident = (newResident: any) => {
    setResidents([...residents, newResident]);
  };

  const handleViewResident = (resident: any) => {
    setSelectedResident(resident);
    setIsViewModalOpen(true);
  };

  const handleEditResident = (resident: any) => {
    setSelectedResident(resident);
    setIsEditModalOpen(true);
  };

  const handleUpdateResident = (updatedResident: any) => {
    setResidents(residents.map(r => r.id === updatedResident.id ? updatedResident : r));
  };

  const handleDeleteResident = (residentId: number) => {
    if (window.confirm('Are you sure you want to delete this resident?')) {
      setResidents(residents.filter(r => r.id !== residentId));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-card min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground font-title">Residents Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage asylum center residents and their information</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or badge number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-black dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 bg-white text-foreground rounded-lg focus:ring-2 focus:ring-ring"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              >
                <option value="">All Rooms</option>
                {uniqueRooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-gray-300 bg-white text-foreground rounded-lg focus:ring-2 focus:ring-ring"
                value={filterNationality}
                onChange={(e) => setFilterNationality(e.target.value)}
              >
                <option value="">All Nationalities</option>
                {uniqueNationalities.map(nat => (
                  <option key={nat} value={nat}>{nat}</option>
                ))}
              </select>

              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-foreground text-white rounded-lg hover:bg-foreground/90 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Resident
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card shadow-sm rounded-lg overflow-hidden border border-border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-teal-700 dark:bg-teal-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Badge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Block/Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Days of Stay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-600">
              {filteredResidents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {resident.badge}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {resident.name || `${resident.firstName} ${resident.lastName}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className="px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                      {resident.block}/{resident.room}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {resident.nationality}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {resident.age} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {resident.daysOfStay} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent text-accent-foreground">
                      {resident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewResident(resident)}
                        className="text-foreground hover:text-foreground/80"
                        title="View resident"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditResident(resident)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit resident"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteResident(resident.id)}
                        className="text-destructive hover:text-destructive/80"
                        title="Delete resident"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{filteredResidents.length}</span> of{' '}
            <span className="font-medium">{residents.length}</span> residents
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 bg-white text-foreground rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 bg-white text-foreground rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
              Next
            </button>
          </div>
        </div>

        <AddResidentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddResident}
        />

        <ViewResidentModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          resident={selectedResident}
        />

        <EditResidentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateResident}
          resident={selectedResident}
        />
      </div>
    </DashboardLayout>
  );
}