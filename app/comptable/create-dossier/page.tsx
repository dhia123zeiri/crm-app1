"use client";

import React, { useState, useEffect } from "react";
import { useClients } from "../clients/actions/get-clients";
import { serverGet, serverPost } from "@/app/common/util/fetch";

// Types
export interface DossierTemplate {
  id: number;
  nom: string;
  documentsRequis: {
    typeDocument: string;
    obligatoire: boolean;
    quantiteMin: number;
    quantiteMax: number;
    formatAccepte: string;
    tailleMaxMo: number;
  }[];
}

export interface DossierProgress {
  id: number;
  nom: string;
  clientName: string;
  progress: number;
  documentsUpload: number;
  documentsRequis: number;
  status: "EN_ATTENTE" | "EN_COURS" | "COMPLET" | "VALIDE";
}

export interface DocumentRequest {
  titre: string;
  description: string;
  typeDocument: string;
  obligatoire: boolean;
  quantiteMin: number;
  quantiteMax: number;
  formatAccepte: string[];
  tailleMaxMo: number;
  instructions?: string;
  dateEcheance?: string;
}

export interface CreateDossierData {
  clientIds: number[];
  nom: string;
  description?: string;
  periode: string;
  dateEcheance?: Date;
  dossierTemplateId?: number;
  documentRequests: DocumentRequest[];
}

export interface DossierBatchResponse {
  success: boolean;
  dossiersCreated: number;
  message: string;
  errors?: string[];
}

export interface DossierProgressSummary {
  dossiers: DossierProgress[];
  totalDossiers: number;
  completedDossiers: number;
  pendingDossiers: number;
}

export interface DocumentUpload {
  id: number;
  status: "VALIDE" | "EN_REVISION" | "REFUSE" | "REMPLACE";
  dateUpload: Date;
  commentaire?: string;
  dateValidation?: Date;
  document: {
    id: number;
    nom: string;
    nomOriginal: string;
    taille: number;
    typeFichier: string;
    dateUpload: Date;
  };
}

export interface DocumentRequestDetails {
  id: number;
  titre: string;
  description: string;
  typeDocument: string;
  obligatoire: boolean;
  quantiteMin: number;
  quantiteMax: number;
  status: "EN_ATTENTE" | "RECU" | "VALIDE" | "REFUSE" | "EXPIRE";
  uploads: DocumentUpload[];
}

export interface DossierDetails {
  id: number;
  nom: string;
  description?: string;
  status: "EN_ATTENTE" | "EN_COURS" | "COMPLET" | "VALIDE";
  pourcentage: number;
  documentsUpload: number;
  documentsRequis: number;
  dateCreation: Date;
  dateEcheance?: Date;
  client: {
    id: number;
    raisonSociale: string;
    typeActivite?: string;
  };
  documentRequests: DocumentRequestDetails[];
}

export interface DocumentContent {
  id: number;
  content: string;
  contentType: string;
  filename: string;
}

interface Client {
  id: number;
  raisonSociale: string;
  typeActivite?: string;
  regimeFiscal?: string;
  derniereConnexion?: Date;
}

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: Date;
}

// Periods enum
const PERIODS = [
  { value: "JANVIER_2024", label: "Janvier 2024" },
  { value: "FEVRIER_2024", label: "Février 2024" },
  { value: "MARS_2024", label: "Mars 2024" },
  { value: "T1_2024", label: "T1 2024" },
  { value: "T2_2024", label: "T2 2024" },
  { value: "T3_2024", label: "T3 2024" },
  { value: "T4_2024", label: "T4 2024" },
  { value: "ANNUEL_2024", label: "Annuel 2024" },
];

// Document types enum
const DOCUMENT_TYPES = [
  "FACTURE_VENTE",
  "FACTURE_ACHAT",
  "RELEVE_BANCAIRE",
  "BULLETIN_PAIE",
  "DECLARATION_TVA",
  "JUSTIFICATIF_CHARGES",
  "CONTRAT",
  "AUTRE",
];

