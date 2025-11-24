"use client";

import { useState, useEffect } from "react";
import { getClientFactures, getClientInfo, type Facture, type Client } from "../actions/get-clients";

export function useClientFactures(clientId: string) {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientIdNum = parseInt(clientId);

      // Charger les factures et les infos du client en parallèle
      const [facturesData, clientData] = await Promise.all([
        getClientFactures(clientIdNum),
        getClientInfo(clientIdNum),
      ]);

      setFactures(facturesData);
      setClient(clientData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  return {
    factures,
    client,
    loading,
    error,
    refresh: loadData,
  };
}