"use server";

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
  status: 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET' | 'VALIDE';
}

export interface DocumentRequest {
  titre: string;
  description: string;
  typeDocument: string;
  obligatoire: boolean;
  quantiteMin: number;
  quantiteMax: number;
  formatAccepte: string;
  tailleMaxMo: number;
  instructions?: string;
  dateEcheance?: Date;
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

// New interfaces for document viewing
export interface DocumentUpload {
  id: number;
  status: 'VALIDE' | 'EN_REVISION' | 'REFUSE' | 'REMPLACE';
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
  status: 'EN_ATTENTE' | 'RECU' | 'VALIDE' | 'REFUSE' | 'EXPIRE';
  uploads: DocumentUpload[];
}

export interface DossierDetails {
  id: number;
  nom: string;
  description?: string;
  status: 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET' | 'VALIDE';
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

// API Actions
export async function getDossierTemplates(): Promise<DossierTemplate[]> {
  try {
    const data = await serverGet('dossiers/templates');
    return data || [];
  } catch (error) {
    console.error('Error fetching dossier templates:', error);
    throw new Error('Impossible de charger les modèles de dossiers');
  }
}

export async function getDossierProgress(batchId?: number): Promise<DossierProgressSummary> {
  try {
    const path = batchId ? `dossiers/progress?batchId=${batchId}` : 'dossiers/progress';
    const data = await serverGet(path);
    return {
      dossiers: data?.dossiers || [],
      totalDossiers: data?.totalDossiers || 0,
      completedDossiers: data?.completedDossiers || 0,
      pendingDossiers: data?.pendingDossiers || 0
    };
  } catch (error) {
    console.error('Error fetching dossier progress:', error);
    throw new Error('Impossible de charger le suivi des dossiers');
  }
}

export async function createMultiClientDossier(dossierData: CreateDossierData): Promise<DossierBatchResponse> {
  try {
    console.log(dossierData);
    const data = await serverPost('dossiers/multi-client', dossierData);
    return {
      success: true,
      dossiersCreated: data?.dossiersCreated || 0,
      message: data?.message || 'Dossiers créés avec succès',
      errors: data?.errors || []
    };
  } catch (error) {
    console.error('Error creating multi-client dossier:', error);
    throw new Error('Erreur lors de la création des dossiers');
  }
}

export async function getComptableClients() {
  try {
    const data = await serverGet('dossiers/clients');
    return data || [];
  } catch (error) {
    console.error('Error fetching comptable clients:', error);
    throw new Error('Impossible de charger les clients');
  }
}

export async function getComptableStatistics() {
  try {
    const data = await serverGet('dossiers/stats/dashboard');
    return data || {
      totalClients: 0,
      totalDossiers: 0,
      completedDossiers: 0,
      pendingDossiers: 0
    };
  } catch (error) {
    console.error('Error fetching comptable statistics:', error);
    throw new Error('Impossible de charger les statistiques');
  }
}

// NEW: Get detailed dossier information with uploaded documents
export async function getDossierDetails(dossierId: number): Promise<DossierDetails> {
  try {
    const data = await serverGet(`dossiers/${dossierId}`);
    return data;
  } catch (error) {
    console.error('Error fetching dossier details:', error);
    throw new Error('Impossible de charger les détails du dossier');
  }
}

// NEW: Validate or reject uploaded documents
export async function validateDocumentUpload(uploadId: number, action: 'VALIDE' | 'REFUSE', commentaire?: string) {
  try {
    const data = await serverPost(`dossiers/documents/${uploadId}/validate`, {
      action,
      commentaire
    });
    return data;
  } catch (error) {
    console.error('Error validating document:', error);
    throw new Error('Erreur lors de la validation du document');
  }
}



// Add this function to your API functions in the component or move it to your actions file

const validateDocument = async (uploadId: number, action: 'VALIDE' | 'REFUSE', commentaire?: string) => {
  try {
    const data = await serverPost(`dossiers/documents/${uploadId}/validate`, {
      action,
      commentaire
    });
    return data;
  } catch (error) {
    console.error('Error validating document:', error);
    throw new Error('Erreur lors de la validation du document');
  }
};
// NEW: Download document file
export async function downloadDocument(documentId: number) {
  try {
    const response = await serverGet(`/api/dossiers/documents/${documentId}/download`);
    return response;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Erreur lors du téléchargement du document');
  }
}

export async function duplicateDossier(originalDossierId: number, targetClientIds: number[], newNom?: string): Promise<DossierBatchResponse> {
  try {
    const data = await serverPost(`dossiers/${originalDossierId}/duplicate`, {
      targetClientIds,
      newNom
    });
    return {
      success: true,
      dossiersCreated: data?.dossiersCreated || 0,
      message: data?.message || 'Dossiers dupliqués avec succès',
      errors: data?.errors || []
    };
  } catch (error) {
    console.error('Error duplicating dossier:', error);
    throw new Error('Erreur lors de la duplication des dossiers');
  }
}

export async function archiveDossier(dossierId: number): Promise<void> {
  try {
    await serverPost(`dossiers/${dossierId}/archive`, {});
  } catch (error) {
    console.error('Error archiving dossier:', error);
    throw new Error('Erreur lors de l\'archivage du dossier');
  }
}

export async function updateDossierProgress(dossierId: number): Promise<void> {
  try {
    await serverPost(`dossiers/${dossierId}/progress`, {});
  } catch (error) {
    console.error('Error updating dossier progress:', error);
    throw new Error('Erreur lors de la mise à jour du suivi');
  }
}