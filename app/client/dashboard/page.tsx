'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Wallet, 
  FolderOpen, 
  TrendingUp, 
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Euro,
  Calendar,
  File
} from 'lucide-react';
import { 
  getDashboardStats, 
  getRecentFactures, 
  getActiveDossiers,
  type ClientDashboardStats,
  type Facture,
  type Dossier
} from './actions/dashboardClient-api';
import { getClientFactures } from '../facture/actions/actions-api';
import { fetchClientsDossier, fetchDossiersClient } from '../dossier/actions/dossier-client';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ClientDashboardStats>({
    totalFactures: 0,
    facturesValidees: 0,
    dossiersEnAttente: 0,
    montantCaisse: 0
  });

  const [factures, setFactures] = useState<Facture[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [statsData, facturesData, dossiersData] = await Promise.all([
          getDashboardStats(),
          getClientFactures(),
          fetchDossiersClient()
        ]);
        
        setStats(statsData);
        // Take only first 3 factures
        setFactures(facturesData.slice(0, 3));
        // Take only first 3 dossiers
        setDossiers(dossiersData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAYEE':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Payée', icon: CheckCircle };
      case 'VALIDEE':
      case 'ENVOYEE':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente', icon: Clock };
      case 'EN_RETARD':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'En retard', icon: AlertCircle };
      case 'BROUILLON':
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon', icon: Clock };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: Clock };
    }
  };

  const getDossierStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_COURS':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En cours' };
      case 'EN_ATTENTE':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' };
      case 'COMPLET':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Complet' };
      case 'VALIDE':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Validé' };
      case 'EXPIRE':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Expiré' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Client</h1>
          <p className="text-gray-600 mt-2">Suivez vos factures, caisse et dossiers en temps réel</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Factures */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Factures</p>
                {loading ? (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.totalFactures}</p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Factures Validées */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Factures Validées</p>
                {loading ? (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-6 w-6 text-orange-600 animate-spin" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.facturesValidees}</p>
                )}
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Montant Caisse */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Montant Caisse</p>
                {loading ? (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.montantCaisse)}</p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Dossiers En Attente */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossiers En Attente</p>
                {loading ? (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.dossiersEnAttente}</p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FolderOpen className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/client/facture" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
              <FileText className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-900">Mes Factures</span>
            </a>
            
            <a href="/client/caisses" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
              <Euro className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-green-900">Voir Caisse</span>
            </a>
            
            <a href="/client/dossier" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
              <FolderOpen className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-900">Mes Dossiers</span>
            </a>
            
            <a href="/client/documents" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group">
              <File className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-orange-900">Mes Documents</span>
            </a>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Factures */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Factures Récentes</h2>
                <a href="/client/facture" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Voir tout
                </a>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : factures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucune facture trouvée</p>
                  </div>
                ) : (
                  factures.map((facture) => {
                    const badge = getStatusBadge(facture.status);
                    const StatusIcon = badge.icon;
                    return (
                      <div key={facture.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{facture.numero}</p>
                              <p className="text-xs text-gray-500">Date: {formatDate(facture.dateEmission)}</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {formatCurrency(facture.totalTTC)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {badge.label}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Dossiers en cours */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Dossiers en Cours</h2>
                <a href="/client/dossier" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Voir tout
                </a>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : dossiers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun dossier trouvé</p>
                  </div>
                ) : (
                  dossiers.map((dossier) => {
                    const badge = getDossierStatusBadge(dossier.status);
                    return (
                      <div key={dossier.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{dossier.nom}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {dossier.periode && (
                                  <>
                                    <span className="text-xs text-gray-500">{dossier.periode}</span>
                                    <span className="text-xs text-gray-400">•</span>
                                  </>
                                )}
                                {dossier.dateEcheance && (
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(dossier.dateEcheance)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progression</span>
                            <span className="font-medium">{dossier.pourcentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                dossier.pourcentage >= 80 ? 'bg-green-500' : 
                                dossier.pourcentage >= 50 ? 'bg-blue-500' : 
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${dossier.pourcentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}