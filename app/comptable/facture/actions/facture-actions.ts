"use server";

import { serverGet, serverPost } from "@/app/common/util/fetch";



// Types
export interface LigneFactureInput {
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
}

export interface CreateFactureInput {
  clientId: number;
  dateEcheance: Date;
  notes?: string;
  lignes: LigneFactureInput[];
}

export interface CreateFactureResponse {
  success: boolean;
  facture?: any;
  error?: string;
}

// Actions
export async function getClientInfo(clientId: string) {
  try {
    return await serverGet(`clients/${clientId}`);
  } catch (error) {
    console.error('Erreur lors du chargement du client:', error);
    return null;
  }
}

export async function getCabinetInfo() {
  try {
    return await serverGet('factures/cabinet');
  } catch (error) {
    console.error('Erreur lors du chargement des infos du cabinet:', error);
    return null;
  }
}

export async function createFacture(data: CreateFactureInput): Promise<CreateFactureResponse> {
  try {
    // Convertir la date en ISO string pour l'envoi
    const payload = {
      ...data,
      dateEcheance: data.dateEcheance.toISOString(),
    };

    const result = await serverPost('factures', payload);
    
    return {
      success: true,
      facture: result.facture,
    };
  } catch (error: any) {
    console.error('Erreur lors de la création de la facture:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de la facture',
    };
  }
}

export async function getFactures(filters?: { status?: string; clientId?: number }) {
  try {
    let path = 'factures';
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    
    if (filters?.clientId) {
      params.append('clientId', filters.clientId.toString());
    }
    
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    
    return await serverGet(path);
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error);
    return [];
  }
}

export async function getFacture(id: number) {
  try {
    return await serverGet(`factures/${id}`);
  } catch (error) {
    console.error('Erreur lors du chargement de la facture:', error);
    return null;
  }
}