"use server";

import { serverDownload, serverGet, serverPost } from "@/app/common/util/fetch";

// ============================================
// TYPES
// ============================================

export interface LigneFacture {
  id: number;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  ordre: number;
}

export interface Facture {
  id: number;
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  status: 'BROUILLON' | 'VALIDEE' | 'ENVOYEE' | 'PAYEE' | 'ANNULEE' | 'EN_RETARD';
  notes: string | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  dateCreation: string;
  dateModification: string;
  dateValidation: string | null;
  dateEnvoi: string | null;
  datePaiement: string | null;
  lignes: LigneFacture[];
  comptable: {
    cabinet: string;
    numeroOrdre: string;
    user?: {
      email: string;
      nom: string;
    };
  };
  client?: {
    raisonSociale: string;
    siret: string;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    telephone: string | null;
    user: {
      email: string;
      nom: string;
    };
  };
}

export interface CabinetInfo {
  cabinet: string;
  numeroOrdre: string;
}

export interface ClientInfo {
  id: number;
  raisonSociale: string;
  siret: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
  user: {
    email: string;
    nom: string;
  };
}

export interface CreateLigneFactureDto {
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
}

export interface CreateFactureDto {
  clientId: number;
  dateEcheance: string;
  notes?: string;
  lignes: CreateLigneFactureDto[];
}

// ============================================
// CLIENT API FUNCTIONS
// ============================================

/**
 * Récupère toutes les factures du client connecté
 */
export async function getClientFactures(): Promise<Facture[]> {
  try {
    const factures = await serverGet('factures/client/mes-factures');
    return factures;
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error);
    throw error;
  }
}

/**
 * Récupère une facture spécifique du client connecté
 */
export async function getClientFacture(factureId: number): Promise<Facture> {
  try {
    const facture = await serverGet(`factures/client/facture/${factureId}`);
    return facture;
  } catch (error) {
    console.error('Erreur lors du chargement de la facture:', error);
    throw error;
  }
}

// ============================================
// COMPTABLE API FUNCTIONS
// ============================================

/**
 * Récupère les informations du cabinet du comptable connecté
 */
export async function getCabinetInfo(): Promise<CabinetInfo> {
  try {
    const info = await serverGet('factures/cabinet');
    return info;
  } catch (error) {
    console.error('Erreur lors du chargement des infos cabinet:', error);
    throw error;
  }
}

/**
 * Récupère les informations d'un client spécifique
 */
export async function getClientInfo(clientId: number): Promise<ClientInfo> {
  try {
    const info = await serverGet(`factures/comptable/client/${clientId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors du chargement des infos client:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle facture
 */
export async function createFacture(data: CreateFactureDto): Promise<{ success: boolean; facture: Facture }> {
  try {
    const result = await serverPost('factures', data);
    return result;
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    throw error;
  }
}

/**
 * Récupère toutes les factures du comptable avec filtres optionnels
 */
export async function getComptableFactures(status?: string, clientId?: number): Promise<Facture[]> {
  try {
    let path = 'factures';
    const params = new URLSearchParams();
    
    if (status) {
      params.append('status', status);
    }
    if (clientId) {
      params.append('clientId', clientId.toString());
    }
    
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    
    const factures = await serverGet(path);
    return factures;
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error);
    throw error;
  }
}

/**
 * Récupère une facture spécifique du comptable
 */
export async function getComptableFacture(factureId: number): Promise<Facture> {
  try {
    const facture = await serverGet(`factures/${factureId}`);
    return facture;
  } catch (error) {
    console.error('Erreur lors du chargement de la facture:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'une facture
 */
export async function updateFactureStatus(
  factureId: number, 
  newStatus: Facture['status']
): Promise<{ success: boolean; facture: Facture }> {
  try {
    const result = await serverPost(`factures/${factureId}/status`, { status: newStatus });
    return result;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}

/**
 * Supprime une facture (si statut = BROUILLON)
 */
export async function deleteFacture(factureId: number): Promise<{ success: boolean }> {
  try {
    const result = await serverPost(`factures/${factureId}/delete`, {});
    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    throw error;
  }
}

/**
 * Envoie une facture par email au client
 */
export async function sendFactureEmail(factureId: number): Promise<{ success: boolean }> {
  try {
    const result = await serverPost(`factures/${factureId}/send-email`, {});
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}

/**
 * Télécharge le PDF d'une facture (Server Action)
 * Retourne le blob et le nom du fichier
 */
export async function downloadFacturePDF(factureId: number): Promise<{
  blob: Blob;
  filename: string;
}> {
  try {
    const blob = await serverDownload(`factures/${factureId}/pdf`);
    const filename = `facture-${factureId}.pdf`;
    
    return {
      blob,
      filename
    };
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
}