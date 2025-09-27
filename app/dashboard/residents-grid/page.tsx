"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useData } from "../../../lib/DataContext";
import { formatDate } from "../../../lib/utils";
import { residentPhotosApi } from "../../../lib/api-service";
import {
  Search,
  Users,
  Grid3X3,
  Camera,
  Upload,
  X,
  ZoomIn,
  Trash2,
} from "lucide-react";
import Image from "next/image";

// Type definition for resident data
type ResidentGrid = {
  id: string;
  badgeNumber: string;
  naam: string;
  voornaam: string;
  roomNumber?: string;
  photoUrl?: string;
  status?: "meerderjarig" | "leeftijdstwijfel" | "transfer" | "none";
  createdAt?: string;
  updatedAt?: string;
};

export default function ResidentsGridPage() {
  const { dataMatchIt, bewonerslijst } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [residents, setResidents] = useState<ResidentGrid[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<ResidentGrid[]>(
    [],
  );
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [residentPhotos, setResidentPhotos] = useState<{
    [key: string]: string;
  }>({});
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    resident: ResidentGrid;
  } | null>(null);
  const [, setLoadingPhotos] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert image to WebP format with compression
  const convertToWebP = (
    file: File,
    quality: number = 0.8,
    maxWidth: number = 800,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth = Math.min(img.width, maxWidth);
        let newHeight = newWidth / aspectRatio;

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".webp"),
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                },
              );
              resolve(webpFile);
            } else {
              reject(new Error("Failed to convert image to WebP"));
            }
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Load resident photos from database
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoadingPhotos(true);
        console.log("Loading photos from API...");
        const response = await residentPhotosApi.getAll();
        console.log("API response:", response);

        if (response.success && response.data) {
          console.log("Loaded photos from database:", response.data);
          setResidentPhotos(response.data);
        } else {
          console.warn("Photos API not available yet");
          console.log("API Response:", response);
          setResidentPhotos({});
        }
      } catch (error) {
        console.error("Error loading photos (caught exception):", error);
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
    dataMatchIt.forEach((resident) => {
      const badgeKey = String(resident.badge);
      if (!allResidents.has(badgeKey)) {
        allResidents.set(badgeKey, {
          id: String(resident.id),
          badgeNumber: String(resident.badge),
          naam: resident.lastName || "",
          voornaam: resident.firstName || "",
          roomNumber: resident.room || "",
          photoUrl: residentPhotos[String(resident.badge)] || undefined,
          status: "none",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Add residents from bewonerslijst
    bewonerslijst.forEach((resident) => {
      const badgeKey = String(resident.badge);
      if (!allResidents.has(badgeKey)) {
        allResidents.set(badgeKey, {
          id: String(resident.id),
          badgeNumber: String(resident.badge),
          naam: resident.lastName || "",
          voornaam: resident.firstName || "",
          roomNumber: resident.room || "",
          photoUrl: residentPhotos[String(resident.badge)] || undefined,
          status: resident.age && resident.age >= 18 ? "meerderjarig" : "none",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const uniqueResidents = Array.from(allResidents.values()).sort(
      (a, b) => parseInt(a.badgeNumber) - parseInt(b.badgeNumber),
    );

    setResidents(uniqueResidents);
    setFilteredResidents(uniqueResidents);
  }, [dataMatchIt, bewonerslijst, residentPhotos]); // Add residentPhotos as dependency

  // Filter residents based on search
  useEffect(() => {
    const filtered = residents.filter((resident) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        resident.badgeNumber.toLowerCase().includes(searchLower) ||
        resident.naam.toLowerCase().includes(searchLower) ||
        resident.voornaam.toLowerCase().includes(searchLower) ||
        (resident.roomNumber &&
          resident.roomNumber.toLowerCase().includes(searchLower))
      );
    });
    setFilteredResidents(filtered);
  }, [searchTerm, residents]);

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    _residentId: string,
  ) => {
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

    console.log(
      `✅ Processing file upload for badge ${uploadingFor}:`,
      file.name,
    );

    // Validate file type - accept all common image formats
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/svg+xml",
      "image/tiff",
      "image/avif",
      "image/heic",
      "image/heif",
    ];

    if (!file.type.startsWith("image/") && !allowedTypes.includes(file.type)) {
      alert(
        "Please select a valid image file (PNG, JPEG, WEBP, GIF, BMP, SVG, TIFF, AVIF, HEIC, HEIF, etc.)",
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    console.log(
      `Starting conversion to WebP for badge ${uploadingFor}:`,
      file.name,
      file.type,
      file.size,
    );

    try {
      // Convert image to optimized WebP format
      let processedFile = file;
      if (file.type !== "image/svg+xml") {
        // Don't convert SVG files
        try {
          processedFile = await convertToWebP(file, 0.85, 800);
          console.log(
            `✅ Converted to WebP: ${file.name} -> ${processedFile.name}`,
            `Size: ${file.size} -> ${processedFile.size} bytes (${Math.round((1 - processedFile.size / file.size) * 100)}% reduction)`,
          );
        } catch (conversionError) {
          console.warn(
            "WebP conversion failed, using original file:",
            conversionError,
          );
          processedFile = file;
        }
      }

      console.log(
        `Starting upload to database for badge ${uploadingFor}:`,
        processedFile.name,
        processedFile.type,
        processedFile.size,
      );
      const response = await residentPhotosApi.upload(
        parseInt(uploadingFor),
        processedFile,
      );

      if (response.success && response.data?.photoUrl) {
        console.log(
          `Image uploaded to database successfully for badge ${uploadingFor}:`,
          response.data.photoUrl,
        );

        // Update local state with the server URL
        setResidentPhotos((prev) => ({
          ...prev,
          [uploadingFor]: response.data.photoUrl,
        }));

        console.log("✅ Image uploaded to DATABASE successfully");
      } else {
        console.warn(`⚠️ Database not available for badge ${uploadingFor}`);
        alert("Photo upload failed: Database not available");
      }
    } catch (error) {
      console.error(`Database upload failed for badge ${uploadingFor}:`, error);
      alert(
        "Photo upload failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setUploadingFor(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
  const handlePhotoDelete = async (
    badgeNumber: string,
    residentName: string,
  ) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the photo for ${residentName}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      // Try to delete from database first
      const response = await residentPhotosApi.delete(parseInt(badgeNumber));

      if (response.success) {
        console.log(`✅ Photo deleted from database for badge ${badgeNumber}`);

        // Remove from local state
        setResidentPhotos((prev) => {
          const updated = { ...prev };
          delete updated[badgeNumber];
          return updated;
        });

        alert("✅ Photo deleted successfully!");
      } else {
        console.warn(`⚠️ Database deletion failed`);
        alert("⚠️ Photo deletion failed (database not available)");
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
      alert(
        "⚠️ Failed to delete photo: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const openLightbox = (
    imageUrl: string,
    resident: ResidentGrid,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent triggering upload when clicking on existing image
    setLightboxImage({ url: imageUrl, resident });
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  // Handle escape key to close lightbox or clear search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (lightboxImage) {
          // First priority: close lightbox
          closeLightbox();
          event.preventDefault();
          event.stopPropagation();
        } else if (searchTerm) {
          // Second priority: clear search if there's a search term
          setSearchTerm("");
          event.preventDefault();
          event.stopPropagation();
        }
        // If neither lightbox nor search, let the global handler handle it
        // but don't prevent default to allow normal ESC behavior
      }
    };

    document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [lightboxImage, searchTerm]);

  // Get status color and label
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "meerderjarig":
        return { color: "bg-green-500 text-white", label: "18+" };
      case "leeftijdstwijfel":
        return { color: "bg-yellow-500 text-white", label: "?" };
      case "transfer":
        return { color: "bg-blue-500 text-white", label: "T" };
      default:
        return null;
    }
  };

  // Calculate grid layout based on resident count
  const getGridClass = () => {
    const count = filteredResidents.length;
    // Base classes for screen display only
    if (count <= 12)
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
    else if (count <= 24)
      return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8";
    else if (count <= 48)
      return "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10";
    else
      return "grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14";
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide screen elements */
          .no-print,
          .print\:hidden {
            display: none !important;
          }

          /* Show print container */
          .print-container {
            display: block !important;
          }

          /* Page break control */
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }

          /* Page header - First page only */
          .print-page-header {
            text-align: center !important;
            margin: 0 0 10mm 0 !important;
            padding: 5mm 0 5mm 0 !important;
            border-bottom: 2px solid black !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            background: white !important;
          }

          .print-page-header-title {
            font-size: 20px !important;
            font-weight: bold !important;
            margin: 0 !important;
            color: black !important;
            letter-spacing: 1px !important;
            text-transform: uppercase !important;
            line-height: 1.4 !important;
          }

          .print-page-header-subtitle {
            font-size: 16px !important;
            font-weight: normal !important;
            margin: 0 !important;
            color: black !important;
            line-height: 1.3 !important;
          }

          .print-page-header-date {
            font-size: 14px !important;
            margin: 0 !important;
            color: black !important;
            font-weight: normal !important;
            line-height: 1.3 !important;
          }

          /* Grid for page 1: 3 rows x 4 columns */
          .print-grid-3x4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            grid-template-rows: repeat(3, 1fr) !important;
            gap: 5mm !important;
            height: 260mm !important;
          }

          /* Grid for pages 2-3: 4 rows x 4 columns */
          .print-grid-4x4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            grid-template-rows: repeat(4, 1fr) !important;
            gap: 5mm !important;
            height: 260mm !important;
          }

          /* Resident cards */
          .print-resident-card {
            border: 2px solid black !important;
            border-radius: 6px !important;
            overflow: hidden !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
          }

          /* Photo section */
          .print-photo-section {
            flex: 1 !important;
            position: relative !important;
            background: #f3f4f6 !important;
            overflow: hidden !important;
          }

          .print-photo-section img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            position: relative !important;
          }

          /* Info section */
          .print-info-section {
            padding: 3px !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            flex-shrink: 0 !important;
          }

          .print-badge-number {
            font-size: 11px !important;
            font-weight: bold !important;
            color: black !important;
            line-height: 1.1 !important;
          }

          .print-name {
            font-size: 9px !important;
            color: black !important;
            text-align: center !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            width: 100% !important;
            line-height: 1.1 !important;
            max-width: 90% !important;
          }
        }

        @media screen {
          .print-container {
            display: none !important;
          }
        }
      `}</style>
      <DashboardLayout>
        <div className="p-6 bg-background min-h-screen print:p-4 print:bg-white">
          {/* Screen Header - Hidden when printing */}
          <div className="mb-6 print:hidden">
            <div className="bg-card shadow-sm rounded-lg p-4 border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Grid3X3 className="h-7 w-7 text-primary" />
                    Bewoners Fotolijst
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visueel overzicht van alle {residents.length} bewoners
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    {formatDate(new Date())}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {filteredResidents.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Actief</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar and Upload Controls - Hidden when printing */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Zoek op badge, naam of kamer..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Upload Instructions */}
            <div className="bg-accent border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-accent-foreground">
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
            onChange={(e) => handleImageUpload(e, uploadingFor || "")}
            className="hidden"
          />

          {/* Residents Grid - Hidden when printing */}
          <div
            className={`grid ${getGridClass()} gap-3 auto-rows-fr print:hidden`}
          >
            {filteredResidents.map((resident, index) => {
              const statusBadge = getStatusBadge(resident.status);
              // Add page break after every 12th item (3 rows × 4 columns)
              const shouldPageBreak =
                (index + 1) % 12 === 0 &&
                index !== filteredResidents.length - 1;
              return (
                <div
                  key={resident.id}
                  className={`resident-card ${shouldPageBreak ? "print:page-break-after" : ""}`}
                  onClick={(e) => {
                    if (!resident.photoUrl) {
                      triggerImageUpload(resident.badgeNumber);
                    }
                  }}
                  style={{
                    backgroundColor: "white",
                    border: "2px solid black",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: resident.photoUrl ? "default" : "pointer",
                    position: "relative",
                    breakInside: "avoid",
                    display: "flex",
                    flexDirection: "column",
                    height: "250px"
                  }}
                >
                  {/* Room Number Badge */}
                  {resident.roomNumber && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        backgroundColor: "black",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        zIndex: 10,
                      }}
                    >
                      {resident.roomNumber}
                    </div>
                  )}

                  {/* Photo Section */}
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    backgroundColor: '#f3f4f6',
                    overflow: 'hidden',
                    aspectRatio: '3/4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {resident.photoUrl ? (
                      <Image
                        src={resident.photoUrl}
                        alt={`${resident.voornaam} ${resident.naam}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                        onClick={(e) => openLightbox(resident.photoUrl!, resident, e)}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f3f4f6',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                {/* Info Section */}
                <div className="info-section" style={{
                  padding: '4px',
                  backgroundColor: 'white',
                  flexShrink: 0
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'black',
                    textAlign: 'center',
                    marginBottom: '2px',
                    lineHeight: '1.2'
                  }}>
                    #{resident.badgeNumber}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'black',
                    textAlign: 'center',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2'
                  }}>
                    {resident.voornaam}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666666',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2'
                  }}>
                    {resident.naam}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State Cards for Remaining Capacity - Hidden when printing */}
          {Array.from({ length: Math.max(0, Math.min(70 - residents.length, 10)) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-muted rounded-lg border-2 border-dashed border-border opacity-30 print:hidden"
            >
              <div className="aspect-square flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="p-2 text-center">
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info - Hidden when printing */}
        <div className="mt-6 text-center text-sm text-muted-foreground print:hidden">
          <div>
            Tonen {filteredResidents.length} van {residents.length} bewoners •
            Capaciteit: {residents.length}/70 ({Math.round((residents.length / 70) * 100)}%)
          </div>
          <div className="mt-2 text-xs">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-accent text-accent-foreground">
              ⚠️ Opslag: localStorage (Database nog niet ingezet)
            </span>
          </div>
        </div>

        {/* Print Layout - Only visible when printing */}
        <div className="hidden print:block print-container">
          {(() => {
            // Use filteredResidents to ensure consistent data with screen view
            const residentsForPrint = filteredResidents.slice(0, 44);

            // Helper function to render resident card with room numbers for print
            const renderResidentCard = (resident: ResidentGrid, keyPrefix: string) => {
              console.log('Print resident:', resident.badgeNumber, 'Room:', resident.roomNumber);
              return (
              <div key={`${keyPrefix}-${resident.id}`} className="print-resident-card">
                {/* Room Number Badge - Top Left - Always show for debugging */}
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  zIndex: 10,
                  lineHeight: '1'
                }}>
                  {resident.roomNumber || 'NO_ROOM'}
                </div>
                <div className="print-photo-section">
                  {resident.photoUrl ? (
                    <Image
                      src={resident.photoUrl}
                      alt={`${resident.voornaam} ${resident.naam}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3f4f6',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#374151'
                    }}>
                      {resident.voornaam[0]?.toUpperCase()}{resident.naam[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="print-info-section">
                  <div className="print-badge-number">#{resident.badgeNumber}</div>
                  <div className="print-name">{resident.voornaam}</div>
                  <div className="print-name" style={{ color: '#666' }}>{resident.naam}</div>
                </div>
              </div>
            );
            };

            // Split residents into pages of 12 (3 rows x 4 columns)
            const pages = [];
            for (let i = 0; i < residentsForPrint.length; i += 12) {
              pages.push(residentsForPrint.slice(i, i + 12));
            }

            return (
              <>
                {pages.map((pageResidents, pageIndex) => (
                  <div
                    key={`page-${pageIndex}`}
                    className={
                      pageIndex < pages.length - 1 ? "print-page-break" : ""
                    }
                  >
                    <div className="print-grid-3x4">
                      {pageResidents.map((r) =>
                        renderResidentCard(r, `p${pageIndex}`),
                      )}
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

            {/* Empty State Cards for Remaining Capacity - Hidden when printing */}
            {Array.from({
              length: Math.max(0, Math.min(70 - residents.length, 10)),
            }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-muted rounded-lg border-2 border-dashed border-border opacity-30 print:hidden"
              >
                <div className="aspect-square flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="p-2 text-center">
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info - Hidden when printing */}
          <div className="mt-6 text-center text-sm text-muted-foreground print:hidden">
            <div>
              Tonen {filteredResidents.length} van {residents.length} bewoners •
              Capaciteit: {residents.length}/70 (
              {Math.round((residents.length / 70) * 100)}%)
            </div>
            <div className="mt-2 text-xs">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-accent text-accent-foreground">
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
                  className="absolute top-4 right-4 z-60 bg-card rounded-full p-2 shadow-lg hover:bg-accent transition-colors"
                >
                  <X className="h-6 w-6 text-muted-foreground" />
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
                      style={{ maxHeight: "80vh" }}
                    />
                  </div>

                  {/* Resident Info Below Image */}
                  <div className="bg-black bg-opacity-80 text-white rounded-lg p-4 backdrop-blur-sm text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      #{lightboxImage.resident.badgeNumber}
                    </div>
                    <div className="text-lg font-semibold">
                      {lightboxImage.resident.voornaam}{" "}
                      {lightboxImage.resident.naam}
                    </div>
                    {lightboxImage.resident.roomNumber && (
                      <div className="text-sm text-muted-foreground">
                        Room: {lightboxImage.resident.roomNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
      </DashboardLayout>
    </>
  );
}
