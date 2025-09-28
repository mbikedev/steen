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

  const handlePrint = () => {
    window.print();
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

  // Load bijlage documents for all residents
  useEffect(() => {
    const loadBijlageDocuments = async () => {
      try {
        const documentsMap: { [key: number]: any[] } = {};

        for (const resident of residents) {
          try {
            const documents = await apiService.getAdministrativeDocuments(
              resident.id,
            );
            // Filter for bijlage documents (pattern: "bijlage" in filename)
            const bijlageDocs = documents.filter(
              (doc: any) =>
                doc.file_name &&
                doc.file_name.toLowerCase().includes("bijlage"),
            );
            documentsMap[resident.id] = bijlageDocs;
          } catch (error) {
            console.error(
              `Error loading bijlage documents for resident ${resident.id}:`,
              error,
            );
            documentsMap[resident.id] = [];
          }
        }

        setBijlageDocuments(documentsMap);
      } catch (error) {
        console.error("Error loading bijlage documents:", error);
      }
    };

    if (residents.length > 0) {
      loadBijlageDocuments();
    }
  }, [residents]);

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
    window.print();
  };

  return (
    <>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="print:hidden mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Permissiebladeren
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Genereer permissiebladeren voor alle bewoners (
                  {residents.length} bewoners)
                </p>
              </div>
              <button
                onClick={handlePrint}
                disabled={showIndividualPrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                Print Alle Permissiebladeren
              </button>
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
                <div className="permission-paper modern-typography">
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
                          {formatDate(new Date())}
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

              {/* Page 2: Bijlage Documents */}
              <div className="print-page">
                <div className="bijlage-documents">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold">BIJLAGE DOCUMENTEN</h2>
                    <p className="text-sm mt-2">
                      Bewoner: {resident.first_name} {resident.last_name} -
                      Badge: {resident.badge}
                    </p>
                  </div>
                  <div className="mt-4 h-96 overflow-hidden">
                    {bijlageDocuments[resident.id] &&
                    bijlageDocuments[resident.id].length > 0 ? (
                      <div className="space-y-2">
                        {bijlageDocuments[resident.id]
                          .slice(0, 3)
                          .map((doc: any, docIndex: number) => (
                            <div
                              key={docIndex}
                              className="border border-gray-300 p-3 rounded"
                            >
                              <h3 className="text-sm font-semibold mb-1">
                                {doc.file_name}
                              </h3>
                              <p className="text-xs text-gray-600 mb-1">
                                Datum:{" "}
                                {new Date(doc.created_at).toLocaleDateString(
                                  "nl-BE",
                                )}
                              </p>
                              <div className="bg-gray-100 p-2 text-center">
                                <p className="text-xs text-gray-600">
                                  Document: {doc.file_name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Type: {doc.document_type} | Grootte:{" "}
                                  {doc.file_size
                                    ? `${Math.round(doc.file_size / 1024)} KB`
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          ))}
                        {bijlageDocuments[resident.id].length > 3 && (
                          <div className="text-center text-xs text-gray-500 mt-2">
                            En {bijlageDocuments[resident.id].length - 3} meer
                            document(en)...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 mt-20">
                        <p>
                          Geen bijlage documenten gevonden voor deze bewoner
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

          .permission-paper,
          .bijlage-documents {
            font-family: "Times New Roman", Times, serif;
            font-size: 11px;
            line-height: 1.5;
            color: black !important;
            background: white !important;
            padding: 10px 20px 20px 20px;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
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