// API Functions
const getDossierTemplates = async (): Promise<DossierTemplate[]> => {
  try {
    const data = await serverGet("dossiers/templates");
    return data || [];
  } catch (error) {
    console.error("Error fetching dossier templates:", error);
    throw new Error("Impossible de charger les modèles de dossiers");
  }
};

const getDossierProgress = async (
  batchId?: number
): Promise<DossierProgressSummary> => {
  try {
    const path = batchId
      ? `dossiers/progress?batchId=${batchId}`
      : "dossiers/progress";
    const data = await serverGet(path);
    return {
      dossiers: data?.dossiers || [],
      totalDossiers: data?.totalDossiers || 0,
      completedDossiers: data?.completedDossiers || 0,
      pendingDossiers: data?.pendingDossiers || 0,
    };
  } catch (error) {
    console.error("Error fetching dossier progress:", error);
    throw new Error("Impossible de charger le suivi des dossiers");
  }
};

const createMultiClientDossier = async (
  dossierData: CreateDossierData
): Promise<DossierBatchResponse> => {
  try {
    console.log("Sending dossier data:", dossierData);
    const data = await serverPost("dossiers/multi-client", dossierData);
    return {
      success: true,
      dossiersCreated: data?.dossiersCreated || 0,
      message: data?.message || "Dossiers créés avec succès",
      errors: data?.errors || [],
    };
  } catch (error) {
    console.error("Error creating multi-client dossier:", error);
    throw new Error("Erreur lors de la création des dossiers");
  }
};

const getDossierDetails = async (
  dossierId: number
): Promise<DossierDetails> => {
  try {
    const data = await serverGet(`dossiers/${dossierId}`);
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching dossier details:", error);
    throw new Error("Impossible de charger les détails du dossier");
  }
};

const getDocumentContent = async (
  documentId: number
): Promise<DocumentContent> => {
  try {
    console.log("📡 API call - getDocumentContent with ID:", documentId);

    if (!documentId || isNaN(documentId)) {
      throw new Error(`Invalid document ID provided: ${documentId}`);
    }

    const data = await serverGet(`dossiers/documents/${documentId}/view`);
    console.log("📥 API response:", data);
    return data;
  } catch (error) {
    console.error("💥 API Error in getDocumentContent:", error);
    throw new Error("Impossible de charger le contenu du document");
  }
};

const validateDocument = async (
  uploadId: number,
  action: "VALIDE" | "REFUSE",
  commentaire?: string
) => {
  console.log("🚀 validateDocument API call with:", {
    uploadId,
    action,
    commentaire,
  });

  try {
    const requestPayload = {
      action,
      commentaire,
    };
    console.log("📦 Request payload:", requestPayload);

    const data = await serverPost(
      `dossiers/documents/${uploadId}/validate`,
      requestPayload
    );
    console.log("📥 API response:", data);
    return data;
  } catch (error) {
    console.error("💥 API error:", error);
    throw error;
  }
};

const validateCompleteDossier = async (
  dossierId: number,
  commentaire?: string
) => {
  try {
    const requestPayload = {
      commentaire,
    };

    const data = await serverPost(
      `dossiers/${dossierId}/validate`,
      requestPayload
    );

    return data;
  } catch (error) {
    console.error("Error validating dossier:", error);
    throw error;
  }
};

