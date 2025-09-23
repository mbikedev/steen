"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  FileText,
  Image,
  Upload,
  Download,
  Trash2,
  Eye,
  File,
  Calendar,
  User,
  Hash,
  Globe,
  MapPin,
  Phone,
  Mail,
  Folder,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { residentPhotosApi, apiService } from "../../lib/api-service";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "image" | "scan" | "word" | "excel" | "email" | "other";
  size: string;
  uploadDate: string;
  url?: string;
  category: string;
  documentType?:
    | "bijlage26"
    | "toewijzing"
    | "passport"
    | "geboorteakte"
    | "other";
  file?: File;
}

interface ResidentDocumentsModalProps {
  resident: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResidentDocumentsModal({
  resident,
  isOpen,
  onClose,
}: ResidentDocumentsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<string>("other");
  const [residentPhoto, setResidentPhoto] = useState<string | null>(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState<{
    [key: string]: string;
  }>({});
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Store current URL to prevent any navigation
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        onClose();

        // Ensure we stay on the current page
        setTimeout(() => {
          if (
            window.location.pathname !== currentPath ||
            window.location.search !== currentSearch
          ) {
            console.log(
              "Navigation detected after modal close, restoring location",
            );
            window.history.replaceState({}, "", currentPath + currentSearch);
          }
        }, 10);
      }
    };

