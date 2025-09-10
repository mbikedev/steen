'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useData } from '../../../lib/DataContext';
import { residentPhotosApi } from '../../../lib/api-service';
import { Search, Users, Grid3X3, Camera, Upload, X, ZoomIn, Trash2 } from 'lucide-react';

// Type definition for resident data
type ResidentGrid = {
  id: string;
  badgeNumber: string;
  naam: string;
  voornaam: string;
  roomNumber?: string;
  photoUrl?: string;
  status?: 'meerderjarig' | 'leeftijdstwijfel' | 'transfer' | 'none';
  createdAt?: string;
  updatedAt?: string;
};

export default function ResidentsGridPage() {
  const { dataMatchIt, bewonerslijst } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [residents, setResidents] = useState<ResidentGrid[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<ResidentGrid[]>([]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [residentPhotos, setResidentPhotos] = useState<{[key: string]: string}>({});
  const [lightboxImage, setLightboxImage] = useState<{url: string, resident: ResidentGrid} | null>(null);
  const [, setLoadingPhotos] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resident photos from database
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoadingPhotos(true);
        console.log('Loading photos from API...');
        const response = await residentPhotosApi.getAll();
        console.log('API response:', response);
        
        if (response.success && response.data) {
          console.log('Loaded photos from database:', response.data);
          setResidentPhotos(response.data);
        } else {
          console.warn('Photos API not available yet');
          console.log('API Response:', response);
          setResidentPhotos({});
        }
      } catch (error) {
        console.error('Error loading photos (caught exception):', error);
      } finally {
        setLoadingPhotos(false);
      }
    };
    
    loadPhotos();
  }, []);

  // Combine and transform data from both sources
  useEffect(() => {
    const allResidents = new Map<string, ResidentGrid>();
    
    // Add residents from dataMatchIt
    dataMatchIt.forEach(resident => {
      const badgeKey = String(resident.badge);
      if (!allResidents.has(badgeKey)) {
        allResidents.set(badgeKey, {
          id: String(resident.id),
          badgeNumber: String(resident.badge),
          naam: resident.lastName || '',
          voornaam: resident.firstName || '',
          roomNumber: resident.room || '',
          photoUrl: residentPhotos[String(resident.badge)] || undefined,
          status: 'none',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    // Add residents from bewonerslijst
    bewonerslijst.forEach(resident => {
      const badgeKey = String(resident.badge);
      if (!allResidents.has(badgeKey)) {
        allResidents.set(badgeKey, {
          id: String(resident.id),
          badgeNumber: String(resident.badge),
          naam: resident.lastName || '',
          voornaam: resident.firstName || '',
          roomNumber: resident.room || '',
          photoUrl: residentPhotos[String(resident.badge)] || undefined,
          status: resident.age && resident.age >= 18 ? 'meerderjarig' : 'none',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    const uniqueResidents = Array.from(allResidents.values())
      .sort((a, b) => parseInt(a.badgeNumber) - parseInt(b.badgeNumber));
    
    setResidents(uniqueResidents);
    setFilteredResidents(uniqueResidents);
  }, [dataMatchIt, bewonerslijst, residentPhotos]); // Add residentPhotos as dependency

  // Filter residents based on search
  useEffect(() => {
    const filtered = residents.filter(resident => {
      const searchLower = searchTerm.toLowerCase();
      return (
        resident.badgeNumber.toLowerCase().includes(searchLower) ||
        resident.naam.toLowerCase().includes(searchLower) ||
        resident.voornaam.toLowerCase().includes(searchLower) ||
        (resident.roomNumber && resident.roomNumber.toLowerCase().includes(searchLower))
      );
    });
    setFilteredResidents(filtered);
  }, [searchTerm, residents]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, _residentId: string) => {
    console.log(`📁 File selected event triggered`);
    console.log(`📄 Files:`, event.target.files);
    console.log(`🎯 uploadingFor state:`, uploadingFor);
    
    const file = event.target.files?.[0];
    if (!file) {
      console.warn(`❌ No file selected`);
      return;
    }
    
    if (!uploadingFor) {
      console.warn(`❌ No uploadingFor state set`);
      return;
    }
    
    console.log(`✅ Processing file upload for badge ${uploadingFor}:`, file.name);

    // Validate file type - accept all common image formats
    const allowedTypes = [
      'image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 
      'image/webp', 'image/svg+xml', 'image/tiff', 'image/avif', 
      'image/heic', 'image/heif'
    ];
    
    if (!file.type.startsWith('image/') && !allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPEG, WEBP, GIF, BMP, SVG, TIFF, AVIF, HEIC, HEIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    console.log(`Starting upload to database for badge ${uploadingFor}:`, file.name, file.type, file.size);
    
    try {
      const response = await residentPhotosApi.upload(parseInt(uploadingFor), file);
      
      if (response.success && response.data?.photoUrl) {
        console.log(`Image uploaded to database successfully for badge ${uploadingFor}:`, response.data.photoUrl);
        
        // Update local state with the server URL
        setResidentPhotos(prev => ({
          ...prev,
          [uploadingFor]: response.data.photoUrl
        }));
        
        console.log('✅ Image uploaded to DATABASE successfully');
      } else {
        console.warn(`⚠️ Database not available for badge ${uploadingFor}`);
        alert('Photo upload failed: Database not available');
      }
    } catch (error) {
      console.error(`Database upload failed for badge ${uploadingFor}:`, error);
      alert('Photo upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingFor(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImageUpload = (residentBadge: string) => {
    console.log(`🚀 Triggering image upload for badge: ${residentBadge}`);
    console.log(`📷 File input ref:`, fileInputRef.current);
    
    setUploadingFor(residentBadge);
    console.log(`📋 Current resident photos:`, Object.keys(residentPhotos));
    
    // Small delay to ensure state is set before clicking
    setTimeout(() => {
      if (fileInputRef.current) {
        console.log(`🖱️ Clicking file input for badge ${residentBadge}`);
        fileInputRef.current.click();
      } else {
        console.error(`❌ File input ref is null!`);
      }
    }, 10);
  };

  // Handle photo deletion
  const handlePhotoDelete = async (badgeNumber: string, residentName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the photo for ${residentName}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      // Try to delete from database first
      const response = await residentPhotosApi.delete(parseInt(badgeNumber));
      
      if (response.success) {
        console.log(`✅ Photo deleted from database for badge ${badgeNumber}`);
        
        // Remove from local state
        setResidentPhotos(prev => {
          const updated = { ...prev };
          delete updated[badgeNumber];
          return updated;
        });
        
        alert('✅ Photo deleted successfully!');
      } else {
        console.warn(`⚠️ Database deletion failed`);
        alert('⚠️ Photo deletion failed (database not available)');
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('⚠️ Failed to delete photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const openLightbox = (imageUrl: string, resident: ResidentGrid, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering upload when clicking on existing image
    setLightboxImage({ url: imageUrl, resident });
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  // Handle escape key to close lightbox or clear search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightboxImage) {
          // First priority: close lightbox
          closeLightbox();
          event.preventDefault();
          event.stopPropagation();
        } else if (searchTerm) {
          // Second priority: clear search if there's a search term
          setSearchTerm('');
          event.preventDefault();
          event.stopPropagation();
        }
        // If neither lightbox nor search, let the global handler handle it
        // but don't prevent default to allow normal ESC behavior
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [lightboxImage, searchTerm]);

  // Get status color and label
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'meerderjarig':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: '18+' };
      case 'leeftijdstwijfel':
        return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: '?' };
      case 'transfer':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'T' };
      default:
        return null;
    }
  };

  // Calculate grid layout based on resident count
  const getGridClass = () => {
    const count = filteredResidents.length;
    // Base classes for screen display
    let screenClasses = '';
    if (count <= 12) screenClasses = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
    else if (count <= 24) screenClasses = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
    else if (count <= 48) screenClasses = 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
    else screenClasses = 'grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14';
    
    // Add print-specific class for 4 columns
    return `${screenClasses} print:grid-cols-4`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 min-h-screen print:p-4 print:bg-white">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              OOC STEENOKKERZEEL
            </h1>
            <h2 className="text-xl text-gray-700 mb-2">
              Bezetting ({filteredResidents.length})
            </h2>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('nl-BE', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Screen Header - Hidden when printing */}
        <div className="mb-6 print:hidden">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Grid3X3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  Bewoners Fotolijst
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Visueel overzicht van alle {residents.length} bewoners
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  {new Date().toLocaleDateString('nl-BE', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredResidents.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Actief</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar and Upload Controls - Hidden when printing */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op badge, naam of kamer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Upload Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Camera className="h-4 w-4" />
              <span>Klik op een bewoner kaart om een foto te uploaden</span>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          id="resident-photo-upload"
          name="resident-photo-upload"
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, uploadingFor || '')}
          className="hidden"
        />

        {/* Residents Grid */}
        <div className={`grid ${getGridClass()} gap-3 auto-rows-fr print:gap-2 print:mb-4`}>
          {filteredResidents.map((resident, index) => {
            const statusBadge = getStatusBadge(resident.status);
            // Add page break after every 12th item (3 rows × 4 columns)
            const shouldPageBreak = (index + 1) % 12 === 0 && index !== filteredResidents.length - 1;
            return (
              <div
                key={resident.id}
                onClick={(e) => {
                  console.log(`🖱️ Resident card clicked for badge ${resident.badgeNumber}`);
                  console.log(`📸 Has photo:`, !!resident.photoUrl);
                  console.log(`🎯 Click target:`, e.target);
                  
                  // Only trigger upload if there's no photo and we're not clicking on an image
                  if (!resident.photoUrl) {
                    console.log(`▶️ Triggering upload for badge ${resident.badgeNumber}`);
                    triggerImageUpload(resident.badgeNumber);
                  } else {
                    console.log(`⏹️ Photo exists, not triggering upload`);
                  }
                }}
                className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden transform hover:scale-105 ${!resident.photoUrl ? 'cursor-pointer' : 'cursor-default'} ${shouldPageBreak ? 'print:break-after-page' : ''}`}
              >
                {/* Status Badge */}
                {statusBadge && (
                  <div className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${statusBadge.color} z-10`}>
                    {statusBadge.label}
                  </div>
                )}

                {/* Room Number Badge */}
                {resident.roomNumber && (
                  <div className="absolute top-1 left-1 bg-gray-900 bg-opacity-75 text-white px-1.5 py-0.5 rounded text-xs font-medium z-10">
                    {resident.roomNumber}
                  </div>
                )}

                {/* Photo/Avatar */}
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center relative">
                  {resident.photoUrl ? (
                    <div className="w-full h-full relative group/image">
                      <img 
                        src={resident.photoUrl} 
                        alt={`${resident.voornaam} ${resident.naam}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={(e) => openLightbox(resident.photoUrl!, resident, e)}
                        onLoad={() => console.log(`Image loaded for badge ${resident.badgeNumber}`)}
                        onError={() => console.error(`Image failed to load for badge ${resident.badgeNumber}`)}
                      />
                      {/* Image overlay with zoom and delete buttons */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-30 transition-all duration-200 flex items-center justify-center cursor-pointer"
                        onClick={(e) => openLightbox(resident.photoUrl!, resident, e)}
                      >
                        <div className="transform scale-0 group-hover/image:scale-100 transition-transform duration-200 flex gap-2">
                          {/* Zoom button */}
                          <div 
                            className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                            onClick={(e) => openLightbox(resident.photoUrl!, resident, e)}
                          >
                            <ZoomIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          
                          {/* Delete button */}
                          <div 
                            className="bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-lg hover:scale-110 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening lightbox
                              handlePhotoDelete(resident.badgeNumber, `${resident.voornaam} ${resident.naam}`);
                            }}
                            title={`Delete photo for ${resident.voornaam} ${resident.naam}`}
                          >
                            <Trash2 className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-2">
                      <div className="text-3xl font-bold text-gray-600 dark:text-gray-300 mb-1">
                        {resident.voornaam[0]?.toUpperCase()}{resident.naam[0]?.toUpperCase()}
                      </div>
                      <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto" />
                    </div>
                  )}
                  
                  {/* Upload Overlay - only show when no image */}
                  {!resident.photoUrl && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                          <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-2">
                  {/* Badge Number */}
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 text-center mb-1">
                    #{resident.badgeNumber}
                  </div>
                  
                  {/* Name */}
                  <div className="text-xs text-gray-900 dark:text-gray-100 text-center font-medium truncate">
                    {resident.voornaam}
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 text-center truncate">
                    {resident.naam}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 pointer-events-none" />
              </div>
            );
          })}

          {/* Empty State Cards for Remaining Capacity */}
          {Array.from({ length: Math.max(0, Math.min(70 - residents.length, 10)) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 opacity-30"
            >
              <div className="aspect-square flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-600" />
              </div>
              <div className="p-2 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-600">Available</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info - Hidden when printing */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 print:hidden">
          <div>
            Tonen {filteredResidents.length} van {residents.length} bewoners • 
            Capaciteit: {residents.length}/70 ({Math.round((residents.length / 70) * 100)}%)
          </div>
          <div className="mt-2 text-xs">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              ⚠️ Opslag: localStorage (Database nog niet ingezet)
            </span>
          </div>
        </div>


        {/* Lightbox Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-90"
              onClick={closeLightbox}
            />
            
            {/* Modal Content */}
            <div className="relative z-50 w-full h-full flex items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                className="absolute top-4 right-4 z-60 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Instructions */}
              <div className="absolute top-4 left-4 z-60 bg-black bg-opacity-75 text-white rounded-lg p-3 text-sm backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  Press ESC or click outside to close
                </div>
              </div>

              {/* Image and Info Container */}
              <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center p-4">
                {/* Image */}
                <div className="flex-1 flex items-center justify-center mb-2">
                  <img
                    src={lightboxImage.url}
                    alt={`${lightboxImage.resident.voornaam} ${lightboxImage.resident.naam}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* Resident Info Below Image */}
                <div className="bg-black bg-opacity-80 text-white rounded-lg p-4 backdrop-blur-sm text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    #{lightboxImage.resident.badgeNumber}
                  </div>
                  <div className="text-lg font-semibold">
                    {lightboxImage.resident.voornaam} {lightboxImage.resident.naam}
                  </div>
                  {lightboxImage.resident.roomNumber && (
                    <div className="text-sm text-gray-300">
                      Room: {lightboxImage.resident.roomNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}