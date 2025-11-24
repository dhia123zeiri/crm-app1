'use server';

import { serverGet } from "@/app/common/util/fetch";



export interface ClientDashboardStats {
  totalFactures: number;
  facturesValidees: number;
  dossiersEnAttente: number;
  montantCaisse: number;
}

export interface Facture {
  id: number;
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  status: string;
  totalTTC: number;
}

export interface Dossier {
  id: number;
  nom: string;
  description?: string;
  periode?: string;
  dateEcheance?: string;
  status: string;
  pourcentage: number;
}

export async function getDashboardStats(): Promise<ClientDashboardStats> {
  return serverGet('client-dashboard/stats');
}

export async function getRecentFactures(): Promise<Facture[]> {
  return serverGet('client-dashboard/factures/recent');
}

export async function getActiveDossiers(): Promise<Dossier[]> {
  return serverGet('client-dashboard/dossiers/active');
}