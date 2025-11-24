"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import {
  fetchClientsDossier,
  fetchDossierDetails,
  uploadDocuments,
  type Dossier,
  type DocumentRequest,
  type DocumentUpload,
  type ClientDossierResponse,
} from "./actions/dossier-client";

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: Date;
}

interface Stats {
  dossiersActifs: number;
  documentsUploades: number;
  enAttente: number;
  progression: number;
}

const ClientComponent: React.FC = () => {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [stats, setStats] = useState<Stats>({
    dossiersActifs: 0,
    documentsUploades: 0,
    enAttente: 0,
    progression: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [currentDocRequest, setCurrentDocRequest] = useState<DocumentRequest | null>(null);
  const [currentDossierId, setCurrentDossierId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Detail view state
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // FIXED: Helper function to check upload limits - exclude REJECTED status uploads
  const checkUploadLimits = (docRequest: DocumentRequest) => {
    if (!docRequest.uploads) return { canUpload: true, warning: null };
    
    // FIXED: Only count valid uploads (exclude REJETE status)
    const validUploads = docRequest.uploads.filter(
      upload => upload.status === 'VALIDE' || upload.status === 'EN_REVISION' || upload.status === 'EN_ATTENTE'
    );
    const currentUploads = validUploads.length;
    const maxAllowed = docRequest.quantiteMax;
    const minRequired = docRequest.quantiteMin;
    
    console.log(`Upload limit check for "${docRequest.titre}":`, {
      totalUploads: docRequest.uploads.length,
      validUploads: currentUploads,
      maxAllowed,
      minRequired,
      refusedUploads: docRequest.uploads.filter(u => u.status === 'REJETE').length
    });
    
    // Check if already at maximum (only counting valid uploads)
    if (maxAllowed && currentUploads >= maxAllowed) {
      return {
        canUpload: false,
        warning: `Vous avez atteint le maximum autorisé de ${maxAllowed} document(s) pour cette demande.`
      };
    }
    
    // Check if close to maximum (only counting valid uploads)
    if (maxAllowed && currentUploads >= maxAllowed - 1) {
      const remaining = maxAllowed - currentUploads;
      return {
        canUpload: true,
        warning: `Attention: Vous ne pouvez ajouter que ${remaining} document(s) supplémentaire(s) (${currentUploads}/${maxAllowed} uploadés).`
      };
    }
    
    // Show info about refused uploads if any
    const refusedCount = docRequest.uploads.filter(u => u.status === 'REJETE').length;
    if (refusedCount > 0) {
      return {
        canUpload: true,
        warning: `Vous avez ${refusedCount} document(s) refusé(s). Vous pouvez uploader de nouveaux documents pour les remplacer.`
      };
    }
    
    return { canUpload: true, warning: null };
  };

  // Load data on component mount
  useEffect(() => {
    loadClientData();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = [...dossiers];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(d => 
        d.nom.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    setFilteredDossiers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [dossiers, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDossiers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDossiers = filteredDossiers.slice(startIndex, endIndex);

  const loadClientData = async () => {
    startTransition(async () => {
      try {
        setLoading(true);
        setError(null);

        // Call server action
        const apiResponse: ClientDossierResponse = await fetchClientsDossier();

        // Transform the API response to match our component state
        const transformedDossiers = apiResponse.dossiers.map((dossier) => ({
          ...dossier,
          isUrgent: dossier.dateEcheance
            ? new Date(dossier.dateEcheance) <=
              new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            : false,
        }));

        setDossiers(transformedDossiers);

        // Calculate stats from API response
        const calculatedStats = {
          dossiersActifs:
            apiResponse.summary.enCours + apiResponse.summary.enAttente,
          documentsUploades: transformedDossiers.reduce(
            (sum, d) => sum + d.documentsUpload,
            0
          ),
          enAttente: apiResponse.summary.enAttente,
          progression:
            transformedDossiers.length > 0
              ? Math.round(
                  transformedDossiers.reduce(
                    (sum, d) => sum + d.pourcentage,
                    0
                  ) / transformedDossiers.length
                )
              : 0,
        };
        setStats(calculatedStats);

        // Add welcome notification
        addNotification("Données chargées avec succès!", "success");

        // FIXED: Check for refused documents and notify user
        let refusedDocuments = 0;
        transformedDossiers.forEach(dossier => {
          dossier.documentRequests?.forEach(request => {
            const refusedCount = request.uploads?.filter(u => u.status === 'REJETE').length || 0;
            refusedDocuments += refusedCount;
          });
        });

        if (refusedDocuments > 0) {
          addNotification(
            `Attention: Vous avez ${refusedDocuments} document(s) refusé(s) qui nécessitent votre attention!`,
            "warning"
          );
        }

        // Check for urgent dossiers
        if (apiResponse.summary.urgents > 0) {
          addNotification(
            `Attention: ${apiResponse.summary.urgents} dossier(s) arrive(nt) à échéance prochainement!`,
            "warning"
          );
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des données");
        console.error("Error loading client data:", err);
        addNotification(
          err.message || "Erreur lors du chargement des données",
          "error"
        );
      } finally {
        setLoading(false);
      }
    });
  };

  // FIXED: Open detail modal instead of just fetching
  const navigateToDossierDetails = async (dossierId: number) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    if (dossier) {
      setSelectedDossier(dossier);
      setIsDetailModalOpen(true);
      addNotification("Détails du dossier chargés", "info");
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDossier(null);
  };

  const openUploadModal = (docRequest: DocumentRequest, dossierId: number) => {
    console.log("Opening upload modal for:", docRequest.titre, "Dossier:", dossierId);
    
    // Check if we're at the limit
    const limitCheck = checkUploadLimits(docRequest);
    const refusedUploads = docRequest.uploads?.filter((u) => u.status === "REJETE") || [];
    
    // If at limit and no refused documents, show warning and don't open modal
    if (!limitCheck.canUpload && refusedUploads.length === 0) {
      addNotification(
        `Vous avez atteint le maximum de ${docRequest.quantiteMax} document(s) pour "${docRequest.titre}". Impossible d'uploader plus de documents.`,
        "error"
      );
      return;
    }
    
    // Show warning if there are refused documents
    if (refusedUploads.length > 0) {
      addNotification(
        `Vous avez ${refusedUploads.length} document(s) refusé(s) pour "${docRequest.titre}". Les nouveaux documents remplaceront les documents refusés.`,
        "info"
      );
    }
    
    setCurrentDocRequest(docRequest);
    setCurrentDossierId(dossierId);
    setIsUploadModalOpen(true);
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setCurrentDocRequest(null);
    setCurrentDossierId(null);
    setSelectedFiles([]);
    setDragActive(false);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    validateAndSetFiles(files);
  };

  const validateAndSetFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        addNotification(`Format non supporté pour ${file.name}`, "error");
        return false;
      }
      if (!isValidSize) {
        addNotification(`Fichier trop volumineux: ${file.name}`, "error");
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    validateAndSetFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || !currentDocRequest || !currentDossierId) {
      addNotification("Veuillez sélectionner au moins un fichier", "warning");
      return;
    }

    // FIXED: Check limits before uploading
    const limitCheck = checkUploadLimits(currentDocRequest);
    const refusedUploads = currentDocRequest.uploads?.filter((u) => u.status === "REJETE") || [];
    const validUploads = currentDocRequest.uploads?.filter(
      (u) => u.status === "VALIDE" || u.status === "EN_REVISION" || u.status === "EN_ATTENTE"
    ) || [];
    
    // Calculate how many files can be uploaded
    const maxAllowed = currentDocRequest.quantiteMax || 999;
    const currentValid = validUploads.length;
    const availableSlots = maxAllowed - currentValid;
    
    // If trying to upload more than available slots and no refused documents
    if (selectedFiles.length > availableSlots && refusedUploads.length === 0) {
      addNotification(
        `Vous ne pouvez uploader que ${availableSlots} document(s) supplémentaire(s). Vous avez sélectionné ${selectedFiles.length} fichier(s).`,
        "error"
      );
      return;
    }
    
    // If there are refused documents, limit to the number of refused + available slots
    if (refusedUploads.length > 0) {
      const maxCanUpload = refusedUploads.length + availableSlots;
      if (selectedFiles.length > maxCanUpload) {
        addNotification(
          `Vous pouvez remplacer ${refusedUploads.length} document(s) refusé(s) et ajouter ${availableSlots} nouveau(x). Maximum: ${maxCanUpload} fichier(s).`,
          "error"
        );
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Call server action
      const result = await uploadDocuments(
        currentDossierId,
        currentDocRequest.id,
        selectedFiles
      );

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      addNotification(
        result.message ||
          `${selectedFiles.length} fichier(s) uploadé(s) avec succès pour "${currentDocRequest.titre}"!`,
        "success"
      );

      // Close modal first
      closeUploadModal();

      // Add a small delay then refresh data to ensure backend processing is complete
      setTimeout(async () => {
        try {
          await loadClientData(); // This will refresh all dossier data including progress

          // Add secondary notification
          addNotification(
            "Votre comptable a été notifié et examinera vos documents.",
            "info"
          );
        } catch (error) {
          console.error("Error refreshing data after upload:", error);
          addNotification(
            "Documents uploadés mais erreur lors du rafraîchissement des données.",
            "warning"
          );
        }
      }, 1000);
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      
      // FIXED: Better error handling for limit errors
      let errorMessage = error.message || "Erreur lors de l'upload des fichiers";
      
      // Check if it's a limit error with refused documents
      if (errorMessage.includes("Maximum") && errorMessage.includes("refusé")) {
        errorMessage = "❌ Limite atteinte. Veuillez contacter votre comptable pour faire supprimer les documents refusés avant d'uploader de nouveaux fichiers.";
      }
      
      addNotification(errorMessage, "error");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addNotification = (message: string, type: Notification["type"]) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 5));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(0, 3));
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const getStatusText = (status: Dossier["status"]): string => {
    switch (status) {
      case "EN_ATTENTE":
        return "En Attente";
      case "EN_COURS":
        return "En Cours";
      case "COMPLET":
        return "Complet";
      case "VALIDE":
        return "Validé";
      default:
        return status;
    }
  };

  const getStatusColor = (status: Dossier["status"]): string => {
    switch (status) {
      case "EN_ATTENTE":
        return "bg-red-100 text-red-800";
      case "EN_COURS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLET":
        return "bg-blue-100 text-blue-800";
      case "VALIDE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDocumentStatusText = (status: DocumentRequest["status"]): string => {
    switch (status) {
      case "EN_ATTENTE":
        return "En attente";
      case "RECU":
        return "Reçu";
      case "VALIDE":
        return "Validé";
      case "REFUSE":
        return "Refusé";
      case "EXPIRE":
        return "Expiré";
      default:
        return status;
    }
  };

  const getDocumentStatusColor = (
    status: DocumentRequest["status"]
  ): string => {
    switch (status) {
      case "VALIDE":
        return "border-green-500 bg-green-50";
      case "RECU":
        return "border-yellow-500 bg-yellow-50";
      case "REFUSE":
        return "border-red-500 bg-red-50";
      case "EN_ATTENTE":
        return "border-red-400 bg-red-25";
      case "EXPIRE":
        return "border-gray-500 bg-gray-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const getDocumentStatusIcon = (status: DocumentRequest["status"]): string => {
    switch (status) {
      case "VALIDE":
        return "✅";
      case "RECU":
        return "🔄";
      case "REFUSE":
        return "❌";
      case "EN_ATTENTE":
        return "⚠️";
      case "EXPIRE":
        return "⏰";
      default:
        return "📄";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isDateSoon = (dateString?: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return date <= threeDaysFromNow && date >= now;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && dossiers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 p-5 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos dossiers...</p>
        </div>
      </div>
    );
  }

  if (error && dossiers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 p-5 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadClientData}
            disabled={isPending}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? "Chargement..." : "Réessayer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🏢 Système de Gestion Documentaire
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={loadClientData}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Actualisation..." : "🔄 Actualiser"}
              </button>
              <span>👤 Client</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Client Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📂 Mes Dossiers Documentaires
            </h2>
            <p className="mt-2 opacity-90">
              Consultez vos dossiers et uploadez les documents demandés
            </p>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-3 mb-8">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 flex items-start justify-between transition-all duration-300 ${
                    notification.type === "success"
                      ? "bg-blue-50 border-blue-500 text-blue-800"
                      : notification.type === "warning"
                      ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                      : notification.type === "error"
                      ? "bg-red-50 border-red-500 text-red-800"
                      : "bg-gray-50 border-gray-500 text-gray-800"
                  }`}
                >
                  <div className="flex-1">
                    <span>{notification.message}</span>
                    <div className="text-xs opacity-70 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats).map(([key, value], index) => {
              const labels = {
                dossiersActifs: "Dossiers Actifs",
                documentsUploades: "Documents Uploadés",
                enAttente: "En Attente",
                progression: "Progression",
              };

              return (
                <div
                  key={key}
                  className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-6 rounded-xl text-center shadow-lg transform hover:scale-105 transition-transform duration-200"
                >
                  <div className="text-3xl font-bold mb-2">
                    {typeof value === "number" && key === "progression"
                      ? `${value}%`
                      : value}
                  </div>
                  <div className="text-sm opacity-90 uppercase tracking-wide">
                    {labels[key as keyof typeof labels]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Rechercher un dossier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE">En Attente</option>
              <option value="EN_COURS">En Cours</option>
              <option value="COMPLET">Complet</option>
              <option value="VALIDE">Validé</option>
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={6}>6 par page</option>
              <option value={12}>12 par page</option>
              <option value={24}>24 par page</option>
            </select>
          </div>

          {/* Results Info */}
          {filteredDossiers.length > 0 && (
            <div className="mb-4 text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredDossiers.length)} sur {filteredDossiers.length} dossiers
            </div>
          )}

          {/* Dossiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentDossiers.map((dossier) => (
              <div
                key={dossier.id}
                className={`bg-white border rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden ${
                  dossier.isUrgent ||
                  (dossier.dateEcheance && isDateSoon(dossier.dateEcheance))
                    ? "border-red-500 animate-pulse ring-2 ring-red-200"
                    : "border-gray-200"
                }`}
              >
                {/* Progress bar at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      dossier.status === "EN_ATTENTE" ||
                      (dossier.dateEcheance && isDateSoon(dossier.dateEcheance))
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{ width: `${dossier.pourcentage}%` }}
                  ></div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-4 pt-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                      📁 {dossier.nom}
                    </h3>
                    <p
                      className={`text-sm ${
                        dossier.isUrgent ||
                        (dossier.dateEcheance &&
                          isDateSoon(dossier.dateEcheance))
                          ? "text-red-600 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      {dossier.dateCompletion
                        ? `Créé le ${formatDate(
                            dossier.dateCreation
                          )} • Complété le ${formatDate(
                            dossier.dateCompletion
                          )}`
                        : `Créé le ${formatDate(dossier.dateCreation)}${
                            dossier.dateEcheance
                              ? ` • Échéance: ${formatDate(
                                  dossier.dateEcheance
                                )}`
                              : ""
                          }`}
                    </p>
                    {(dossier.isUrgent ||
                      (dossier.dateEcheance &&
                        isDateSoon(dossier.dateEcheance))) && (
                      <p className="text-red-600 font-bold text-sm mt-1">
                        ⚠️ URGENT - Échéance:{" "}
                        {dossier.dateEcheance &&
                          formatDate(dossier.dateEcheance)}
                        !
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase whitespace-nowrap ml-2 ${getStatusColor(
                      dossier.status
                    )}`}
                  >
                    {getStatusText(dossier.status)}
                  </span>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      dossier.status === "EN_ATTENTE" ||
                      (dossier.dateEcheance && isDateSoon(dossier.dateEcheance))
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{ width: `${dossier.pourcentage}%` }}
                  ></div>
                </div>

                <p className="mb-4 text-sm">
                  <strong>
                    {dossier.documentsUpload} sur {dossier.documentsRequis}
                  </strong>{" "}
                  documents uploadés ({dossier.pourcentage}%)
                </p>

                {/* Urgent notification */}
                {(dossier.isUrgent ||
                  (dossier.dateEcheance &&
                    isDateSoon(dossier.dateEcheance))) && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-4">
                    🚨 <strong>Action requise:</strong> Documents manquants pour
                    l'échéance!
                  </div>
                )}

                {/* Documents */}
                {dossier.documentRequests &&
                  dossier.documentRequests.length > 0 && (
                    <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                      {dossier.documentRequests.map((docRequest) => {
                        // FIXED: Count only valid uploads for display
                        const validUploads = docRequest.uploads?.filter(
                          (u) => u.status === "VALIDE" || u.status === "EN_REVISION" || u.status === "EN_ATTENTE"
                        ) || [];
                        const refusedUploads = docRequest.uploads?.filter(
                          (u) => u.status === "REJETE"
                        ) || [];
                        
                        const uploadedCount = validUploads.length;
                        const countText = `${uploadedCount}/${docRequest.quantiteMin} documents`;

                        return (
                          <div
                            key={docRequest.id}
                            className={`p-3 rounded-lg border-l-4 flex justify-between items-center ${getDocumentStatusColor(
                              docRequest.status
                            )}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm flex items-center gap-2">
                                <span>
                                  {getDocumentStatusIcon(docRequest.status)}
                                </span>
                                <span className="truncate">
                                  {docRequest.titre}
                                </span>
                                {docRequest.obligatoire && (
                                  <span className="text-red-500 text-xs">
                                    *
                                  </span>
                                )}
                                {/* FIXED: Show refused count as warning */}
                                {refusedUploads.length > 0 && (
                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                    {refusedUploads.length} refusé(s)
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  docRequest.status === "VALIDE"
                                    ? "text-green-600"
                                    : docRequest.status === "RECU"
                                    ? "text-yellow-600"
                                    : docRequest.status === "REFUSE"
                                    ? "text-red-600"
                                    : docRequest.status === "EXPIRE"
                                    ? "text-gray-600"
                                    : "text-red-600"
                                }`}
                              >
                                {countText} •{" "}
                                {docRequest.status === "VALIDE"
                                  ? "Validé"
                                  : docRequest.status === "RECU"
                                  ? "En révision"
                                  : docRequest.status === "REFUSE"
                                  ? "Refusé - Nouvel upload requis"
                                  : docRequest.status === "EXPIRE"
                                  ? "Expiré"
                                  : "En attente"}
                                {/* FIXED: Show additional info for refused documents */}
                                {refusedUploads.length > 0 && docRequest.status === "EN_ATTENTE" && (
                                  <span className="block text-red-600 font-medium mt-1">
                                    ⚠️ Remplacer les documents refusés
                                  </span>
                                )}
                              </div>
                              {docRequest.description && (
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  {docRequest.description}
                                </div>
                              )}
                            </div>
                            {(() => {
                              const limitCheck = checkUploadLimits(docRequest);
                              const refusedUploads = docRequest.uploads?.filter((u) => u.status === "REJETE") || [];
                              
                              // Show upload button for these statuses
                              const canShowUploadButton = docRequest.status === "EN_ATTENTE" ||
                                                        docRequest.status === "RECU" ||
                                                        docRequest.status === "REFUSE";
                              
                              if (!canShowUploadButton) return null;
                              
                              // FIXED: Always allow upload if there are refused documents OR if under the limit
                              if (!limitCheck.canUpload && refusedUploads.length === 0) {
                                return (
                                  <div className="ml-2 px-3 py-2 bg-gray-300 text-gray-600 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1">
                                    🔒 Limite atteinte
                                  </div>
                                );
                              }
                              
                              return (
                                <button
                                  onClick={() => {
                                    console.log("Upload button clicked for:", docRequest.titre);
                                    openUploadModal(docRequest, dossier.id);
                                  }}
                                  className={`px-3 py-2 rounded-lg hover:shadow-md transform hover:-translate-y-1 transition-all duration-200 text-xs font-medium whitespace-nowrap ml-2 ${
                                    refusedUploads.length > 0
                                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse"
                                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                  }`}
                                >
                                  {refusedUploads.length > 0 ? "🔄 Remplacer" : "📤 Upload"}
                                </button>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Comptable info */}
                {dossier.comptable && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="text-xs text-gray-600">
                      <div>
                        <strong>Comptable:</strong> {dossier.comptable.user.nom}
                      </div>
                      <div>
                        <strong>Cabinet:</strong> {dossier.comptable.cabinet}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigateToDossierDetails(dossier.id)}
                    disabled={isPending}
                    className={`px-6 py-3 rounded-lg font-semibold transform hover:-translate-y-1 transition-all duration-200 shadow-lg w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      dossier.isUrgent ||
                      (dossier.dateEcheance && isDateSoon(dossier.dateEcheance))
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                        : dossier.status === "COMPLET" ||
                          dossier.status === "VALIDE"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    }`}
                  >
                    {isPending
                      ? "Chargement..."
                      : dossier.isUrgent ||
                        (dossier.dateEcheance &&
                          isDateSoon(dossier.dateEcheance))
                      ? "🚀 Compléter Maintenant"
                      : dossier.status === "COMPLET" ||
                        dossier.status === "VALIDE"
                      ? "🔍 Consulter"
                      : "👁️ Voir Détails"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Précédent
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        currentPage === pageNumber
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className="px-2">...</span>;
                }
                return null;
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant →
              </button>
            </div>
          )}

          {/* Empty state */}
          {filteredDossiers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Aucun dossier trouvé
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "ALL" 
                  ? "Essayez de modifier vos filtres de recherche."
                  : "Vous n'avez actuellement aucun dossier documentaire."}
              </p>
              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && currentDocRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeUploadModal();
          }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📤 Upload de Documents</h2>
              <button
                onClick={closeUploadModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">{currentDocRequest.titre}</h3>
              <p className="text-sm text-gray-600 mb-2">{currentDocRequest.description}</p>
              <p className="text-sm text-gray-700">
                <strong>Quantité requise:</strong> {currentDocRequest.quantiteMin} à {currentDocRequest.quantiteMax} document(s)
              </p>
              {currentDocRequest.obligatoire && (
                <p className="text-sm text-red-600 font-semibold mt-2">
                  * Document obligatoire
                </p>
              )}
              
              {/* FIXED: Show current upload status */}
              {(() => {
                const validUploads = currentDocRequest.uploads?.filter(
                  (u) => u.status === "VALIDE" || u.status === "EN_REVISION" || u.status === "EN_ATTENTE"
                ) || [];
                const refusedUploads = currentDocRequest.uploads?.filter((u) => u.status === "REJETE") || [];
                const maxAllowed = currentDocRequest.quantiteMax || 999;
                const availableSlots = maxAllowed - validUploads.length;
                
                if (refusedUploads.length > 0) {
                  return (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-semibold">
                        ⚠️ Vous avez {refusedUploads.length} document(s) refusé(s)
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Les nouveaux documents remplaceront automatiquement les documents refusés.
                        {availableSlots > 0 && ` Vous pouvez aussi ajouter ${availableSlots} document(s) supplémentaire(s).`}
                      </p>
                    </div>
                  );
                }
                
                if (availableSlots > 0) {
                  return (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Vous pouvez ajouter {availableSlots} document(s) supplémentaire(s)
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Documents actuels: {validUploads.length}/{maxAllowed}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Limite maximale atteinte ({validUploads.length}/{maxAllowed})
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Drag and drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-5xl mb-4">📁</div>
              <p className="text-gray-600 mb-2">
                Glissez et déposez vos fichiers ici
              </p>
              <p className="text-sm text-gray-500 mb-4">ou</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Choisir des fichiers
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-4">
                Formats acceptés: PDF, JPG, PNG (Max 10MB par fichier)
              </p>
            </div>

            {/* Selected files */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-3">Fichiers sélectionnés ({selectedFiles.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Upload en cours...</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
              <button
                onClick={closeUploadModal}
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={uploadFiles}
                disabled={selectedFiles.length === 0 || isUploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Upload en cours..." : `Uploader ${selectedFiles.length} fichier(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDossier && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeDetailModal()}
        >
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📂 {selectedDossier.nom}</h2>
              <button
                onClick={closeDetailModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-bold">{getStatusText(selectedDossier.status)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Progression</p>
                <p className="font-bold">{selectedDossier.pourcentage}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Documents</p>
                <p className="font-bold">{selectedDossier.documentsUpload}/{selectedDossier.documentsRequis}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-bold">{formatDate(selectedDossier.dateCreation)}</p>
              </div>
            </div>

            {selectedDossier.comptable && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold mb-2">👤 Comptable assigné</h3>
                <p><strong>Nom:</strong> {selectedDossier.comptable.user.nom}</p>
                <p><strong>Cabinet:</strong> {selectedDossier.comptable.cabinet}</p>
                <p><strong>Email:</strong> {selectedDossier.comptable.user.email}</p>
              </div>
            )}

            <h3 className="font-bold text-lg mb-4">📋 Documents demandés</h3>
            
            {selectedDossier.documentRequests && selectedDossier.documentRequests.length > 0 ? (
              <div className="space-y-4">
                {selectedDossier.documentRequests.map((docRequest) => {
                  const validUploads = docRequest.uploads?.filter(
                    (u) => u.status === "VALIDE" || u.status === "EN_REVISION" || u.status === "EN_ATTENTE"
                  ) || [];
                  const refusedUploads = docRequest.uploads?.filter(
                    (u) => u.status === "REJETE"
                  ) || [];
                  
                  return (
                    <div
                      key={docRequest.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-md flex items-center gap-2">
                            {docRequest.titre}
                            {docRequest.obligatoire && (
                              <span className="text-red-500 text-xs">*</span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{docRequest.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requis: {docRequest.quantiteMin} à {docRequest.quantiteMax} document(s)
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            docRequest.status === "VALIDE"
                              ? "bg-green-100 text-green-800"
                              : docRequest.status === "RECU"
                              ? "bg-blue-100 text-blue-800"
                              : docRequest.status === "REFUSE"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {docRequest.status}
                        </span>
                      </div>

                      {docRequest.uploads && docRequest.uploads.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold mb-2">Documents uploadés:</p>
                          <div className="space-y-2">
                            {docRequest.uploads.map((upload) => (
                              <div
                                key={upload.id}
                                className={`flex items-center gap-3 p-2 rounded text-sm ${
                                  upload.status === 'REJETE' 
                                    ? 'bg-red-50 border border-red-200' 
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    upload.status === "VALIDE"
                                      ? "bg-green-500"
                                      : upload.status === "REJETE"
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                  }`}
                                ></div>
                                <span className="flex-1">{upload.document.nomOriginal}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    upload.status === "VALIDE"
                                      ? "bg-green-100 text-green-800"
                                      : upload.status === "REJETE"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {upload.status === "VALIDE"
                                    ? "Validé"
                                    : upload.status === "REJETE"
                                    ? "Refusé"
                                    : "En révision"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(docRequest.status === "EN_ATTENTE" || 
                        docRequest.status === "RECU" || 
                        docRequest.status === "REFUSE" ||
                        refusedUploads.length > 0) && (
                        <button
                          onClick={() => {
                            closeDetailModal();
                            openUploadModal(docRequest, selectedDossier.id);
                          }}
                          className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                            refusedUploads.length > 0
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                          }`}
                        >
                          {refusedUploads.length > 0 ? "🔄 Remplacer les documents refusés" : "📤 Uploader des documents"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun document demandé pour ce dossier</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDetailModal}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientComponent;