// app/api/caisses/actions.ts
"use server";

import { serverGet, serverPost, serverPut } from "@/app/common/util/fetch";



// Types matching your backend
export interface Caisse {
  id: number;
  nom: string;
  username: string | null;
  password: string | null;
  isActive: boolean;
  dateCreation: Date;
  dateModification: Date;
  clientId: number;
  comptableId: number;
}

export interface ClientCaissesResponse {
  id: number;
  raisonSociale: string;
  siret: string;
  caisses: Caisse[];
  isFullyConfigured: boolean;
  configuredCount: number;
  activeCount: number;
}

interface CaisseStatistics {
  totalCaisses: number;
  activeCaisses: number;
  inactiveCaisses: number;
  caissesByType: { nom: string; count: number }[];
  clientsWithCaisses: number;
}

// Get all clients for the current comptable
export async function getClients() {
  try {
    return await serverGet('clients');
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}

// Get caisses for a specific client
export async function getCaissesByClient(clientId: number): Promise<ClientCaissesResponse> {
  try {
    return await serverGet(`caisses/client/${clientId}`);
  } catch (error) {
    console.error('Error fetching client caisses:', error);
    throw new Error('Failed to fetch client caisses');
  }
}

// Create a new caisse
export async function createCaisse(caisseData: any) {
  try {
    return await serverPost('caisses', caisseData);
  } catch (error) {
    console.error('Error creating caisse:', error);
    throw new Error('Failed to create caisse');
  }
}

// Update an existing caisse
export async function updateCaisse(caisseId: number, caisseData: any) {
  try {
    return await serverPut(`caisses/${caisseId}`, caisseData);
  } catch (error) {
    console.error('Error updating caisse:', error);
    throw new Error('Failed to update caisse');
  }
}

// Delete a caisse
export async function deleteCaisse(caisseId: number) {
  try {
    return await serverPost(`caisses/${caisseId}/delete`, {});
  } catch (error) {
    console.error('Error deleting caisse:', error);
    throw new Error('Failed to delete caisse');
  }
}

// Get caisse statistics
export async function getCaisseStatistics(): Promise<CaisseStatistics> {
  try {
    return await serverGet('caisses/statistics');
  } catch (error) {
    console.error('Error fetching caisse statistics:', error);
    throw new Error('Failed to fetch caisse statistics');
  }
}

// Save multiple caisses for a client
export async function saveClientCaisses(clientId: number, caisses: any[]) {
  try {
    const results = [];
    for (const caisse of caisses) {
      if (caisse.id) {
        // Update existing caisse
        results.push(await updateCaisse(caisse.id, caisse));
      } else {
        // Create new caisse
        results.push(await createCaisse({ ...caisse, clientId }));
      }
    }
    return results;
  } catch (error) {
    console.error('Error saving client caisses:', error);
    throw new Error('Failed to save client caisses');
  }
}