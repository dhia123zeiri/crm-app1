// actions/upload-document.ts
"use server";

import { serverGet, serverPost, serverUpload } from "@/app/common/util/fetch";


export interface Client {
  id: number;
  userId: number;
  siret: string;
  raisonSociale: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  typeActivite?: string;
  regimeFiscal?: string;
  derniereConnexion?: Date;
  comptableId: number;
  user?: {
    email: string;
    nom: string;
  };
}

export type TypeDocument = 
  | 'FACTURE_VENTE' 
  | 'FACTURE_ACHAT' 
  | 'RELEVE_BANCAIRE' 
  | 'BULLETIN_PAIE' 
  | 'JUSTIFICATIF' 
  | 'CONTRAT' 
  | 'DECLARATION' 
  | 'AUTRE';

export async function getClients(): Promise<{ data: Client[] | null; error: string | null }> {
  try {
    const data = await serverGet('clients');
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des clients' 
    };
  }
}

export async function uploadDocuments(
  files: File[],
  clientIds: number[],
  documentTypes: TypeDocument[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const formData = new FormData();
    // Ajouter les fichiers
     files.forEach(file => {
      formData.append('files', file);
    });

    // Alternative 1: Append each clientId individually
    clientIds.forEach(id => {
      formData.append('clientIds', id.toString());
    });

    // Alternative 1: Append each documentType individually  
    documentTypes.forEach(type => {
      formData.append('documentTypes', type);
    });

    const result = await serverUpload('documents/upload', formData);
    
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload des documents' 
    };
  }
}