// app/comptable/dashboard/actions/dashboard-api.ts
'use server';

import { serverGet } from "@/app/common/util/fetch";

export interface DashboardStats {
  totalClients: number;
  dossiersComplets: number;
  pendingForms: number;
  completionRate: number;
}

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
  derniereConnexion?: string;
  comptableId: number;
  user?: {
    id: number;
    nom: string;
    email: string;
    actif: boolean;
  };
}

export interface Template {
  id: number;
  nom: string;
  subject: string;
  content: string;
  type: 'REMINDER' | 'INVOICE' | 'INFO' | 'CUSTOM';
  actif: boolean;
  dateCreation: string;
  dateModification: string;
  comptableId: number;
  category: string;
  usageCount: number;
  variables: string[];
  cronExpression?: string;
  isPeriodic: boolean;
  lastExecutionAt?: string;
  nextExecutionAt?: string;
  includeForm: boolean;
  dynamicFormId?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const stats = await serverGet('comptables/dashboard/stats');
    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

export async function getClients(): Promise<Client[]> {
  try {
    const clients = await serverGet('clients');
    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const templates = await serverGet('template-emails');
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch templates');
  }
}