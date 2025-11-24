// app/actions/dossier-actions.ts
"use server";

import { serverGet } from "@/app/common/util/fetch";



// Types for client caisses
export interface Caisse {
  id: number;
  nom: string;
  username: string;
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

// Action for client to get their own caisses
export async function getClientCaisses(): Promise<ClientCaissesResponse> {
  try {
    const response = await serverGet("caisses/my-caisses");
    return response;
  } catch (error) {
    console.error("Error fetching client caisses:", error);
    throw new Error("Failed to fetch your caisses information");
  }
}

