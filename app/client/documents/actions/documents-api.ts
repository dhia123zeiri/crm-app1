// app/client/documents/actions/documents.ts
"use server";

import { serverDownload, serverGet } from "@/app/common/util/fetch";


export interface Document {
  id: number;
  nom: string;
  nomOriginal: string;
  chemin: string;
  taille: number;
  typeDocument: string;
  typeFichier: string;
  dateUpload: string;
  comptableId: number;
  clientId: number;
  comptable?: {
    user: {
      nom: string;
      email: string;
    };
  };
}

export interface GetDocumentsResult {
  data?: Document[];
  error?: string;
}

export interface DownloadDocumentResult {
  data?: Blob;
  error?: string;
  filename?: string;
}

/**
 * Récupère tous les documents du client connecté
 */
export async function getClientDocuments(): Promise<GetDocumentsResult> {
  try {
    const data = await serverGet("documents/client/my-documents");
    return { data };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      error: error instanceof Error ? error.message : "Erreur lors de la récupération des documents"
    };
  }
}

/**
 * Télécharge un document spécifique
 */
export async function downloadDocument(documentId: number): Promise<DownloadDocumentResult> {
  try {
    const blob = await serverDownload(`documents/${documentId}/download`);
    
    // Get the filename from the document (you might need to fetch document details first)
    const documentDetails = await serverGet(`documents/${documentId}`);
    const filename = documentDetails?.nomOriginal || `document_${documentId}`;
    
    return { 
      data: blob,
      filename 
    };
  } catch (error) {
    console.error("Error downloading document:", error);
    return {
      error: error instanceof Error ? error.message : "Erreur lors du téléchargement du document"
    };
  }
}