export interface EmailTemplate {
  id: number;
  nom: string;
  subject: string;
  content: string;
  type: 'REMINDER' | 'INVOICE' | 'INFO' | 'CUSTOM';
  category: string;
  dateCreation: string;
  dateModification: string;
  usageCount: number;
  actif: boolean;
  variables: string[];
}