// types.ts
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

export interface FileData {
  file: File;
  id: number;
  name: string;
  size: number;
  type: string;
  documentType: TypeDocument;
  preview?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';