    if (isOpen) {
      // Store current body overflow style
      const originalOverflow = document.body.style.overflow;

      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";

      // Add event listener when modal opens with capture phase and highest priority
      document.addEventListener("keydown", handleEscKey, {
        capture: true,
        passive: false,
      });

      return () => {
        // Restore body overflow
        document.body.style.overflow = originalOverflow;

        // Remove event listeners
        document.removeEventListener("keydown", handleEscKey, {
          capture: true,
        });
      };
    }
  }, [isOpen, onClose]);

  // Load resident photo from database and localStorage fallback
  useEffect(() => {
    const loadResidentPhoto = async () => {
      if (resident?.badge) {
        // First try to load from API
        try {
          const response = await residentPhotosApi.getAll();

          if (response.success && response.data) {
            // Try different key formats for badge number
            const badgeStr = String(resident.badge);
            const badgeNum = Number(resident.badge);
            const data = response.data as Record<string | number, string>;
            const photo =
              data[badgeStr] || data[badgeNum] || data[resident.badge];

            if (photo) {
              setResidentPhoto(photo);
              return;
            }
          }
        } catch (error) {
          // API not available
          console.error(
            "Failed to load photo from API:",
            error instanceof Error ? error.message : "Unknown error",
          );
          setResidentPhoto(null);
        }
      }
    };

    loadResidentPhoto();
  }, [resident?.badge]);

  // Load documents from database
  useEffect(() => {
    const loadDocuments = async () => {
      if (resident?.id) {
        try {
          console.log("🔍 Loading documents for resident ID:", resident.id);
          if (resident.badge) {
            try {
              await apiService.syncResidentDocuments(
                resident.badge,
                resident.id,
                "IN",
                {
                  residentName: {
                    firstName: resident.firstName,
                    lastName: resident.lastName,
                  },
                },
              );
            } catch (syncError) {
              console.error(
                "⚠️ Failed to sync IN documents from storage:",
                syncError,
              );
            }
          }
          const response = await apiService.getAdministrativeDocuments(
            resident.id,
          );

          console.log(
            "📥 Raw response from getAdministrativeDocuments:",
            response,
          );

          if (Array.isArray(response)) {
            console.log("📄 Found documents:", response.length);

            // Convert database documents to component format
            const formattedDocs: Document[] = response.map((doc: any) => ({
              id: doc.id.toString(),
              name: doc.file_name,
              type: doc.mime_type?.includes("pdf")
                ? "pdf"
                : doc.mime_type?.includes("image")
                  ? "image"
                  : doc.mime_type?.includes("word") ||
                      doc.file_name?.endsWith(".docx") ||
                      doc.file_name?.endsWith(".doc")
                    ? "word"
                    : doc.mime_type?.includes("sheet") ||
                        doc.file_name?.endsWith(".xlsx") ||
                        doc.file_name?.endsWith(".xls")
                      ? "excel"
                      : doc.file_name?.endsWith(".eml")
                        ? "email"
                        : "other",
              size: formatFileSize(doc.file_size || 0),
              uploadDate: new Date(doc.created_at).toISOString().split("T")[0],
              category: doc.document_type, // Use 'IN' or 'OUT' directly
              documentType: "other",
              url: doc.file_path, // This should be a Supabase Storage URL
            }));

            setDocuments(formattedDocs);
          } else {
            console.log("⚠️ Response is not an array, setting empty documents");
            setDocuments([]);
          }
        } catch (error) {
          console.error(
            "❌ Failed to load documents:",
            error instanceof Error ? error.message : "Unknown error",
          );
          setDocuments([]); // Set empty array on error
        }
      }
    };

    if (isOpen && resident?.id) {
      loadDocuments();
    }
  }, [isOpen, resident?.id, resident?.badge]);

  if (!isOpen) return null;

  const categories = [
    "all",
    "IN",
    "OUT",
    "Fedasil Documenten",
    "Identiteitsdocumenten",
    "Medische Dossiers",
    "Juridische Documenten",
    "Overige",
  ];

  const filteredDocuments =
    selectedCategory === "all"
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || !resident?.id) return;

    setUploadStatus("uploading");
    setDuplicateWarnings({});
    setUploadMessage("");

    try {
      const newDocuments: Document[] = [];
      const skippedFiles: string[] = [];
      const duplicateFiles: string[] = [];

      for (const file of Array.from(files)) {
        // Check for duplicate files by name
        const isDuplicate = documents.some(
          (doc) => doc.name.toLowerCase() === file.name.toLowerCase(),
        );

        if (isDuplicate) {
          duplicateFiles.push(file.name);
          console.log(`⚠️ Skipping duplicate file: ${file.name}`);
          continue; // Skip this file
        }
        console.log(
          "📤 Uploading file:",
          file.name,
          "for resident ID:",
          resident.id,
        );
        console.log("🎯 Selected document type:", selectedDocumentType);

        // Determine document type (IN/OUT) and description based on selection
        const outDocumentTypes = [
          "ontslagbrief",
          "doorverwijzingsdocumenten",
          "eindrapport",
          "retournering_documenten",
          "administratieve_afsluiting",
        ];

        let documentType = outDocumentTypes.includes(selectedDocumentType)
          ? "OUT"
          : "IN";
        let description = "";

        console.log("📄 Document type will be:", documentType);

        // Set description based on document type
        switch (selectedDocumentType) {
          case "bijlage26":
            description = "Bijlage 26 document";
            break;
          case "toewijzing":
            description = "Toewijzing document";
            break;
          case "passport":
            description = "Paspoort document";
            break;
          case "geboorteakte":
            description = "Geboorte akte document";
            break;
          case "identiteitsdocument":
            description = "Identiteitsdocument";
            break;
          case "verblijfsvergunning":
            description = "Verblijfsvergunning";
            break;
          case "medische_documenten":
            description = "Medische documenten";
            break;
          case "inschrijvingsdocumenten":
            description = "Inschrijvingsdocumenten";
            break;
          case "financiele_documenten":
            description = "Financiële documenten";
            break;
          case "ontslagbrief":
            description = "Ontslagbrief";
            break;
          case "doorverwijzingsdocumenten":
            description = "Doorverwijzingsdocumenten";
            break;
          case "eindrapport":
            description = "Eindrapport";
            break;
          case "retournering_documenten":
            description = "Retournering documenten";
            break;
          case "administratieve_afsluiting":
            description = "Administratieve afsluiting";
            break;
          default:
            description = "Administratief document";
        }

        // Upload to Supabase Storage and save to database
        console.log("🚀 Calling uploadAdministrativeDocument with:", {
          file: file.name,
          metadata: {
            resident_id: resident.id,
            document_type: documentType,
            description: description,
          },
        });

        const response = await apiService.uploadAdministrativeDocument(file, {
          resident_id: resident.id,
          document_type: documentType as "IN" | "OUT",
          description: description,
        });

        console.log("📦 Upload response:", response);

        if (response) {
          console.log("✅ Document uploaded successfully:", response);

          // Determine file type for UI
          const fileType = file.type.includes("pdf")
            ? "pdf"
            : file.type.includes("image")
              ? "image"
              : file.type.includes("word") ||
                  file.name.endsWith(".docx") ||
                  file.name.endsWith(".doc")
                ? "word"
                : file.type.includes("sheet") ||
                    file.name.endsWith(".xlsx") ||
                    file.name.endsWith(".xls")
                  ? "excel"
                  : file.name.endsWith(".eml")
                    ? "email"
                    : "other";

          // Determine category based on document type (IN/OUT)
          let category = documentType; // Use 'IN' or 'OUT' as primary category
          let docType: Document["documentType"] = "other";

          if (selectedDocumentType === "bijlage26") {
            docType = "bijlage26";
          } else if (selectedDocumentType === "toewijzing") {
            docType = "toewijzing";
          } else if (selectedDocumentType === "passport") {
            docType = "passport";
          } else if (selectedDocumentType === "geboorteakte") {
            docType = "geboorteakte";
          }

          const newDocument: Document = {
            id: response.id.toString(),
            name: response.file_name,
            type: fileType as Document["type"],
            size: formatFileSize(response.file_size || file.size),
            uploadDate: new Date(response.created_at)
              .toISOString()
              .split("T")[0],
            category,
            documentType: docType,
            url: response.file_path,
          };

          newDocuments.push(newDocument);
        }
      }

      // Add new documents to state
      setDocuments((prev) => [...prev, ...newDocuments]);

      // Set appropriate status and message
      if (duplicateFiles.length > 0 && newDocuments.length === 0) {
        setUploadStatus("error");
        setUploadMessage(
          `Alle bestanden waren duplicaten: ${duplicateFiles.join(", ")}`,
        );
      } else if (duplicateFiles.length > 0) {
        setUploadStatus("success");
        setUploadMessage(
          `${newDocuments.length} bestand(en) geüpload. ${duplicateFiles.length} duplicaat/duplicaten overgeslagen: ${duplicateFiles.join(", ")}`,
        );
      } else if (newDocuments.length > 0) {
        setUploadStatus("success");
        setUploadMessage(
          `${newDocuments.length} bestand(en) succesvol geüpload`,
        );
      } else {
        setUploadStatus("idle");
      }

      console.log("🎉 Upload process completed");
      if (duplicateFiles.length > 0) {
        console.log(
          `⚠️ Skipped ${duplicateFiles.length} duplicate files:`,
          duplicateFiles,
        );
      }

      // Reset status after 5 seconds
      setTimeout(() => {
        setUploadStatus("idle");
        setSelectedDocumentType("other");
        setUploadMessage("");
      }, 5000);
    } catch (error) {
      console.error(
        "❌ Upload error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      console.log("🗑️ Deleting document ID:", docId);

      // Delete from database
      await apiService.deleteAdministrativeDocument(parseInt(docId));

      console.log("✅ Document deleted from database");

      // Remove from local state
      const doc = documents.find((d) => d.id === docId);
      if (doc?.url && doc.url.startsWith("blob:")) {
        URL.revokeObjectURL(doc.url); // Only revoke blob URLs
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error(
        "❌ Delete error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      alert("Fout bij verwijderen document. Probeer opnieuw.");
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      if (doc.url) {
        // Store current state to prevent any navigation issues
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        // Mark return path so the app can restore after closing the doc tab
        try {
          const returnPath = currentPath + currentSearch;
          const timestamp = Date.now();
          sessionStorage.setItem("adminDocsReturnPath", returnPath);
          sessionStorage.setItem("adminDocsReturnSetAt", String(timestamp));
        } catch (e) {
          // Silently handle storage errors
        }

        // Open document in new tab/window
        window.open(doc.url, "_blank", "noopener,noreferrer");

        // Ensure we stay on the current page
        setTimeout(() => {
          if (
            window.location.pathname !== currentPath ||
            window.location.search !== currentSearch
          ) {
            console.log(
              "Navigation detected after file open, restoring location",
            );
            window.history.replaceState({}, "", currentPath + currentSearch);
          }
        }, 100);
      }
      setPreviewDocument(doc);
    } catch (error) {
      console.error(
        "❌ Error viewing document:",
        error instanceof Error ? error.message : "Unknown error",
      );
      alert(
        'Fout bij openen document. Controleer of de Supabase storage bucket "administrative-documents" bestaat.',
      );
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      if (doc.url) {
        console.log("📥 Downloading document:", doc.name);

        // Create download link with proper attributes to prevent navigation
        const link = document.createElement("a");
        link.href = doc.url;
        link.download = doc.name;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "none";

        // Prevent default behavior
        link.onclick = (e) => {
          e.stopPropagation();
        };

        document.body.appendChild(link);
        link.click();

        // Remove link after a short delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }
    } catch (error) {
      console.error(
        "❌ Error downloading document:",
        error instanceof Error ? error.message : "Unknown error",
      );
      alert("Fout bij downloaden document.");
    }
  };

  const getDocumentIcon = (doc: Document) => {
    // Special icons for specific document types
    if (doc.documentType === "bijlage26") {
      return <FileText className="w-5 h-5 text-purple-500" />;
    }
    if (doc.documentType === "toewijzing") {
      return <FileText className="w-5 h-5 text-indigo-500" />;
    }
    if (doc.documentType === "passport") {
      return <FileText className="w-5 h-5 text-foreground" />;
    }
    if (doc.documentType === "geboorteakte") {
      return <FileText className="w-5 h-5 text-teal-500" />;
    }

    // Default icons by file type
    switch (doc.type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-foreground" />;
      case "image":
        return <Image className="w-5 h-5 text-foreground" />;
      case "scan":
        return <File className="w-5 h-5 text-foreground" />;
      case "word":
        return <FileText className="w-5 h-5 text-foreground" />;
      case "excel":
        return <FileText className="w-5 h-5 text-foreground" />;
      case "email":
        return <Mail className="w-5 h-5 text-purple-600" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getDocumentLabel = (doc: Document) => {
    switch (doc.documentType) {
      case "bijlage26":
        return "Bijlage 26";
      case "toewijzing":
        return "Toewijzing";
      case "passport":
        return "Paspoort";
      case "geboorteakte":
        return "Geboorte Akte";
      default:
        return doc.category;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 py-4">
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Store current URL to prevent any navigation
            const currentPath = window.location.pathname;
            const currentSearch = window.location.search;

            onClose();

            // Ensure we stay on the current page
            setTimeout(() => {
              if (
                window.location.pathname !== currentPath ||
                window.location.search !== currentSearch
              ) {
                console.log(
                  "Navigation detected after background click, restoring location",
                );
                window.history.replaceState(
                  {},
                  "",
                  currentPath + currentSearch,
                );
              }
            }, 10);
          }}
          aria-hidden="true"
        ></div>

        <div
          className="relative bg-card rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-primary px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  {residentPhoto ? (
                    <img
                      src={residentPhoto}
                      alt={`${resident.firstName} ${resident.lastName}`}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full p-2 sm:p-3 flex items-center justify-center shadow-lg"
                      title="Geen foto beschikbaar - Upload een foto in Bewoners Overzicht"
                    >
                      <User className="w-6 h-6 sm:w-10 sm:h-10 text-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-white min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    {resident.firstName} {resident.lastName}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 lg:space-x-4 mt-1">
                    <span className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs sm:text-sm">
                      <Hash className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Badge:{" "}
                      <span className="text-yellow-300 font-semibold ml-1">
                        {resident.badge}
                      </span>
                    </span>
                    <span className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Kamer:{" "}
                      <span className="text-foreground font-semibold ml-1">
                        {resident.room || "Niet toegewezen"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Store current URL to prevent any navigation
                  const currentPath = window.location.pathname;
                  const currentSearch = window.location.search;

                  onClose();

                  // Ensure we stay on the current page
                  setTimeout(() => {
                    if (
                      window.location.pathname !== currentPath ||
                      window.location.search !== currentSearch
                    ) {
                      console.log(
                        "Navigation detected after X button click, restoring location",
                      );
                      window.history.replaceState(
                        {},
                        "",
                        currentPath + currentSearch,
                      );
                    }
                  }, 10);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 sm:p-2 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b dark:border-border">
            <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === "overview"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Overzicht
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === "documents"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Documenten ({documents.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="p-4 sm:p-6 overflow-y-auto"
            style={{ maxHeight: "calc(95vh - 180px)" }}
          >
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Personal Information */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-foreground">
                    Persoonlijke Informatie
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Volledige Naam:
                      </span>
                      <span className="font-medium text-foreground dark:text-foreground">
                        {resident.firstName} {resident.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Badgenummer:
                      </span>
                      <span className="font-medium text-foreground dark:text-foreground">
                        {resident.badge}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        OV Nummer:
                      </span>
                      <span className="font-medium text-foreground dark:text-foreground">
                        {resident.ovNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Nationaliteit:
                      </span>
                      <span className="font-medium text-foreground dark:text-foreground">
                        {resident.nationality}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accommodation Details */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-foreground">
                    Verblijfsdetails
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Kamer:
                      </span>
                      <span className="font-medium text-foreground dark:text-foreground">
                        {resident.room || "Niet toegewezen"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Status:
                      </span>
                      <span
                        className={`font-medium ${
                          resident.status === "Actief"
                            ? "text-foreground dark:text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {resident.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div>
                {/* Upload Status Messages */}
                {uploadStatus === "uploading" && (
                  <div className="mb-4 p-3 bg-accent text-accent-foreground rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-3"></div>
                    Documenten uploaden...
                  </div>
                )}
                {uploadStatus === "success" && (
                  <div className="mb-4 p-3 bg-accent text-accent-foreground rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {uploadMessage || "Documenten succesvol geüpload!"}
                  </div>
                )}
                {uploadStatus === "error" && (
                  <div className="mb-4 p-3 bg-accent text-accent-foreground rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {uploadMessage ||
                      "Fout bij uploaden documenten. Probeer opnieuw."}
                  </div>
                )}

                {/* Document Controls */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 text-sm border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground dark:text-foreground"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "all" ? "Alle Categorieën" : cat}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground dark:text-muted-foreground text-sm">
                      {filteredDocuments.length} document(en)
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <select
                      value={selectedDocumentType}
                      onChange={(e) => setSelectedDocumentType(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground dark:text-foreground text-sm"
                      title="Selecteer documenttype voor betere organisatie"
                    >
                      <option value="other">Selecteer Documenttype</option>
                      <optgroup label="IN Documenten">
                        <option value="bijlage26">Bijlage 26</option>
                        <option value="toewijzing">Toewijzing</option>
                        <option value="passport">Paspoort</option>
                        <option value="geboorteakte">Geboorte Akte</option>
                        <option value="identiteitsdocument">
                          Identiteitsdocument
                        </option>
                        <option value="verblijfsvergunning">
                          Verblijfsvergunning
                        </option>
                        <option value="medische_documenten">
                          Medische Documenten
                        </option>
                        <option value="inschrijvingsdocumenten">
                          Inschrijvingsdocumenten
                        </option>
                        <option value="financiele_documenten">
                          Financiële Documenten
                        </option>
                      </optgroup>
                      <optgroup label="OUT Documenten">
                        <option value="ontslagbrief">Ontslagbrief</option>
                        <option value="doorverwijzingsdocumenten">
                          Doorverwijzingsdocumenten
                        </option>
                        <option value="eindrapport">Eindrapport</option>
                        <option value="retournering_documenten">
                          Retournering Documenten
                        </option>
                        <option value="administratieve_afsluiting">
                          Administratieve Afsluiting
                        </option>
                      </optgroup>
                    </select>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center space-x-2 bg-foreground hover:bg-foreground/90 text-white px-4 py-2 rounded-md transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        Document Uploaden
                      </span>
                      <span className="sm:hidden">Upload</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow relative"
                    >
                      {/* Delete Confirmation */}
                      {deleteConfirm === doc.id && (
                        <div className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 flex flex-col justify-center items-center z-10">
                          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-foreground mb-2" />
                          <p className="text-xs sm:text-sm text-center mb-3 text-foreground dark:text-foreground">
                            Dit document verwijderen?
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="px-2 sm:px-3 py-1 bg-foreground text-background rounded text-xs sm:text-sm hover:bg-foreground/90"
                            >
                              Verwijderen
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 sm:px-3 py-1 bg-gray-300 dark:bg-gray-600 text-foreground dark:text-gray-300 rounded text-xs sm:text-sm hover:bg-gray-400"
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {getDocumentIcon(doc)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground dark:text-foreground text-xs sm:text-sm truncate">
                              {doc.name}
                            </h4>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                              {doc.size} • {doc.uploadDate}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-1.5 sm:px-2 py-1 rounded truncate max-w-[120px] sm:max-w-none ${
                            doc.documentType === "bijlage26"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                              : doc.documentType === "toewijzing"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                                : doc.documentType === "passport"
                                  ? "bg-accent text-accent-foreground"
                                  : doc.documentType === "geboorteakte"
                                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                                    : "bg-gray-100 text-foreground dark:bg-gray-600 dark:text-gray-300"
                          }`}
                          title={getDocumentLabel(doc)}
                        >
                          {getDocumentLabel(doc)}
                        </span>
                        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="text-foreground hover:text-foreground/80 transition-colors p-1"
                            title="Bekijken"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-foreground hover:text-foreground/80 transition-colors p-1"
                            title="Downloaden"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(doc.id)}
                            className="text-foreground hover:text-foreground/80 transition-colors p-1"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredDocuments.length === 0 && (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <Folder className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground dark:text-muted-foreground mb-2 text-sm sm:text-base">
                      Nog geen documenten geüpload
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mb-4 max-w-md mx-auto">
                      Upload PDF's, afbeeldingen, Word documenten (.docx), Excel
                      bestanden (.xlsx) of gescande documenten voor deze bewoner
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground italic mb-4">
                      Tip: Voor email bestanden (.eml), converteer ze eerst naar
                      PDF
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 px-3 sm:px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      <span className="hidden sm:inline">
                        Eerste Document Uploaden
                      </span>
                      <span className="sm:hidden">Upload Document</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
