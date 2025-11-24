// Periods enum - you can make this dynamic from backend too
export const PERIODS = [
  { value: 'JANVIER_2024', label: 'Janvier 2024' },
  { value: 'FEVRIER_2024', label: 'Février 2024' },
  { value: 'MARS_2024', label: 'Mars 2024' },
  { value: 'AVRIL_2024', label: 'Avril 2024' },
  { value: 'MAI_2024', label: 'Mai 2024' },
  { value: 'JUIN_2024', label: 'Juin 2024' },
  { value: 'JUILLET_2024', label: 'Juillet 2024' },
  { value: 'AOUT_2024', label: 'Août 2024' },
  { value: 'SEPTEMBRE_2024', label: 'Septembre 2024' },
  { value: 'OCTOBRE_2024', label: 'Octobre 2024' },
  { value: 'NOVEMBRE_2024', label: 'Novembre 2024' },
  { value: 'DECEMBRE_2024', label: 'Décembre 2024' },
  { value: 'T1_2024', label: 'T1 2024' },
  { value: 'T2_2024', label: 'T2 2024' },
  { value: 'T3_2024', label: 'T3 2024' },
  { value: 'T4_2024', label: 'T4 2024' },
  { value: 'ANNUEL_2024', label: 'Annuel 2024' }
];

// Document types enum
export const DOCUMENT_TYPES = [
  'FACTURE_VENTE',
  'FACTURE_ACHAT',
  'RELEVE_BANCAIRE',
  'BULLETIN_PAIE',
  'DECLARATION_TVA',
  'JUSTIFICATIF_CHARGES',
  'CONTRAT',
  'AUTRE'
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

// Helper function to get document type label
export const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    FACTURE_VENTE: 'Factures de Vente',
    FACTURE_ACHAT: 'Factures d\'Achat',
    RELEVE_BANCAIRE: 'Relevés Bancaires',
    BULLETIN_PAIE: 'Bulletins de Paie',
    DECLARATION_TVA: 'Déclarations TVA',
    JUSTIFICATIF_CHARGES: 'Justificatifs Charges',
    CONTRAT: 'Contrats',
    AUTRE: 'Autre'
  };
  return labels[type] || type;
};

// Status colors and labels
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'EN_COURS':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLET':
      return 'bg-blue-100 text-blue-800';
    case 'VALIDE':
      return 'bg-green-100 text-green-800';
    case 'EN_ATTENTE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'EN_COURS':
      return 'En Cours';
    case 'COMPLET':
      return 'Complet';
    case 'VALIDE':
      return 'Validé';
    case 'EN_ATTENTE':
      return 'En Attente';
    default:
      return status;
  }
};

// Default document requests
export const DEFAULT_DOCUMENT_REQUESTS = [
  {
    titre: 'Factures de Vente',
    description: 'Toutes les factures de vente du mois',
    typeDocument: 'FACTURE_VENTE',
    obligatoire: true,
    quantiteMin: 1,
    quantiteMax: 50,
    formatAccepte: 'PDF,JPG,PNG',
    tailleMaxMo: 10,
    instructions: 'Fournir toutes les factures de vente'
  },
  {
    titre: 'Relevés Bancaires',
    description: 'Relevés bancaires du mois',
    typeDocument: 'RELEVE_BANCAIRE',
    obligatoire: true,
    quantiteMin: 1,
    quantiteMax: 5,
    formatAccepte: 'PDF',
    tailleMaxMo: 5,
    instructions: 'Un relevé par compte bancaire'
  }
];