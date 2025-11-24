// app/actions/dossier-client.ts
"use server";

import { serverGet, serverPost, serverUpload } from "@/app/common/util/fetch";



export interface DocumentUpload {
  id: number;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'EN_REVISION';
  dateUpload: string;
  document: {
    nom: string;
    nomOriginal: string;
    taille: number;
  };
}

export interface DocumentRequest {
  id: number;
  titre: string;
  description: string;
  typeDocument: string;
  obligatoire: boolean;
  quantiteMin: number;
  quantiteMax: number;
  status: 'EN_ATTENTE' | 'RECU' | 'VALIDE' | 'REFUSE' | 'EXPIRE';
  uploads: DocumentUpload[];
  dateEcheance?: string;
  instructions?: string;
}

export interface Dossier {
  id: number;
  nom: string;
  dateCreation: string;
  dateEcheance?: string;
  dateCompletion?: string;
  status: 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET' | 'VALIDE';
  pourcentage: number;
  documentRequests: DocumentRequest[];
  isUrgent?: boolean;
  documentsRequis: number;
  documentsUpload: number;
  comptable?: {
    cabinet: string;
    user: {
      nom: string;
      email: string;
    };
  };
}

export interface ClientDossierResponse {
  dossiers: Dossier[];
  summary: {
    total: number;
    enCours: number;
    enAttente: number;
    complets: number;
    valides: number;
    urgents: number;
  };
}

export interface UploadResponse {
  success: boolean;
  uploadedCount: number;
  documentUploads: Array<{
    id: number;
    status: string;
    dateUpload: string;
    document: {
      nom: string;
      nomOriginal: string;
      taille: number;
      dateUpload: string;
    };
  }>;
  message: string;
}

/**
 * Fetch all dossiers for the authenticated client
 */
export async function fetchClientsDossier(): Promise<ClientDossierResponse> {
  try {
    const data = await serverGet('client/dossiers');
    return data;
  } catch (error) {
    console.error('Error fetching client dossiers:', error);
    throw new Error('Impossible de charger les dossiers. Veuillez réessayer.');
  }
}

/**
 * Fetch detailed information for a specific dossier
 */
export async function fetchDossierDetails(dossierId: number): Promise<Dossier> {
  try {
    const data = await serverGet(`client/dossiers/${dossierId}`);
    return data;
  } catch (error) {
    console.error('Error fetching dossier details:', error);
    throw new Error('Impossible de charger les détails du dossier. Veuillez réessayer.');
  }
}

/**
 * Upload documents for a specific document request
 */
export async function uploadDocuments(
  dossierId: number,
  requestId: number,
  files: File[]
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const data = await serverUpload(`client/dossiers/${dossierId}/documents/${requestId}/upload`, formData);
    return data;
  } catch (error: any) {
    console.error('Error uploading documents:', error);
    
    // Simply re-throw the error from serverUpload since it already handles error formatting
    throw error;
  }
}

/**
 * Get client statistics
 */
export async function fetchClientStats(): Promise<{
  totalDossiers: number;
  completedDossiers: number;
  inProgressDossiers: number;
  pendingDossiers: number;
  totalDocumentUploads: number;
  pendingDocumentRequests: number;
  urgentDossiers: number;
  completionRate: number;
}> {
  try {
    const data = await serverGet('client/stats');
    return data;
  } catch (error) {
    console.error('Error fetching client stats:', error);
    throw new Error('Impossible de charger les statistiques.');
  }
}

/**
 * Get client notifications
 */
export async function fetchClientNotifications(limit = 10, offset = 0): Promise<{
  notifications: Array<{
    id: number;
    titre: string;
    message: string;
    type: string;
    lu: boolean;
    dateCreation: string;
  }>;
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}> {
  try {
    const data = await serverGet(`client/notifications?limit=${limit}&offset=${offset}`);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Impossible de charger les notifications.');
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: number): Promise<void> {
  try {
    await serverPost(`client/notifications/${notificationId}/read`, {});
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Impossible de marquer la notification comme lue.');
  }
}

/**
 * Fetch all dossiers for the authenticated client (simple version)
 */
export async function fetchDossiersClient() {
  try {
    const data = await serverGet('client/dossiers/Dossiersclient');
    return data;
  } catch (error) {
    console.error('Error fetching dossiers:', error);
    throw new Error('Impossible de charger les dossiers. Veuillez réessayer.');
  }
}