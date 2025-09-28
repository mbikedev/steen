"use client";

import React, { useState, useEffect } from "react";
import { useData } from "@/lib/DataContext";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { Printer, Search, User, X } from "lucide-react";
import { residentPhotosApi } from "@/lib/api-service";
import { apiService } from "@/lib/api-service";

export default function PermissionPapersPage() {
  const { residents } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [showIndividualPrint, setShowIndividualPrint] = useState(false);
  const [residentPhotos, setResidentPhotos] = useState<{
    [key: string]: string;
  }>({});
  const [bijlageDocuments, setBijlageDocuments] = useState<{
    [key: number]: any[];
  }>({});
  const [loadingPdfs, setLoadingPdfs] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoadingForPrint, setIsLoadingForPrint] = useState(false);

  const handlePrint = () => {
    handlePrintWithDocuments();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatBirthDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Load resident photos from database (same as residents-grid page)
  useEffect(() => {
    const loadPhotos = async () => {
      try {
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
        setResidentPhotos({});
      }
    };
    loadPhotos();
  }, []);

  // Load bijlage documents only when needed (lazy loading)
  const loadBijlageDocumentsForResident = async (residentId: number) => {
    if (bijlageDocuments[residentId]) {
      return; // Already loaded
    }

    try {
      console.log(`Loading bijlage documents for resident ${residentId}...`);
      const documents = await apiService.getAdministrativeDocuments(residentId);

      // Filter for bijlage documents
      const bijlageDocs = documents.filter((doc: any) => {
        if (!doc.file_name) return false;
        const fileName = doc.file_name.toLowerCase();
        const baseName = fileName.replace(/\.[^/.]+$/, "");

        const matches =
          fileName.includes("bijlage") ||
          fileName.includes("bijl") ||
          baseName === "bijlage" ||
          baseName === "bijl" ||
          fileName.startsWith("bijlage") ||
          fileName.startsWith("bijl");

        if (matches) {
          console.log(`Found bijlage document: ${doc.file_name} for resident ${residentId}`);
        }
        return matches;
      });

      console.log(`Loaded ${bijlageDocs.length} bijlage documents for resident ${residentId}`);

      setBijlageDocuments(prev => ({
        ...prev,
        [residentId]: bijlageDocs
      }));

      // Initialize loading state for PDF
      const hasPdfDoc = bijlageDocs.some((doc: any) =>
        doc.file_name?.toLowerCase().endsWith('.pdf')
      );
      if (hasPdfDoc || bijlageDocs.length > 0) {
        const pdfKey = `${residentId}-bijlage`;
        setLoadingPdfs(prev => ({
          ...prev,
          [pdfKey]: true
        }));
      }
    } catch (error) {
      console.error(`Error loading bijlage documents for resident ${residentId}:`, error);
      setBijlageDocuments(prev => ({
        ...prev,
        [residentId]: []
      }));
    }
  };

  // Load bijlage documents on demand - only when actually needed
  useEffect(() => {
    // Only load documents when we're about to print or when viewing individual
    if (selectedResident) {
      // When viewing individual resident, load only their documents
      loadBijlageDocumentsForResident(selectedResident.id);
    }
    // Don't load all documents automatically - only when print is clicked
  }, [selectedResident]);

  // Function to load all documents when print button is clicked
  const handlePrintWithDocuments = async () => {
    setIsLoadingForPrint(true);
    try {
      console.log("Loading bijlage documents for all residents before printing...");

      // Load documents for all residents before printing
      const loadPromises = residents.map(resident =>
        loadBijlageDocumentsForResident(resident.id)
      );
      await Promise.all(loadPromises);

      console.log("All documents loaded, waiting for PDFs to fully load...");

      // Wait for all PDFs to finish loading
      const waitForPdfsToLoad = async () => {
        const pdfLoadPromises = residents.map(resident => {
          return new Promise<void>((resolve) => {
            const docs = bijlageDocuments[resident.id];
            if (!docs || docs.length === 0) {
              resolve();
              return;
            }

            const pdfKey = `${resident.id}-bijlage`;

            // Check if PDF is already loaded
            if (loadingPdfs[pdfKey] === false) {
              resolve();
              return;
            }

            // Wait for PDF to load with timeout
            const checkLoaded = () => {
              if (loadingPdfs[pdfKey] === false) {
                resolve();
              } else {
                setTimeout(checkLoaded, 100);
              }
            };

            // Start checking, but timeout after 5 seconds
            setTimeout(() => resolve(), 5000);
            checkLoaded();
          });
        });

        await Promise.all(pdfLoadPromises);
      };

      await waitForPdfsToLoad();

      console.log("All PDFs loaded, initiating print...");

      // Longer delay to ensure iframes are fully rendered for print
      setTimeout(() => {
        setIsLoadingForPrint(false);

        // Trigger a refresh of iframe content before printing
        const iframes = document.querySelectorAll('.pdf-iframe');
        iframes.forEach((iframe: any) => {
          const src = iframe.src;
          iframe.src = '';
          setTimeout(() => {
            iframe.src = src;
          }, 50);
        });

        // Wait for iframe refresh and then print
        setTimeout(() => {
          window.print();
        }, 1000);
      }, 500);
    } catch (error) {
      console.error("Error loading documents for print:", error);
      // Print anyway even if some documents fail to load
      setTimeout(() => {
        setIsLoadingForPrint(false);
        window.print();
      }, 100);
    }
  };

  // Preload PDFs for better performance
  useEffect(() => {
    try {
      Object.values(bijlageDocuments).flat().forEach((doc: any) => {
        if (doc.file_name?.toLowerCase().endsWith('.pdf') && doc.file_path) {
          try {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = doc.file_path;
            document.head.appendChild(link);
          } catch (linkError) {
            console.warn(`Failed to preload PDF: ${doc.file_path}`, linkError);
          }
        }
      });
    } catch (error) {
      console.warn("Error in PDF preloading:", error);
    }
  }, [bijlageDocuments]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const filtered = residents.filter((resident) => {
      const searchLower = searchTerm.toLowerCase();
      const badge = String(resident.badge || "").toLowerCase();
      const firstName = (resident.first_name || "").toLowerCase();
      const lastName = (resident.last_name || "").toLowerCase();

      return (
        badge.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        `${firstName} ${lastName}`.includes(searchLower)
      );
    });

    setSearchResults(filtered);
  }, [searchTerm, residents]);

  const handleResidentSelect = (resident: any) => {
    setSelectedResident(resident);
    setShowIndividualPrint(true);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleCloseIndividual = () => {
    setSelectedResident(null);
    setShowIndividualPrint(false);
  };

  const handlePrintIndividual = () => {
    try {
      // Add small delay to ensure DOM is ready
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  return (
    <>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="print:hidden mb-8">
            <div className="mb-6">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Permissiebladeren
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                  Voer het badgenummer of naam in om het Permissie Blad te genereren
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Zoek op badge nummer of naam..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                  <ul className="max-h-60 overflow-auto py-1">
                    {searchResults.map((resident) => (
                      <li key={resident.id}>
                        <button
                          onClick={() => handleResidentSelect(resident)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {resident.first_name} {resident.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Badge: {resident.badge}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Individual Resident View */}
            {showIndividualPrint && selectedResident && (
              <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {(() => {
                        // Try different key formats for badge number (same as permission paper)
                        const badgeStr = String(selectedResident.badge);
                        const badgeNum = Number(selectedResident.badge);
                        const photo =
                          residentPhotos[badgeStr] ||
                          residentPhotos[badgeNum] ||
                          residentPhotos[selectedResident.badge] ||
                          residentPhotos[selectedResident.id];

                        if (photo) {
                          return (
                            <img
                              src={photo}
                              alt={`${selectedResident.first_name} ${selectedResident.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          );
                        }

                        return <User className="w-8 h-8 text-gray-400" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedResident.first_name}{" "}
                        {selectedResident.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Badge: #{selectedResident.badge} | Kamer:{" "}
                        {selectedResident.room || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintIndividual}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print Permissieblad
                    </button>
                    <button
                      onClick={handleCloseIndividual}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print Layout */}
        <div className="hidden print:block print-content">
          {(showIndividualPrint && selectedResident
            ? [selectedResident]
            : residents
          ).map((resident, index) => (
            <React.Fragment key={resident.id}>
              {/* Permission Paper - Modern Styled */}
              <div className="print-page">
                {/* Border frame container to match second page */}
                <div
                  className="absolute inset-0 border-frame"
                  style={{
                    border: '2px solid #374151',
                    padding: '2px',
                    backgroundColor: '#374151'
                  }}
                >
                  <div className="permission-paper modern-typography w-full h-full" style={{
                    border: '1px solid #374151',
                    backgroundColor: 'white',
                    margin: 0,
                    padding: '8px 18px 18px 18px'
                  }}>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6 print:mb-2 -mt-2 print:-mt-1">
                    <div className="flex-1 text-left">
                      <div className="text-lg font-bold print:text-base whitespace-nowrap">
                        OOC STEENOKKERZEEL
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <img
                        src="/images/logo_feda.png"
                        alt="Fedasil - Federaal Agentschap voor de Opvang van Asielzoekers"
                        className="w-28 h-14 print:w-24 print:h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-lg font-bold print:text-base whitespace-nowrap">
                          PERMISSIEBLAD
                        </div>
                        <div className="text-base whitespace-nowrap">
                          <span className="font-bold text-lg">
                            {resident.badge}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact and STE info */}
                  <div className="flex justify-between items-start mb-3 print:mb-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-sm print:bg-white print:shadow-none print:p-0">
                    <div className="text-base space-y-2">
                      <div className="font-semibold mb-3 text-lg text-blue-900 print:text-black">
                        Contact
                      </div>
                      <div>Dienst : OOC Steenokkerzeel</div>
                      <div>Naam : Wouter Van Den Driessche</div>
                      <div>Functie : Directeur</div>
                      <div className="mt-2">Tel +3227552360</div>
                    </div>

                    {/* Photo placeholder - positioned in center */}
                    <div className="flex items-center">
                      <div className="w-32 h-40 print:w-28 print:h-36  print:bg-white overflow-hidden">
                        {(() => {
                          // Try different key formats for badge number (same as residents-grid)
                          const badgeStr = String(resident.badge);
                          const badgeNum = Number(resident.badge);
                          const photo =
                            residentPhotos[badgeStr] ||
                            residentPhotos[badgeNum] ||
                            residentPhotos[resident.badge];

                          if (photo) {
                            return (
                              <img
                                src={photo}
                                alt={`${resident.first_name} ${resident.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            );
                          }

                          // Fallback placeholder - empty box when no photo
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 print:w-6 print:h-6 text-gray-400" />
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="text-right space-y-3">
                      <div className="space-y-1">
                        <div>
                          <strong className="text-xl print:text-lg">
                            Ovnr:
                          </strong>
                          <span className="ml-2 text-lg print:text-base">
                            {resident.ov_number || ""}
                          </span>
                        </div>
                        <div>
                          <strong className="text-xl print:text-lg">NN:</strong>
                          <span className="ml-2 text-lg print:text-base">
                            {resident.register_number || ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <strong>
                            Vertegenwoordigers van de Belgische Overheid
                          </strong>
                        </div>
                        <div>
                          <strong>Steenokkerzeel</strong>:{" "}
                          {formatBirthDate(resident.date_in)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-4 print:mb-2 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg print:bg-white print:border-l-2 print:p-2">
                    <span className="text-lg font-semibold print:text-base text-indigo-900 print:text-black">
                      Betreft :{" "}
                    </span>
                    <span className="text-lg print:text-base text-indigo-700 print:text-black">
                      Identiteitscontrole
                    </span>
                  </div>

                  {/* Declaration text */}
                  <div className="text-base mb-4 print:mb-2 print:text-sm bg-white border border-gray-200 rounded-lg p-6 shadow-sm print:border-none print:shadow-none print:p-0">
                    <p className="mb-4 print:mb-1 text-gray-800 print:text-black text-lg print:text-base">
                      Geachte Heer, Mevrouw
                    </p>
                    <p className="mb-4 print:mb-1 text-gray-700 print:text-black leading-relaxed text-lg print:text-base">
                      Ik, ondertekende,{" "}
                      <span className="font-semibold text-blue-900 print:text-black">
                        Wouter Van Den Driessche
                      </span>
                      , directeur van het opvangcentrum voor niet begeleide
                      minderjarige te Steenokkerzeel, verklaar dat
                    </p>

                    <div className="mb-6 print:mb-2">
                      <div className="space-y-3 print:space-y-1 bg-blue-50 p-4 rounded-lg border border-blue-200 print:bg-white print:border-none print:p-0">
                        <h4 className="font-semibold text-blue-900 mb-2 print:text-black print:hidden">
                          Persoonlijke Gegevens
                        </h4>
                        <div>
                          <strong className="text-xl text-blue-900 print:text-lg print:text-black">
                            Voornaam :
                          </strong>
                          <span className="ml-2 text-lg text-gray-800 print:text-base print:text-black">
                            {resident.first_name || ""}
                          </span>
                        </div>
                        <div>
                          <strong className="text-xl text-blue-900 print:text-lg print:text-black">
                            Naam :
                          </strong>
                          <span className="ml-2 text-lg text-gray-800 print:text-base print:text-black">
                            {resident.last_name?.toUpperCase() || ""}
                          </span>
                        </div>
                        <div>
                          <strong className="text-xl text-blue-900 print:text-lg print:text-black">
                            Geboortedatum :
                          </strong>
                          <span className="ml-2 text-lg text-gray-800 print:text-base print:text-black">
                            {formatBirthDate(resident.date_of_birth)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mb-4 print:mb-1">
                      bewoner is van het opvangcentrum sinds{" "}
                      {formatBirthDate(resident.date_in)}
                      <br />
                      <strong>
                        OOC FEDASIL Steenokkerzeel, Keizerinlaan 2, 1820
                        STEENOKKERZEEL
                      </strong>
                    </p>

                    <p className="mb-8 text-sm print:mb-2 print:text-xs">
                      Een kopie van de bijlage 26 / voogdtoewijzing / Onder
                      hoede name Dienst Voogdij / aankomstverklaring / bijlage
                      25 / het paspoort van de bewoner vindt u op de ommezijde,
                      het origineel document bewaren we voorlopig in het
                      opvangcentrum.
                    </p>

                    <p className="mb-6 font-semibold text-lg print:mb-2 print:text-base">
                      De jongere heeft momenteel toestemming om het centrum te
                      verlaten tot 20 u op de datum gestempeld in onderstaand
                      raster tenzij een vroeger uur is vermeld.
                    </p>

                    <p className="font-semibold mb-8 text-lg print:mb-2 print:text-base">
                      STEMPEL OPVANGCENTRUM:
                    </p>
                  </div>

                  {/* Permission Table */}
                  <div className="border-2 border-gray-700  print:compact-table bg-white rounded-lg shadow-sm overflow-hidden print:border-black print:shadow-none">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 border-b-2 border-gray-700 print:bg-white print:border-black print:p-0">
                      <h3 className="font-semibold text-gray-800 text-center print:hidden">
                        PERMISSIE OVERZICHT
                      </h3>
                    </div>
                    <table className="w-full border-collapse border-b-2 border-gray-700 print:border-black">
                      <thead>
                        <tr className="border-b border-gray-600 print:border-gray-800">
                          <th
                            colSpan={2}
                            className="border-r border-gray-600 print:border-gray-800 p-4 print:p-1 text-center bg-blue-50 text-lg print:text-sm font-semibold text-blue-900 print:bg-gray-50 print:text-black"
                          >
                            Kleine permissie
                          </th>
                          <th
                            colSpan={2}
                            className="border-r border-gray-600 print:border-gray-800 p-4 print:p-1 text-center bg-green-50 text-lg print:text-sm font-semibold text-green-900 print:bg-gray-50 print:text-black"
                          >
                            Permissie weekend/feestdagen
                          </th>
                          <th
                            colSpan={2}
                            className="p-4 print:p-1 text-center bg-orange-50 text-lg print:text-sm font-semibold text-orange-900 print:bg-gray-50 print:text-black"
                          >
                            Afspraken
                          </th>
                        </tr>
                        <tr className="border-b border-gray-600 print:border-gray-800">
                          <td className="border-r border-gray-600 print:border-gray-800 p-2 print:p-1 text-center text-base print:text-sm">
                            Tot : (datum)
                          </td>
                          <td className="border-r border-gray-600 print:border-gray-800 p-2 print:p-1 text-center text-base print:text-sm">
                            (uur)
                          </td>
                          <td className="border-r border-gray-600 print:border-gray-800 p-2 print:p-1 text-center text-base print:text-sm">
                            Tot : (datum)
                          </td>
                          <td className="border-r border-gray-600 print:border-gray-800 p-2 print:p-1 text-center text-base print:text-sm">
                            (uur)
                          </td>
                          <td className="border-r border-gray-600 print:border-gray-800 p-2 print:p-1 text-center text-base print:text-sm">
                            Tot : (datum)
                          </td>
                          <td className="p-2 print:p-1 text-center text-base print:text-sm">
                            (uur)
                          </td>
                        </tr>
                      </thead>
                      <tbody className="border-b-2 border-gray-700 print:border-black">
                        {[...Array(11)].map((_, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={`${rowIndex === 10 ? "border-b-2 border-gray-700 print:border-black" : "border-b border-gray-600 print:border-gray-800"}`}
                          >
                            <td className="border-r border-gray-600 print:border-gray-800 p-3 h-20 print:p-1 print:h-7">
                              <div className="text-xs text-center text-gray-500">
                                {/* Empty cell */}
                              </div>
                            </td>
                            <td className="border-r border-gray-600 print:border-gray-800 p-3 h-20 print:p-1 print:h-7">
                              <div className="text-xs text-center text-gray-500">
                                {/* Empty cell */}
                              </div>
                            </td>
                            <td className="border-r border-gray-600 print:border-gray-800 p-3 h-20 print:p-1 print:h-7">
                              <div className="text-xs text-center text-gray-500">
                                {/* Empty cell */}
                              </div>
                            </td>
                            <td className="border-r border-gray-600 print:border-gray-800 p-3 h-20 print:p-1 print:h-7">
                              <div className="text-xs text-center text-gray-500">
                                {/* Empty cell */}
                              </div>
                            </td>
                            <td className="border-r border-gray-600 print:border-gray-800 p-3 h-20 print:p-1 print:h-7">
                              <div className="text-xs text-center text-gray-500">
                                {/* Empty cell */}
                              </div>
                            </td>
                            <td className="p-3 h-20 print:p-1 print:h-7">
                              <div className="text-xs text-center text-gray-500">
                                {/* Empty cell */}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              </div>

              {/* Page 2: Bijlage Documents - Single page for all documents */}
              {bijlageDocuments[resident.id] &&
              bijlageDocuments[resident.id].length > 0 && (
                <div className="print-page">
                  <div className="bijlage-documents w-full h-full">
                    {/* Display only the first PDF document found, or the first document if no PDF */}
                    {(() => {
                      const docs = bijlageDocuments[resident.id];
                      // Prioritize PDF documents
                      const pdfDoc = docs.find((doc: any) =>
                        doc.file_name?.toLowerCase().endsWith('.pdf')
                      );
                      const selectedDoc = pdfDoc || docs[0]; // Use first PDF or first document

                      if (!selectedDoc) return null;

                      console.log(`Displaying bijlage document for resident ${resident.id}:`, selectedDoc);

                      // Construct file URL
                      let fileUrl = selectedDoc.file_path || selectedDoc.file_url || selectedDoc.url;
                      if (!fileUrl && selectedDoc.id) {
                        fileUrl = `/api/documents/${selectedDoc.id}`;
                      }
                      if (!fileUrl && selectedDoc.file_name && resident.id) {
                        fileUrl = `/api/residents/${resident.id}/documents/${selectedDoc.file_name}`;
                      }

                      console.log(`Using file URL: ${fileUrl} for document ${selectedDoc.file_name}`);

                      if (!fileUrl) {
                        return (
                          <div className="p-8 text-center">
                            <h3 className="text-lg font-bold mb-4">{selectedDoc.file_name}</h3>
                            <p className="text-red-500">Document URL niet beschikbaar</p>
                          </div>
                        );
                      }

                      if (selectedDoc.file_name.toLowerCase().endsWith('.pdf')) {
                        // For PDF files
                        const pdfViewerUrl = `${fileUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
                        const pdfKey = `${resident.id}-bijlage`;
                        const isLoading = loadingPdfs[pdfKey] !== false;

                        return (
                          <div className="w-full h-full relative">
                            {/* Loading indicator */}
                            {isLoading && (
                              <div className="absolute inset-0 bg-white flex items-center justify-center z-10 print:hidden">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                                  <p className="text-gray-600 text-lg">Loading Bijlage Document...</p>
                                  <p className="text-gray-500 text-sm mt-2">{selectedDoc.file_name}</p>
                                </div>
                              </div>
                            )}

                            {/* PDF container with border enforcement */}
                            <div
                              className="absolute inset-0 border-frame"
                              style={{
                                border: '2px solid #374151',
                                padding: '2px',
                                backgroundColor: '#374151'
                              }}
                            >
                              <iframe
                                src={pdfViewerUrl}
                                className="w-full h-full pdf-iframe"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: '1px solid #374151',
                                  borderRadius: '0px',
                                  margin: 0,
                                  padding: 0,
                                  opacity: isLoading ? 0 : 1,
                                  transition: 'opacity 0.3s ease-in-out',
                                  display: 'block'
                                }}
                                title={`Bijlage: ${selectedDoc.file_name}`}
                                allowFullScreen
                                loading="eager"
                                onLoad={() => {
                                  console.log(`Bijlage PDF loaded successfully: ${fileUrl}`);
                                  setLoadingPdfs(prev => ({
                                    ...prev,
                                    [pdfKey]: false
                                  }));

                                  // Force iframe to render content for print
                                  const iframe = document.querySelector(`iframe[title="Bijlage: ${selectedDoc.file_name}"]`) as HTMLIFrameElement;
                                  if (iframe && iframe.contentWindow) {
                                    try {
                                      iframe.contentWindow.focus();
                                    } catch (e) {
                                      // Ignore cross-origin errors
                                    }
                                  }
                                }}
                                onError={(e) => {
                                  console.error(`Failed to load bijlage PDF: ${fileUrl}`, e);
                                  setLoadingPdfs(prev => ({
                                    ...prev,
                                    [pdfKey]: false
                                  }));
                                }}
                              />
                            </div>

                            {/* Document info overlay for screen viewing */}
                            <div className="print:hidden absolute top-6 left-6 bg-white p-2 rounded shadow z-20">
                              <p className="text-xs text-gray-600">
                                Bijlage: {selectedDoc.file_name}
                                {docs.length > 1 && ` (1 of ${docs.length})`}
                              </p>
                            </div>

                            {/* Open in new tab button */}
                            <div className="print:hidden absolute top-6 right-6 bg-white p-2 rounded shadow z-20">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline"
                              >
                                Open in new tab
                              </a>
                            </div>
                          </div>
                        );
                      } else if (selectedDoc.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        // For image files
                        return (
                          <div className="w-full h-full relative">
                            <img
                              src={fileUrl}
                              alt={`Bijlage document: ${selectedDoc.file_name}`}
                              className="w-full h-full object-contain"
                            />
                            <div className="print:hidden absolute top-4 left-4 bg-white p-2 rounded shadow z-20">
                              <p className="text-xs text-gray-600">
                                Bijlage: {selectedDoc.file_name}
                                {docs.length > 1 && ` (1 of ${docs.length})`}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        // For other file types
                        return (
                          <div className="p-8 text-center">
                            <h3 className="text-lg font-bold mb-4">{selectedDoc.file_name}</h3>
                            <p className="mb-2">Datum: {new Date(selectedDoc.created_at).toLocaleDateString("nl-BE")}</p>
                            <p className="mb-4">Type: {selectedDoc.document_type} | Grootte: {selectedDoc.file_size ? `${Math.round(selectedDoc.file_size / 1024)} KB` : "N/A"}</p>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              Open Document
                            </a>
                            {docs.length > 1 && (
                              <p className="text-sm text-gray-500 mt-4">
                                Er zijn {docs.length} bijlage documenten. Dit is document 1.
                              </p>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </DashboardLayout>

      <style jsx global>{`
        /* Times New Roman is a system font, no need to import */

        /* Times New Roman Typography for Screen */
        .modern-typography {
          font-family: "Times New Roman", Times, serif;
        }

        .modern-typography h1,
        .modern-typography h2,
        .modern-typography h3,
        .modern-typography .font-bold,
        .modern-typography .font-semibold {
          font-family: "Times New Roman", Times, serif;
        }

        .modern-typography p,
        .modern-typography span:not(.font-bold):not(.font-semibold) {
          font-family: "Times New Roman", Times, serif;
          line-height: 1.6;
        }

        @media print {
          @page {
            size: A4;
            margin: 5mm 6mm 15mm 6mm;
          }

          /* Hide all non-print elements */
          body * {
            visibility: hidden;
          }

          /* Show only print content */
          .print-content,
          .print-content * {
            visibility: visible;
          }

          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .print-page {
            width: 100%;
            height: 100vh;
            page-break-after: always;
            page-break-inside: avoid;
            display: block;
            position: relative;
          }

          .print-page:last-child {
            page-break-after: auto;
          }

          .permission-paper {
            font-family: "Times New Roman", Times, serif;
            font-size: 11px;
            line-height: 1.5;
            color: black !important;
            background: white !important;
            padding: 8px 18px 18px 18px;
            margin: 0 !important;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
          }

          .bijlage-documents {
            font-family: "Times New Roman", Times, serif;
            font-size: 11px;
            line-height: 1.5;
            color: black !important;
            background: white !important;
            padding: 2px !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            box-sizing: border-box;
            overflow: hidden;
            border: 2px solid #374151 !important;
          }

          /* Ensure PDF iframe has strong borders on all sides */
          .bijlage-documents iframe,
          .pdf-iframe {
            border: 2px solid #374151 !important;
            border-top: 2px solid #374151 !important;
            border-right: 2px solid #374151 !important;
            border-bottom: 2px solid #374151 !important;
            border-left: 2px solid #374151 !important;
            box-shadow: inset 0 0 0 1px #374151 !important;
            outline: 1px solid #374151 !important;
          }

          /* Border frame container styling */
          .border-frame {
            background-color: #374151 !important;
            padding: 2px !important;
            border: 2px solid #374151 !important;
          }

          /* Print-specific border styling to ensure visibility */
          @media print {
            .permission-paper {
              border: 1px solid black !important;
              padding: 6px 16px 16px 16px !important;
              background: white !important;
            }

            .bijlage-documents {
              border: 2px solid black !important;
              padding: 0 !important;
            }

            .border-frame {
              background-color: black !important;
              padding: 2px !important;
              border: 2px solid black !important;
            }

            .bijlage-documents iframe,
            .pdf-iframe {
              border: 1px solid black !important;
              border-top: 1px solid black !important;
              border-right: 1px solid black !important;
              border-bottom: 1px solid black !important;
              border-left: 1px solid black !important;
              box-shadow: none !important;
              outline: none !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              opacity: 1 !important;
              visibility: visible !important;
              display: block !important;
            }

            /* Ensure iframes render properly in print preview */
            .print-content iframe {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              will-change: contents;
            }
          }

          /* Times New Roman Typography */
          .permission-paper h1,
          .permission-paper h2,
          .permission-paper h3,
          .permission-paper .font-bold,
          .permission-paper .font-semibold {
            font-family: "Times New Roman", Times, serif !important;
            font-weight: 600;
          }

          .permission-paper p,
          .permission-paper span:not(.font-bold):not(.font-semibold) {
            font-family: "Times New Roman", Times, serif !important;
            line-height: 1.6;
          }

          .print\\:compact-table table {
            font-size: 8px !important;
          }

          .print\\:compact-table td {
            padding: 2px !important;
            height: 20px !important;
          }

          .print\\:compact-table th {
            padding: 2px !important;
          }

          .print\\:text-xs {
            font-size: 10px !important;
          }

          .print\\:text-sm {
            font-size: 11px !important;
          }

          .print\\:text-base {
            font-size: 12px !important;
          }

          .print\\:text-lg {
            font-size: 14px !important;
          }

          /* Ensure images show in print */
          img {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
          }

          /* Hide dashboard layout and controls */
          .print\\:hidden {
            display: none !important;
          }

          .hidden.print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
