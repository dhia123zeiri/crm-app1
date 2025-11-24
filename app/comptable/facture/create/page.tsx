'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Download, Plus, Trash2, Eye, FileText, DollarSign, TrendingUp, ArrowLeft, Save, Send } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createFacture, getCabinetInfo, getClientInfo, type LigneFactureInput } from '../actions/facture-actions';

interface CabinetInfo {
  cabinet: string;
  numeroOrdre: number;
}

interface LigneFacture {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
}

interface LigneFactureCalculee extends LigneFacture {
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

function CreateFactureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [notes, setNotes] = useState<string>('Conditions de paiement: Net 30 jours à réception de facture\nModalités de paiement: Virement bancaire\nMerci de votre confiance!');

  const [cabinet, setCabinet] = useState<CabinetInfo | null>(null);
  const [cabinetLoading, setCabinetLoading] = useState<boolean>(true);
  
  const [dateEmissionInput, setDateEmissionInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateEcheanceInput, setDateEcheanceInput] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });

  const [lignes, setLignes] = useState<LigneFacture[]>([
    {
      id: '1',
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      tauxTVA: 19,
    },
  ]);

  useEffect(() => {
    const loadClientInfo = async () => {
      if (clientIdParam) {
        try {
          const clientData = await getClientInfo(clientIdParam);
          console.log(clientData);
          setClientInfo(clientData);
        } catch (error) {
          console.error('Erreur lors du chargement du client:', error);
        }
      }
    };
    loadClientInfo();
  }, [clientIdParam]);

  useEffect(() => {
    async function loadCabinetInfo() {
      try {
        const data = await getCabinetInfo();
        setCabinet(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setCabinetLoading(false);
      }
    }

    loadCabinetInfo();
  }, []);

  const calculerMontants = (): LigneFactureCalculee[] => {
    return lignes.map((ligne) => {
      const montantHT = ligne.quantite * ligne.prixUnitaire;
      const montantTVA = montantHT * (ligne.tauxTVA / 100);
      const montantTTC = montantHT + montantTVA;
      return {
        ...ligne,
        montantHT: parseFloat(montantHT.toFixed(2)),
        montantTVA: parseFloat(montantTVA.toFixed(2)),
        montantTTC: parseFloat(montantTTC.toFixed(2)),
      };
    });
  };

  const lignesCalculees = calculerMontants();
  const totalHT = lignesCalculees.reduce((sum, l) => sum + l.montantHT, 0);
  const totalTVA = lignesCalculees.reduce((sum, l) => sum + l.montantTVA, 0);
  const totalTTC = lignesCalculees.reduce((sum, l) => sum + l.montantTTC, 0);

  const mettreAJourLigne = (id: string, updates: Partial<LigneFacture>): void => {
    setLignes(lignes.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const supprimerLigne = (id: string): void => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const ajouterLigne = (): void => {
    const newId = String(Math.max(...lignes.map((l) => parseInt(l.id, 10)), 0) + 1);
    setLignes([
      ...lignes,
      {
        id: newId,
        description: '',
        quantite: 1,
        prixUnitaire: 0,
        tauxTVA: 19,
      },
    ]);
  };

  const telechargerPDF = (): void => {
    alert('Fonctionnalité PDF en développement');
  };

  const envoyerEmail = async (): Promise<void> => {
    if (!clientIdParam) {
      alert('Client non sélectionné');
      return;
    }

    const hasEmptyDescription = lignes.some(l => !l.description.trim());
    if (hasEmptyDescription) {
      alert('Veuillez remplir toutes les descriptions');
      return;
    }

    setLoading(true);
    try {
      const lignesInput: LigneFactureInput[] = lignes.map(ligne => ({
        description: ligne.description,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tauxTVA: ligne.tauxTVA,
      }));

      const result = await createFacture({
        clientId: parseInt(clientIdParam),
        dateEcheance: new Date(dateEcheanceInput),
        notes,
        lignes: lignesInput,
      });

      if (result.success) {
        alert('Facture créée et envoyée avec succès!');
        router.push('/comptable/factures');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      alert('Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  const validerFacture = async (): Promise<void> => {
    if (!clientIdParam) {
      alert('Client non sélectionné');
      return;
    }

    const hasEmptyDescription = lignes.some(l => !l.description.trim());
    if (hasEmptyDescription) {
      alert('Veuillez remplir toutes les descriptions');
      return;
    }

    setLoading(true);
    try {
      const lignesInput: LigneFactureInput[] = lignes.map(ligne => ({
        description: ligne.description,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tauxTVA: ligne.tauxTVA,
      }));

      const result = await createFacture({
        clientId: parseInt(clientIdParam),
        dateEcheance: new Date(dateEcheanceInput),
        notes,
        lignes: lignesInput,
      });

      if (result.success) {
        alert('Facture enregistrée avec succès!');
        router.push('/comptable/factures');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  if (cabinetLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des informations du cabinet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="p-3 bg-blue-600 rounded-lg">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Nouvelle Facture
                </h1>
                <p className="text-gray-600 mt-1">
                  {clientInfo ? `Pour ${clientInfo.raisonSociale}` : 'Création de facture'}
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              BROUILLON
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cabinet Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Cabinet</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Nom</p>
                  <p className="text-gray-900 font-semibold">
                    {cabinet?.cabinet || 'Cabinet DURAND & Associés'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">Numero Ordre</p>
                  <p className="text-gray-900 font-mono">
                    {cabinet?.numeroOrdre || '50123456789012'}
                  </p>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Client</h3>
              </div>
              {clientInfo ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Entreprise</p>
                    <p className="text-gray-900 font-semibold">{clientInfo.raisonSociale}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">SIRET</p>
                    <p className="text-gray-900 font-mono">{clientInfo.siret}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Adresse</p>
                    <p className="text-gray-900">
                      {clientInfo.adresse || 'Non définie'}<br />
                      {clientInfo.codePostal} {clientInfo.ville}
                    </p>
                  </div>
                  {clientInfo.user?.email && (
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Email</p>
                      <p className="text-gray-900 break-all">{clientInfo.user.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Chargement...</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Articles:</span>
                  <span className="font-bold text-gray-900">{lignesCalculees.length}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-bold text-gray-900">{totalHT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA:</span>
                  <span className="font-bold text-gray-900">{totalTVA.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-300">
                  <span className="text-gray-900">Total TTC:</span>
                  <span className="text-green-600">{totalTTC.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    N° Facture
                  </label>
                  <div className="px-4 py-3 bg-gray-100 rounded-lg border border-gray-300">
                    <p className="text-gray-900 font-mono font-bold">Généré automatiquement</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date d'émission
                  </label>
                  <input
                    type="date"
                    value={dateEmissionInput}
                    onChange={(e) => setDateEmissionInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={dateEcheanceInput}
                    onChange={(e) => setDateEcheanceInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Articles</h3>
                <div className="space-y-4">
                  {lignesCalculees.map((ligne, index) => (
                    <div key={ligne.id} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Description */}
                          <div className="md:col-span-12">
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                              Description
                            </label>
                            <input
                              type="text"
                              value={ligne.description}
                              onChange={(e) => mettreAJourLigne(ligne.id, { description: e.target.value })}
                              className="w-full px-5 py-4 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition font-medium text-lg"
                              placeholder="Description du service ou produit..."
                            />
                          </div>

                          {/* Quantité */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                              Quantité
                            </label>
                            <input
                              type="number"
                              value={ligne.quantite}
                              onChange={(e) => mettreAJourLigne(ligne.id, { quantite: parseInt(e.target.value, 10) || 0 })}
                              className="w-full px-5 py-4 bg-white border-2 border-gray-300 rounded-lg text-gray-900 text-center focus:outline-none focus:border-blue-500 transition font-bold text-2xl"
                              min="1"
                            />
                          </div>

                          {/* Prix Unitaire */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                              Prix Unit. (€)
                            </label>
                            <input
                              type="number"
                              value={ligne.prixUnitaire}
                              onChange={(e) => mettreAJourLigne(ligne.id, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                              className="w-full px-5 py-4 bg-white border-2 border-gray-300 rounded-lg text-gray-900 text-right focus:outline-none focus:border-blue-500 transition font-bold text-2xl"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>

                          {/* TVA */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                              TVA (%)
                            </label>
                            <input
                              type="number"
                              value={ligne.tauxTVA}
                              onChange={(e) => mettreAJourLigne(ligne.id, { tauxTVA: parseFloat(e.target.value) || 0 })}
                              className="w-full px-5 py-4 bg-white border-2 border-gray-300 rounded-lg text-gray-900 text-center focus:outline-none focus:border-blue-500 transition font-bold text-2xl"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>

                          {/* Total */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
                              Total TTC
                            </label>
                            <div className="px-5 py-4 bg-green-50 border-2 border-green-200 rounded-lg">
                              <p className="text-green-700 font-bold text-2xl text-right">
                                {ligne.montantTTC.toFixed(2)} €
                              </p>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="md:col-span-1 flex items-end">
                            <button
                              onClick={() => supprimerLigne(ligne.id)}
                              className="w-full px-4 py-4 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-300 hover:border-red-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              type="button"
                              disabled={lignes.length === 1}
                            >
                              <Trash2 size={20} className="mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={ajouterLigne}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-6 py-4 rounded-lg hover:bg-blue-100 transition border-2 border-blue-200 font-semibold"
                  type="button"
                >
                  <Plus size={20} />
                  Ajouter une ligne
                </button>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 mb-8 pt-8 border-t-2">
                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                  <p className="text-blue-700 text-sm font-semibold mb-2">Total HT</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {totalHT.toFixed(2)} <span className="text-xl">€</span>
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                  <p className="text-purple-700 text-sm font-semibold mb-2">Total TVA</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {totalTVA.toFixed(2)} <span className="text-xl">€</span>
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border-2 border-green-300">
                  <p className="text-green-700 text-sm font-semibold mb-2">Total TTC</p>
                  <p className="text-4xl font-bold text-green-900">
                    {totalTTC.toFixed(2)} <span className="text-2xl">€</span>
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Notes et conditions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition h-32 resize-none"
                  placeholder="Ajoutez vos notes et conditions..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={telechargerPDF}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Download size={20} />
                  {loading ? 'Traitement...' : 'PDF'}
                </button>
                <button
                  onClick={envoyerEmail}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Send size={20} />
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
                <button
                  onClick={validerFacture}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Save size={20} />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateFacturePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    }>
      <CreateFactureContent />
    </Suspense>
  );
}