// app/factures/client/utils/downloadHandler.ts
"use client";

import { downloadFacturePDF } from "../actions/actions-api";

/**
 * Gère le téléchargement complet d'une facture PDF
 * Cette fonction doit être appelée depuis un composant client
 */
export async function handleFactureDownload(factureId: number): Promise<void> {
  try {
    // Récupérer le blob depuis le serveur
    const { blob, filename } = await downloadFacturePDF(factureId);
    
    // Créer l'URL du blob
    const url = window.URL.createObjectURL(blob);
    
    // Créer un lien temporaire et cliquer dessus
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyage
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
}