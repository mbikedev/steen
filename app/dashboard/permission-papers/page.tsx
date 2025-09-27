"use client";

import React, { useState } from "react";
import { useData } from "@/lib/DataContext";
import { DashboardLayout } from "@/app/components/layout/DashboardLayout";
import { Printer, FileText } from "lucide-react";

export default function PermissionPapersPage() {
  const { residents } = useData();
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric"
    });
  };

  const handlePrint = async () => {
    setIsGeneratingPrint(true);
    // Small delay to show the generating state
    setTimeout(() => {
      window.print();
      setIsGeneratingPrint(false);
    }, 500);
  };

  const formatBirthDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Screen Header */}
          <div className="print:hidden mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Permissiebladeren
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Genereer permissiebladeren voor alle bewoners (recto-verso)
                </p>
              </div>
              <button
                onClick={handlePrint}
                disabled={isGeneratingPrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {isGeneratingPrint ? "Genereren..." : "Print Alle Permissiebladeren"}
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-200">
                    Recto-Verso Printing
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Deze pagina genereert permissiebladeren voor alle bewoners. Elke bewoner krijgt:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 list-disc list-inside">
                    <li><strong>Voorkant:</strong> Permissieblad met bewoner informatie</li>
                    <li><strong>Achterkant:</strong> Bijlage documenten (indien beschikbaar)</li>
                  </ul>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    Zorg ervoor dat je printer is ingesteld op duplex/dubbelzijdig printen.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {residents.slice(0, 6).map((resident) => (
                <div key={resident.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        #{resident.badge}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {resident.first_name} {resident.last_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {residents.length > 6 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    +{residents.length - 6} meer bewoners
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Layout */}
        <div className="hidden print:block">
          {residents.map((resident, index) => (
            <React.Fragment key={resident.id}>
              {/* Front Page - Permission Paper */}
              <div className="print-page">
                <div className="permission-paper">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="text-lg font-bold">
                      OOC STEENOKKERZEEL
                    </div>
                    <div className="text-lg font-bold">
                      PERMISSIEBLAD
                    </div>
                  </div>

                  {/* Contact Info and STE Number */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-sm">
                      <div className="mb-2"><strong>Contact</strong></div>
                      <div>Dienst : OOC Steenokkerzeel</div>
                      <div>Naam : Wouter Van Den Driessche</div>
                      <div>Functie : Directeur</div>
                      <div className="mt-2">Tel +3227552360</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-bold">STE</span>
                        <span className="font-bold">{resident.badge}</span>
                      </div>
                      <div>{formatDate(new Date())}</div>
                    </div>
                  </div>

                  {/* Fedasil Logo Area and Photo */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-sm">
                      <div className="mb-2"><strong>Betreft : Identiteitscontrole</strong></div>
                      <div className="mb-4"><strong>Geachte Heer, Mevrouw</strong></div>
                    </div>
                    <div className="text-right text-sm">
                      <div><strong>Vertegenwoordigers van de Belgische Overheid</strong></div>
                      <div className="mt-2">Steenokkerzeel</div>
                      <div className="mt-2">{formatDate(new Date())}</div>
                    </div>
                  </div>

                  {/* Resident Photo Placeholder */}
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-32 border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-500">Foto</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="text-sm mb-6">
                    <p className="mb-4">
                      Ik, ondertekende, Wouter Van Den Driessche, directeur van het opvangcentrum voor niet begeleide minderjarige te Steenokkerzeel, verklaar dat
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div><strong>Naam :</strong> {resident.last_name?.toUpperCase() || ""}</div>
                        <div><strong>Voornaam :</strong> {resident.first_name || ""}</div>
                        <div><strong>Geboortedatum :</strong> {formatBirthDate(resident.date_of_birth)}</div>
                      </div>
                      <div>
                        <div><strong>Ovnr:</strong> {resident.ov_number || ""}</div>
                        <div><strong>NN:</strong> {resident.register_number || ""}</div>
                      </div>
                    </div>

                    <p className="mb-4">
                      bewoner is van het opvangcentrum sinds {formatBirthDate(resident.date_in)}<br />
                      <strong>OOC FEDASIL Steenokkerzeel, Keizerinlaan 2, 1820 STEENOKKERZEEL</strong>
                    </p>

                    <p className="mb-6">
                      Een kopie van de bijlage 26 / voogdtoewijzing / Onder hoede name Dienst Voogdij / aankomstverklaring / bijlage 25 / het paspoort van de bewoner vindt u <strong>op de ommezijde</strong>, het origineel document bewaren we voorlopig in het opvangcentrum.
                    </p>

                    <p className="mb-6 font-bold underline">
                      De jongere heeft momenteel toestemming om het centrum te verlaten tot 20 u op de datum gestempeld in onderstaand raster tenzij een vroeger uur is vermeld.
                    </p>

                    <div className="mb-6">
                      <strong>STEMPEL OPVANGCENTRUM:</strong>
                    </div>
                  </div>

                  {/* Permission Table */}
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-center">
                          <div>Kleine permissie</div>
                          <div className="flex justify-between">
                            <span>Tot : (datum)</span>
                            <span>(uur)</span>
                          </div>
                        </th>
                        <th className="border border-black p-2 text-center">
                          <div>Permissie weekend/feestdagen</div>
                          <div className="flex justify-between">
                            <span>Tot : (datum)</span>
                            <span>(uur)</span>
                          </div>
                        </th>
                        <th className="border border-black p-2 text-center">
                          <div>Afspraken</div>
                          <div className="flex justify-between">
                            <span>Tot : (datum)</span>
                            <span>(uur)</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 12 }, (_, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 h-8"></td>
                          <td className="border border-black p-2 h-8"></td>
                          <td className="border border-black p-2 h-8"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Back Page - Bijlage Documents */}
              <div className="print-page">
                <div className="bijlage-documents">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold">BIJLAGE DOCUMENTEN</h2>
                    <p className="text-sm mt-2">Bewoner: {resident.first_name} {resident.last_name} - Badge: #{resident.badge}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="document-section">
                      <h3 className="font-bold mb-4 text-lg border-b border-gray-300 pb-2">Bijlage 26</h3>
                      <div className="document-placeholder">
                        <div className="border-2 border-dashed border-gray-400 h-32 flex items-center justify-center text-gray-500">
                          Bijlage 26 document wordt hier geplaatst
                        </div>
                      </div>
                    </div>

                    <div className="document-section">
                      <h3 className="font-bold mb-4 text-lg border-b border-gray-300 pb-2">Voogdij Toewijzing</h3>
                      <div className="document-placeholder">
                        <div className="border-2 border-dashed border-gray-400 h-32 flex items-center justify-center text-gray-500">
                          Voogdij toewijzing document wordt hier geplaatst
                        </div>
                      </div>
                    </div>

                    <div className="document-section">
                      <h3 className="font-bold mb-4 text-lg border-b border-gray-300 pb-2">Paspoort / Identiteitsdocument</h3>
                      <div className="document-placeholder">
                        <div className="border-2 border-dashed border-gray-400 h-32 flex items-center justify-center text-gray-500">
                          Paspoort of identiteitsdocument wordt hier geplaatst
                        </div>
                      </div>
                    </div>

                    <div className="document-section">
                      <h3 className="font-bold mb-4 text-lg border-b border-gray-300 pb-2">Aankomstverklaring</h3>
                      <div className="document-placeholder">
                        <div className="border-2 border-dashed border-gray-400 h-32 flex items-center justify-center text-gray-500">
                          Aankomstverklaring wordt hier geplaatst
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-xs text-gray-600">
                    <p><strong>Opmerking:</strong> Dit zijn kopieën van de originele documenten. De originelen worden bewaard in het opvangcentrum.</p>
                    <p className="mt-2">OOC FEDASIL Steenokkerzeel, Keizerinlaan 2, 1820 STEENOKKERZEEL</p>
                  </div>
                </div>
              </div>

              {/* Page break after each resident's recto-verso pair */}
              {index < residents.length - 1 && <div className="print-page-break"></div>}
            </React.Fragment>
          ))}
        </div>
      </DashboardLayout>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          .print-page {
            width: 100%;
            min-height: 100vh;
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          .print-page-break {
            page-break-after: always;
          }
          
          .permission-paper {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: black;
            background: white;
          }
          
          .bijlage-documents {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: black;
            background: white;
            padding: 20px;
          }
          
          .document-section {
            margin-bottom: 30px;
          }
          
          .document-placeholder {
            margin-top: 10px;
          }
          
          /* Hide screen elements */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Show print elements */
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}