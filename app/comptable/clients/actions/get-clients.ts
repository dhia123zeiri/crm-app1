"use client";

import { serverGet } from '@/app/common/util/fetch';
import { useState } from 'react';


export interface Facture {
  id: number;
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string;
  status: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes?: string;
  dateCreation: string;
  client?: {
    raisonSociale: string;
    siret: string;
  };
  lignes?: Array<{
    id: number;
    description: string;
    quantite: number;
    prixUnitaire: number;
    tauxTVA: number;
    montantHT: number;
    montantTVA: number;
    montantTTC: number;
  }>;
}

export interface Client {
  id: number;
  siret: string;
  raisonSociale: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  telephone?: string;
  typeActivite: string;
  secteurActivite?: string;
  comptableId: number;
  user: {
    id: number;
    nom: string;
    email: string;
    dateCreation: string;
    actif: boolean;
  };
}



/**
 * Récupère toutes les factures d'un client spécifique
 */
export async function getClientFactures(clientId: number): Promise<Facture[]> {
  try {
    const factures = await serverGet(`factures?clientId=${clientId}`);
    return factures;
  } catch (error) {
    console.error("Erreur lors de la récupération des factures:", error);
    throw error;
  }
}

/**
 * Récupère les informations d'un client
 */
export async function getClientInfo(clientId: number): Promise<Client> {
  try {
    const client = await serverGet(`factures/comptable/client/${clientId}`);
    return client;
  } catch (error) {
    console.error("Erreur lors de la récupération du client:", error);
    throw error;
  }
}

/**
 * Récupère une facture spécifique avec tous ses détails
 */
export async function getFacture(factureId: number): Promise<Facture> {
  try {
    const facture = await serverGet(`factures/${factureId}`);
    return facture;
  } catch (error) {
    console.error("Erreur lors de la récupération de la facture:", error);
    throw error;
  }
}

/**
 * Récupère toutes les factures du comptable
 * @param status - Optionnel: filtrer par statut
 */
export async function getAllFactures(status?: string): Promise<Facture[]> {
  try {
    const endpoint = status ? `factures?status=${status}` : 'factures';
    const factures = await serverGet(endpoint);
    return factures;
  } catch (error) {
    console.error("Erreur lors de la récupération des factures:", error);
    throw error;
  }
}



export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with your actual API call
      const data = await serverGet('clients');
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    loading,
    error,
    loadClients,
    setClients
  };
};