// types.ts
export interface TemplateData {
  nom: string;
  subject: string;
  content: string;
  type: string;
  category: string;
  actif: boolean;
  isPeriodic?: boolean;
  cronExpression?: string;
  clientIds?: string[]; // ou number[] si ce sont des IDs numériques
  sendToAllClients?: boolean;
  variables?: Record<string, string>;
}

export interface CreateTemplateResult {
  template: TemplateData | null;
  error: string | null;
}