// NEW: Download document function
const downloadDocumentApi = async (documentId: number): Promise<Blob> => {
  try {
    console.log("📥 Starting download for document:", documentId);

    if (!documentId || isNaN(documentId)) {
      throw new Error(`Invalid document ID: ${documentId}`);
    }

    const response = await fetch(`/api/download/${documentId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("💥 Download error:", error);
    throw new Error("Erreur lors du téléchargement du document");
  }
};

const ComptableComponent: React.FC = () => {
  const {
    clients,
    loading: isLoadingClients,
    error: clientsError,
    loadClients: fetchClients,
  } = useClients();

  // Form state
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    number | undefined
  >();
  const [dossierName, setDossierName] = useState<string>("");
  const [dossierDescription, setDossierDescription] = useState<string>("");
  const [dateEcheance, setDateEcheance] = useState<string>("");

  // Data state
  const [templates, setTemplates] = useState<DossierTemplate[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(
    []
  );
  const [dossierProgress, setDossierProgress] = useState<DossierProgress[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Document viewer state
  const [selectedDossier, setSelectedDossier] = useState<DossierDetails | null>(
    null
  );
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Document content viewer state
  const [viewingDocument, setViewingDocument] =
    useState<DocumentContent | null>(null);
  const [showDocumentContent, setShowDocumentContent] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Download state - NEW
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState<string>("");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDossiers = dossierProgress.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(dossierProgress.length / itemsPerPage);

  // Load initial data
  useEffect(() => {
    fetchClients();
    loadTemplates();
    loadDossierProgressData();

    setDocumentRequests([
      {
        titre: "Factures de Vente",
        description: "Toutes les factures de vente du mois",
        typeDocument: "FACTURE_VENTE",
        obligatoire: true,
        quantiteMin: 1,
        quantiteMax: 50,
        formatAccepte: ["PDF", "JPG", "PNG"],
        tailleMaxMo: 10,
        instructions: "Fournir toutes les factures de vente",
      },
      {
        titre: "Relevés Bancaires",
        description: "Relevés bancaires du mois",
        typeDocument: "RELEVE_BANCAIRE",
        obligatoire: true,
        quantiteMin: 1,
        quantiteMax: 5,
        formatAccepte: ["PDF"],
        tailleMaxMo: 5,
        instructions: "Un relevé par compte bancaire",
      },
    ]);
  }, []);

  // Auto-refresh progress data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoadingProgress) {
        loadDossierProgressData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoadingProgress]);

  // Load templates
  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const templatesData = await getDossierTemplates();
      setTemplates(templatesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des modèles"
      );
      console.error("Error loading templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load dossier progress
  const loadDossierProgressData = async () => {
    try {
      setIsLoadingProgress(true);
      const progressData = await getDossierProgress();
      setDossierProgress(progressData.dossiers || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du suivi"
      );
      console.error("Error loading progress:", err);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Load dossier details for document viewing
  const loadDossierDetails = async (dossierId: number) => {
    try {
      setIsLoadingDetails(true);
      const details = await getDossierDetails(dossierId);
      setSelectedDossier(details);
      setShowDocumentViewer(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des détails"
      );
      addNotification(
        err instanceof Error ? err.message : "Erreur lors du chargement",
        "error"
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Load and view document content
  const viewDocumentContent = async (documentId: number) => {
    try {
      console.log(
        "🔍 viewDocumentContent called with documentId:",
        documentId,
        "type:",
        typeof documentId
      );

      if (!documentId || isNaN(Number(documentId))) {
        console.error("❌ Invalid document ID:", documentId);
        throw new Error(`ID de document invalide: ${documentId}`);
      }

      setIsLoadingDocument(true);
      setError("");

      const content = await getDocumentContent(Number(documentId));
      setViewingDocument(content);
      setShowDocumentContent(true);
    } catch (err) {
      console.error("❌ Error in viewDocumentContent:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du document";
      setError(errorMessage);
      addNotification(errorMessage, "error");
    } finally {
      setIsLoadingDocument(false);
    }
  };

  // NEW: Handle document download
  const handleDownload = async (documentId: number, filename: string) => {
    try {
      console.log("📥 handleDownload called:", { documentId, filename });

      if (!documentId || isNaN(documentId)) {
        throw new Error("ID de document invalide");
      }

      setDownloadingDocId(documentId);

      // Get document content (already base64 encoded)
      const docContent = await getDocumentContent(documentId);

      // Convert base64 to blob
      const byteCharacters = atob(docContent.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: docContent.contentType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || docContent.filename || "document";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addNotification(
        `Document "${filename}" téléchargé avec succès`,
        "success"
      );
      console.log("✅ Download completed successfully");
    } catch (err) {
      console.error("❌ Download error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors du téléchargement";
      addNotification(errorMessage, "error");
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Handle document validation
  const handleDocumentValidation = async (
    uploadId: number,
    action: "VALIDE" | "REFUSE",
    commentaire?: string
  ) => {
    console.log("🔍 handleDocumentValidation called with:", {
      uploadId,
      action,
      commentaire,
    });

    try {
      setIsLoading(true);

      addNotification(
        `${action === "VALIDE" ? "Validation" : "Refus"} en cours...`,
        "info"
      );

      const result = await validateDocument(uploadId, action, commentaire);

      console.log("✅ validateDocument completed successfully:", result);

      addNotification(
        result?.message ||
          `Document ${action === "VALIDE" ? "validé" : "refusé"} avec succès`,
        "success"
      );

      if (selectedDossier) {
        console.log("🔄 Reloading dossier details...");
        await loadDossierDetails(selectedDossier.id);
      }

      console.log("🔄 Reloading progress data...");
      await loadDossierProgressData();
    } catch (err: any) {
      console.error("❌ Error in handleDocumentValidation:", err);

      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        `Erreur lors de la ${action === "VALIDE" ? "validation" : "refus"}`;

      setError(errorMessage);
      addNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Validate dossier
  const validateDossier = async (dossierId: number) => {
    try {
      setIsLoading(true);

      const confirmMessage =
        "Êtes-vous sûr de vouloir valider et archiver ce dossier ?";
      if (!window.confirm(confirmMessage)) {
        return;
      }

      const commentaire = prompt("Commentaire de validation (optionnel):");

      addNotification("Validation du dossier en cours...", "info");

      const result = await validateCompleteDossier(
        dossierId,
        commentaire || undefined
      );

      addNotification(
        result?.message || "Dossier validé et archivé avec succès",
        "success"
      );

      if (selectedDossier && selectedDossier.id === dossierId) {
        await loadDossierDetails(dossierId);
      }

      await loadDossierProgressData();
    } catch (err: any) {
      console.error("Error validating dossier:", err);

      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de la validation du dossier";

      setError(errorMessage);
      addNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add notification system
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

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(0, 3));
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  // Add manual refresh functionality
  const handleManualRefresh = async () => {
    await loadDossierProgressData();
    addNotification("Données actualisées", "success");
  };

  // Handle client selection
  const handleClientChange = (clientId: number, checked: boolean) => {
    if (checked) {
      setSelectedClientIds((prev) => [...prev, clientId]);
    } else {
      setSelectedClientIds((prev) => prev.filter((id) => id !== clientId));
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const id = parseInt(templateId);
    setSelectedTemplateId(isNaN(id) ? undefined : id);

    if (!isNaN(id)) {
      const template = templates.find((t) => t.id === id);
      if (template) {
        const templateRequests: DocumentRequest[] =
          template.documentsRequis.map((doc) => ({
            titre: getDocumentTypeLabel(doc.typeDocument),
            description: `${getDocumentTypeLabel(doc.typeDocument)} requis`,
            typeDocument: doc.typeDocument,
            obligatoire: doc.obligatoire,
            quantiteMin: doc.quantiteMin,
            quantiteMax: doc.quantiteMax,
            formatAccepte: doc.formatAccepte.split(",").map((f) => f.trim()),
            tailleMaxMo: doc.tailleMaxMo,
          }));
        setDocumentRequests(templateRequests);
      }
    }
  };

  // Helper function to get document type label
  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      FACTURE_VENTE: "Factures de Vente",
      FACTURE_ACHAT: "Factures d'Achat",
      RELEVE_BANCAIRE: "Relevés Bancaires",
      BULLETIN_PAIE: "Bulletins de Paie",
      DECLARATION_TVA: "Déclarations TVA",
      JUSTIFICATIF_CHARGES: "Justificatifs Charges",
      CONTRAT: "Contrats",
      AUTRE: "Autre",
    };
    return labels[type] || type;
  };

  // Document request management
  const addDocumentRequest = () => {
    const newRequest: DocumentRequest = {
      titre: "Nouveau Document",
      description: "Description du document",
      typeDocument: "AUTRE",
      obligatoire: true,
      quantiteMin: 1,
      quantiteMax: 5,
      formatAccepte: ["PDF"],
      tailleMaxMo: 5,
    };
    setDocumentRequests((prev) => [...prev, newRequest]);
  };

  const removeRequest = (index: number) => {
    setDocumentRequests((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocumentRequest = (
    index: number,
    field: keyof DocumentRequest,
    value: any
  ) => {
    setDocumentRequests((prev) =>
      prev.map((req, i) => (i === index ? { ...req, [field]: value } : req))
    );
  };

  const handleFormatAccepteChange = (index: number, value: string) => {
    const formats = value
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    updateDocumentRequest(index, "formatAccepte", formats);
  };

  // Create dossier
  const createDossier = async () => {
    if (selectedClientIds.length === 0) {
      setError("Veuillez sélectionner au moins un client");
      return;
    }

    if (!selectedPeriod) {
      setError("Veuillez sélectionner une période");
      return;
    }

    if (!dossierName.trim()) {
      setError("Veuillez saisir un nom de dossier");
      return;
    }

    if (documentRequests.length === 0) {
      setError("Veuillez ajouter au moins une demande de document");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const createData: CreateDossierData = {
        clientIds: selectedClientIds,
        nom: dossierName,
        description: dossierDescription || undefined,
        periode: selectedPeriod,
        dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
        dossierTemplateId: selectedTemplateId,
        documentRequests,
      };

      const result = await createMultiClientDossier(createData);

      if (result.success) {
        addNotification(
          `Succès! ${result.dossiersCreated} dossier(s) créé(s) avec succès! ${result.message}`,
          "success"
        );

        // Reset form
        setSelectedClientIds([]);
        setSelectedPeriod("");
        setSelectedTemplateId(undefined);
        setDossierName("");
        setDossierDescription("");
        setDateEcheance("");

        // Reload progress
        loadDossierProgressData();
      } else {
        throw new Error(result.message || "Erreur lors de la création");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du dossier"
      );
      addNotification(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du dossier",
        "error"
      );
      console.error("Error creating dossier:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EN_COURS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLET":
        return "bg-blue-100 text-blue-800";
      case "VALIDE":
        return "bg-green-100 text-green-800";
      case "EN_ATTENTE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "EN_COURS":
        return "En Cours";
      case "COMPLET":
        return "Complet";
      case "VALIDE":
        return "Validé";
      case "EN_ATTENTE":
        return "En Attente";
      default:
        return status;
    }
  };

  const getUploadStatusColor = (status: string) => {
    switch (status) {
      case "VALIDE":
        return "bg-green-100 text-green-800";
      case "EN_REVISION":
        return "bg-yellow-100 text-yellow-800";
      case "REFUSE":
        return "bg-red-100 text-red-800";
      case "REMPLACE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUploadStatusText = (status: string) => {
    switch (status) {
      case "VALIDE":
        return "Validé";
      case "EN_REVISION":
        return "En Révision";
      case "REFUSE":
        return "Refusé";
      case "REMPLACE":
        return "Remplacé";
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  // Render document content based on type
  const renderDocumentContent = (documentContent: DocumentContent) => {
    const { contentType, content, filename } = documentContent;

    if (contentType.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          <img
            src={`data:${contentType};base64,${content}`}
            alt={filename}
            className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    } else if (contentType === "application/pdf") {
      return (
        <div className="flex justify-center">
          <iframe
            src={`data:${contentType};base64,${content}`}
            className="w-full h-[600px] rounded-lg shadow-lg"
            title={filename}
          />
        </div>
      );
    } else if (contentType.startsWith("text/")) {
      const textContent = atob(content);
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm max-h-[600px] overflow-y-auto">
            {textContent}
          </pre>
        </div>
      );
    } else {
      return (
        <div className="text-center p-8">
          <div className="text-gray-500 mb-4">
            Prévisualisation non disponible pour ce type de fichier:{" "}
            {contentType}
          </div>
          <button
            onClick={() => {
              const link = window.document.createElement("a");
              link.href = `data:${contentType};base64,${content}`;
              link.download = filename;
              link.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Télécharger le fichier
          </button>
        </div>
      );
    }
  };

  // Pagination handlers
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Système de Gestion Documentaire
            </h1>
            <button
              onClick={handleManualRefresh}
              disabled={isLoadingProgress || isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoadingProgress || isLoading
                ? "Actualisation..."
                : "Actualiser"}
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
              {error}
              <button
                onClick={() => setError("")}
                className="ml-4 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-3 mb-8">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 flex items-start justify-between transition-all duration-300 ${
                    notification.type === "success"
                      ? "bg-green-50 border-green-500 text-green-800"
                      : notification.type === "warning"
                      ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                      : notification.type === "error"
                      ? "bg-red-50 border-red-500 text-red-800"
                      : "bg-blue-50 border-blue-500 text-blue-800"
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

          {/* Document Content Viewer Modal */}
          {showDocumentContent && viewingDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">
                      Prévisualisation: {viewingDocument.filename}
                    </h2>
                    <button
                      onClick={() => {
                        setShowDocumentContent(false);
                        setViewingDocument(null);
                      }}
                      className="text-white hover:text-gray-300 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {isLoadingDocument ? (
                    <div className="text-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">
                        Chargement du document...
                      </p>
                    </div>
                  ) : (
                    renderDocumentContent(viewingDocument)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Document Viewer Modal */}
          {showDocumentViewer && selectedDossier && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedDossier.nom}
                      </h2>
                      <p className="opacity-90 mt-1">
                        Client: {selectedDossier.client.raisonSociale}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDocumentViewer(false)}
                      className="text-white hover:text-gray-300 text-2xl font-bold"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${selectedDossier.pourcentage}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm">
                      {selectedDossier.pourcentage}% -{" "}
                      {selectedDossier.documentsUpload} documents reçus sur{" "}
                      {selectedDossier.documentsRequis} requis
                    </p>
                  </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {isLoadingDetails ? (
                    <div className="text-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">
                        Chargement des documents...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedDossier.status === "COMPLET" && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-green-800 mb-2">
                                Dossier prêt à être validé
                              </h4>
                              <p className="text-green-700 text-sm">
                                Tous les documents requis ont été validés.
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                validateDossier(selectedDossier.id)
                              }
                              disabled={isLoading}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {isLoading ? "Validation..." : "Valider Dossier"}
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedDossier.documentRequests.map((request) => (
                        <div
                          key={request.id}
                          className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {request.titre}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                    request.status
                                  )}`}
                                >
                                  {getStatusText(request.status)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {request.quantiteMin} -{" "}
                                  {request.quantiteMax || "∞"} documents requis
                                </span>
                                {request.obligatoire && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    Obligatoire
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3">
                              Documents reçus ({request.uploads.length})
                            </h4>
                            {request.uploads.length === 0 ? (
                              <p className="text-gray-500 text-sm italic">
                                Aucun document reçu
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {request.uploads.map((upload) => (
                                  <div
                                    key={upload.id}
                                    className="bg-white rounded-lg p-4 border"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-gray-900">
                                          {upload.document.nomOriginal}
                                        </h5>
                                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                                          <p>
                                            Taille:{" "}
                                            {formatFileSize(
                                              upload.document.taille
                                            )}
                                          </p>
                                          <p>
                                            Type: {upload.document.typeFichier}
                                          </p>
                                          <p>
                                            Uploadé le:{" "}
                                            {new Date(
                                              upload.dateUpload
                                            ).toLocaleString("fr-FR")}
                                          </p>
                                          {upload.commentaire && (
                                            <p>
                                              Commentaire: {upload.commentaire}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <span
                                          className={`px-2 py-1 rounded text-xs font-medium ${getUploadStatusColor(
                                            upload.status
                                          )}`}
                                        >
                                          {getUploadStatusText(upload.status)}
                                        </span>
                                        {/* UPDATED BUTTONS SECTION WITH DOWNLOAD */}
                                        <div className="flex gap-2 flex-wrap justify-end">
                                          <button
                                            onClick={() =>
                                              viewDocumentContent(
                                                upload.document.id
                                              )
                                            }
                                            disabled={isLoadingDocument}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                          >
                                            {isLoadingDocument ? "..." : "Voir"}
                                          </button>
                                          {/* DOWNLOAD BUTTON - NEW */}
                                          <button
                                            onClick={() =>
                                              handleDownload(
                                                upload.document.id,
                                                upload.document.nomOriginal
                                              )
                                            }
                                            disabled={
                                              downloadingDocId ===
                                              upload.document.id
                                            }
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                            title="Télécharger le document"
                                          >
                                            {downloadingDocId ===
                                            upload.document.id ? (
                                              <svg
                                                className="animate-spin h-3 w-3"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                              >
                                                <circle
                                                  className="opacity-25"
                                                  cx="12"
                                                  cy="12"
                                                  r="10"
                                                  stroke="currentColor"
                                                  strokeWidth="4"
                                                ></circle>
                                                <path
                                                  className="opacity-75"
                                                  fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                              </svg>
                                            ) : (
                                              <>
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="h-3 w-3"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                  />
                                                </svg>
                                                Télécharger
                                              </>
                                            )}
                                          </button>
                                          {upload.status === "EN_REVISION" && (
                                            <>
                                              <button
                                                onClick={() =>
                                                  handleDocumentValidation(
                                                    upload.id,
                                                    "VALIDE"
                                                  )
                                                }
                                                disabled={isLoading}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                              >
                                                {isLoading ? "..." : "Valider"}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  const commentaire = prompt(
                                                    "Raison du refus (optionnel):"
                                                  );
                                                  handleDocumentValidation(
                                                    upload.id,
                                                    "REFUSE",
                                                    commentaire || undefined
                                                  );
                                                }}
                                                disabled={isLoading}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                              >
                                                {isLoading ? "..." : "Refuser"}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comptable Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Panneau de Contrôle Comptable
            </h2>
            <p className="mt-2 opacity-90">
              Créez des dossiers et gérez les demandes de documents pour vos
              clients
            </p>
          </div>

          {/* Create Dossier Form */}
          <div className="bg-gray-50 p-6 rounded-xl mb-8 border-l-4 border-red-500">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              Créer un Nouveau Dossier
            </h3>

            {/* Client Selection */}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-700">
                Clients ({selectedClientIds.length} sélectionné
                {selectedClientIds.length > 1 ? "s" : ""})
              </label>
              {isLoadingClients ? (
                <div className="p-4 text-center text-gray-500">
                  Chargement des clients...
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                  {clients.length === 0 ? (
                    <div className="text-center text-gray-500">
                      Aucun client trouvé
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <label
                          key={client.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClientIds.includes(client.id)}
                            onChange={(e) =>
                              handleClientChange(client.id, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {client.raisonSociale}
                            </div>
                            {client.typeActivite && (
                              <div className="text-sm text-gray-600">
                                {client.typeActivite}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Période
                </label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="">Sélectionner une période</option>
                  {PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Modèle (optionnel)
                </label>
                {isLoadingTemplates ? (
                  <div className="p-3 text-center text-gray-500 border-2 border-gray-200 rounded-lg">
                    Chargement...
                  </div>
                ) : (
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    value={selectedTemplateId || ""}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  >
                    <option value="">Aucun modèle</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.nom}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Nom du Dossier
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  value={dossierName}
                  onChange={(e) => setDossierName(e.target.value)}
                  placeholder="Ex: Comptabilité Mensuelle"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Date d'échéance (optionnel)
                </label>
                <input
                  type="date"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-700">
                Description (optionnel)
              </label>
              <textarea
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                value={dossierDescription}
                onChange={(e) => setDossierDescription(e.target.value)}
                placeholder="Description du dossier..."
                rows={3}
              />
            </div>

            {/* Document Requests */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-md font-bold mb-4">
                Documents Requis ({documentRequests.length})
              </h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {documentRequests.map((request, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1">
                            Titre
                          </label>
                          <input
                            type="text"
                            value={request.titre}
                            onChange={(e) =>
                              updateDocumentRequest(
                                index,
                                "titre",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">
                            Type
                          </label>
                          <select
                            value={request.typeDocument}
                            onChange={(e) =>
                              updateDocumentRequest(
                                index,
                                "typeDocument",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                          >
                            {DOCUMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {getDocumentTypeLabel(type)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRequest(index)}
                        className="ml-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-red-700"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Quantité Min
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={request.quantiteMin}
                          onChange={(e) =>
                            updateDocumentRequest(
                              index,
                              "quantiteMin",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Quantité Max
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={request.quantiteMax}
                          onChange={(e) =>
                            updateDocumentRequest(
                              index,
                              "quantiteMax",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Taille Max (Mo)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={request.tailleMaxMo}
                          onChange={(e) =>
                            updateDocumentRequest(
                              index,
                              "tailleMaxMo",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Formats Acceptés
                        </label>
                        <input
                          type="text"
                          value={
                            Array.isArray(request.formatAccepte)
                              ? request.formatAccepte.join(",")
                              : request.formatAccepte
                          }
                          onChange={(e) =>
                            handleFormatAccepteChange(index, e.target.value)
                          }
                          placeholder="PDF,JPG,PNG"
                          className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={request.obligatoire}
                            onChange={(e) =>
                              updateDocumentRequest(
                                index,
                                "obligatoire",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-semibold">
                            Obligatoire
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold mb-1">
                        Description
                      </label>
                      <textarea
                        value={request.description}
                        onChange={(e) =>
                          updateDocumentRequest(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addDocumentRequest}
                className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold"
              >
                + Ajouter Document
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={createDossier}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold text-lg disabled:opacity-50"
              >
                {isLoading ? "Création en cours..." : "Créer le Dossier"}
              </button>
            </div>
          </div>
          {/* Progress Tracking with Pagination */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Suivi des Dossiers Clients
              </h3>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600">
                  Afficher:
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="ml-2 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                  </select>
                </label>
                <span className="text-sm text-gray-600">
                  Total: {dossierProgress.length} dossiers
                </span>
              </div>
            </div>

            {isLoadingProgress ? (
              <div className="text-center p-8 text-gray-500">
                Chargement du suivi...
              </div>
            ) : dossierProgress.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Aucun dossier trouvé
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentDossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      className="bg-gray-50 p-6 rounded-lg relative"
                    >
                      <h4 className="font-bold text-lg mb-2">
                        {dossier.clientName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {dossier.nom}
                      </p>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${dossier.progress}%` }}
                        ></div>
                      </div>

                      <p className="mb-4">
                        <strong>{dossier.progress}%</strong> -{" "}
                        {dossier.documentsUpload}/{dossier.documentsRequis}{" "}
                        documents reçus
                      </p>

                      <div className="flex justify-between items-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                            dossier.status
                          )}`}
                        >
                          {getStatusText(dossier.status)}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => loadDossierDetails(dossier.id)}
                            disabled={isLoadingDetails || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isLoadingDetails || isLoading
                              ? "Chargement..."
                              : "Voir Documents"}
                          </button>

                          {dossier.status === "COMPLET" && (
                            <button
                              onClick={() => validateDossier(dossier.id)}
                              disabled={isLoading}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {isLoading ? "..." : "Valider"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Précédent
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  currentPage === page
                                    ? "bg-blue-600 text-white font-semibold"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="px-2 py-2 text-gray-500"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="mt-4 text-center text-sm text-gray-600">
                  Affichage de {indexOfFirstItem + 1} à{" "}
                  {Math.min(indexOfLastItem, dossierProgress.length)} sur{" "}
                  {dossierProgress.length} dossiers (Page {currentPage} sur{" "}
                  {totalPages})
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComptableComponent;
