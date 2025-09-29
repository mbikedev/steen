'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BadgeGenerator from '../../components/BadgeGenerator';
import { useData } from '../../../lib/DataContext';
import { Search, Users, CreditCard } from 'lucide-react';
import { residentPhotosApi } from '../../../lib/api-service';

export default function BadgePrintingPage() {
  const { dataMatchIt, isLoading } = useData();
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [residentPhotos, setResidentPhotos] = useState<{ [key: string]: string }>({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('BadgePrintingPage - dataMatchIt:', dataMatchIt);
    console.log('BadgePrintingPage - isLoading:', isLoading);
    console.log('BadgePrintingPage - dataMatchIt length:', dataMatchIt?.length || 0);
  }, [dataMatchIt, isLoading]);

  // Load all resident photos on component mount
  useEffect(() => {
    const loadAllPhotos = async () => {
      setLoadingPhotos(true);
      try {
        const result = await residentPhotosApi.getAll();
        if (result.success && result.data) {
          setResidentPhotos(result.data);
          console.log('Loaded resident photos:', Object.keys(result.data).length);
        }
      } catch (error) {
        console.error('Error loading resident photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadAllPhotos();
  }, []);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    try {
      const birth = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (dataMatchIt && dataMatchIt.length > 0 && searchTerm) {
      const filtered = dataMatchIt.filter((resident: any) => {
        const firstName = resident.first_name || '';
        const lastName = resident.last_name || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
        const badge = resident.badge?.toString() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return (
          fullName.includes(searchLower) ||
          firstName.toLowerCase().includes(searchLower) ||
          lastName.toLowerCase().includes(searchLower) ||
          badge.includes(searchTerm)
        );
      });
      setFilteredResidents(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredResidents([]);
    }
  }, [searchTerm, dataMatchIt]);

  const handleResidentSelect = (resident: any) => {
    console.log('Selected resident data:', resident); // Debug log
    console.log('All resident fields:', Object.keys(resident)); // Show all available fields
    console.log('Specific fields check:', {
      ov_number: resident.ov_number,
      ovNumber: resident.ovNumber,
    });
    
    // Auto-populate badge data with correct field mappings from data match page
    const badgeNumber = resident.badge?.toString() || '';
    const firstName = resident.first_name || resident.firstName || '';
    const lastName = resident.last_name || resident.lastName || '';
    const dateOfBirth = resident.date_of_birth || resident.dateOfBirth || '';
    const nationality = resident.nationality || '';
    
    // Map OV Nummer column from data match page - check all possible field names
    const ovNumber = resident.ov_number || resident.ovNumber || resident.ov_nummer || resident['OV Nummer'] || '';
    
    // Auto-retrieve photo from administrative documents using badge number
    const photo = residentPhotos[badgeNumber] || residentPhotos[resident.id] || resident.photo || '';
    
    console.log('Auto-populated badge data:', {
      badgeNumber,
      firstName,
      lastName,
      dateOfBirth: formatDate(dateOfBirth),
      nationality,
      ovNumber,
      photo: photo ? 'Photo found' : 'No photo',
      age: calculateAge(dateOfBirth)
    });
    
    setSelectedResident({
      badgeNumber,
      firstName,
      lastName,
      dateOfBirth: formatDate(dateOfBirth),
      nationality,
      ovNumber,
      photo,
    });
    setSearchTerm('');
    setFilteredResidents([]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePhotoUpload = (residentId: string, photo: string) => {
    setResidentPhotos(prev => ({
      ...prev,
      [residentId]: photo,
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Bewonersgegevens laden...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 md:p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 sm:p-4 border dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                  Badge Printsysteem
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Genereer en print bewoner ID-badges voor Zebra ZC 350
                </p>
                {loadingPhotos && (
                  <p className="text-xs text-blue-600 mt-1">
                    Bezig met laden van bewonersfoto's uit administratieve documenten...
                  </p>
                )}
                {!loadingPhotos && Object.keys(residentPhotos).length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {Object.keys(residentPhotos).length} bewonersfoto's geladen
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 sm:p-4 border dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Selecteer Bewoner
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Zoek op naam of badgenummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
              />
              
              {/* Search Results Dropdown */}
              {filteredResidents.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                  {filteredResidents.map((resident) => (
                    <button
                      key={resident.id}
                      onClick={() => handleResidentSelect(resident)}
                      className="w-full px-3 py-2 sm:px-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-sm sm:text-base">
                        {resident.first_name} {resident.last_name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Badge: {resident.badge} | Kamer: {resident.room || 'N.v.t.'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Access - Recent Residents */}
            {dataMatchIt && dataMatchIt.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Snelle Toegang - Recente Bewoners
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {dataMatchIt.slice(0, 8).map((resident: any) => (
                  <button
                    key={resident.id}
                    onClick={() => handleResidentSelect(resident)}
                    className="px-2 py-2 sm:px-3 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-left"
                  >
                    <div className="font-medium truncate">
                      {resident.first_name} {resident.last_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Badge: {resident.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? 'Bewoners laden...' : 'Geen bewoners gevonden. Controleer de Data Match pagina om te zorgen dat gegevens zijn geladen.'}
            </div>
          )}
          </div>
        </div>

        {/* Badge Generator Section */}
        {selectedResident ? (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 sm:p-4 md:p-6 border dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
              Badge voor: {selectedResident.firstName} {selectedResident.lastName}
            </h2>
            <BadgeGenerator
              resident={selectedResident}
              onPhotoUpload={(photo) => 
                handlePhotoUpload(selectedResident.badgeNumber, photo)
              }
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 sm:p-12 border dark:border-gray-700 text-center">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Selecteer een bewoner uit de zoekopdracht hierboven om hun badge te genereren
            </p>
          </div>
        )}

        {/* Auto-Population Info */}
        <div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <h3 className="font-bold text-xs sm:text-sm mb-2">🤖 Geautomatiseerde Badge Generatie:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-1">Automatisch ingevuld vanaf Data Match pagina:</h4>
              <ul className="space-y-1 text-xs">
                <li>• OV Nummer → OVN field</li>
                <li>• Geboortedatum → Leeftijdberekening</li>
                <li>• Nationaliteit informatie</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Foto ophalen:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Automatisch laden van administratieve documenten</li>
                <li>• Koppeling op basis van badgenummer</li>
                <li>• Handmatige upload indien niet gevonden</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
          <h3 className="font-bold text-xs sm:text-sm mb-2">Printinstructies:</h3>
          <ol className="text-xs sm:text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>1. Selecteer een bewoner via de zoekfunctie of snelle toegang</li>
            <li>2. Badgegegevens worden automatisch ingevuld vanuit bestaande systemen</li>
            <li>3. Foto wordt automatisch opgehaald uit administratieve documenten</li>
            <li>4. Controleer of alle informatie correct is</li>
            <li>5. Klik op "Badge Printen" om naar Zebra ZC 350 te verzenden</li>
            <li>6. Zorg ervoor dat de printer blanco CR80 kaarten geladen heeft</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}