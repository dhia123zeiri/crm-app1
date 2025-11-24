'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search
} from 'lucide-react';
import { Facture, getClientFacture, getClientFactures } from './actions/actions-api';
import { formatCurrency, formatDate } from './actions/helpers';
import Checkout from '../checkout/checkout';
import { handleFactureDownload } from './actions/downloadHandler';

export default function ClientFacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClientFactures();
      setFactures(data);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError('Impossible de charger les factures. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const loadFactureDetails = async (factureId: number) => {
    try {
      const facture = await getClientFacture(factureId);
      setSelectedFacture(facture);
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      alert('Impossible de charger les détails de la facture');
    }
  };

  const onDownloadClick = async (factureId: number) => {
    try {
      setIsDownloading(factureId);
      await handleFactureDownload(factureId);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du PDF');
    } finally {
      setIsDownloading(null);
    }
  };

  const getStatusConfig = (status: Facture['status']) => {
    const configs = {
      BROUILLON: {
        label: 'Brouillon',
        color: 'bg-gray-100 text-gray-800',
        icon: <Clock size={16} />
      },
      VALIDEE: {
        label: 'Validée',
        color: 'bg-blue-100 text-blue-800',
        icon: <CheckCircle size={16} />
      },
      ENVOYEE: {
        label: 'Envoyée',
        color: 'bg-purple-100 text-purple-800',
        icon: <FileText size={16} />
      },
      PAYEE: {
        label: 'Payée',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle size={16} />
      },
      ANNULEE: {
        label: 'Annulée',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle size={16} />
      },
      EN_RETARD: {
        label: 'En retard',
        color: 'bg-orange-100 text-orange-800',
        icon: <AlertCircle size={16} />
      }
    };
    return configs[status];
  };

  const canBePaid = (status: Facture['status']) => {
    return ['VALIDEE', 'ENVOYEE', 'EN_RETARD'].includes(status);
  };

  const filteredFactures = factures.filter(facture => {
    const matchesSearch = facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facture.comptable.cabinet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || facture.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos factures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center border border-red-200">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFactures}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Réessayer
          </button>
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
              <div className="p-3 bg-blue-600 rounded-lg">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Factures</h1>
                <p className="text-gray-600 mt-1">
                  {factures.length} facture{factures.length > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par numéro ou cabinet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="VALIDEE">Validée</option>
                <option value="ENVOYEE">Envoyée</option>
                <option value="PAYEE">Payée</option>
                <option value="EN_RETARD">En retard</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Factures List */}
        {filteredFactures.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune facture trouvée
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Vous n\'avez pas encore de factures'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFactures.map((facture) => {
              const statusConfig = getStatusConfig(facture.status);
              const isOverdue = facture.status === 'EN_RETARD';
              const showPayButton = canBePaid(facture.status);

              return (
                <div
                  key={facture.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 font-mono">
                            {facture.numero}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-gray-600 font-medium">
                          {facture.comptable.cabinet}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCurrency(facture.totalTTC)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">TTC</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Émission</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(facture.dateEmission)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={18} className={isOverdue ? 'text-orange-600' : 'text-gray-400'} />
                        <div>
                          <p className="text-xs text-gray-500">Échéance</p>
                          <p className={`font-semibold ${isOverdue ? 'text-orange-600' : 'text-gray-900'}`}>
                            {formatDate(facture.dateEcheance)}
                          </p>
                        </div>
                      </div>
                      {facture.datePaiement && (
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Paiement</p>
                            <p className="font-semibold text-green-600">
                              {formatDate(facture.datePaiement)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Total HT</p>
                        <p className="font-bold text-gray-900">{formatCurrency(facture.totalHT)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">TVA</p>
                        <p className="font-bold text-gray-900">{formatCurrency(facture.totalTVA)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Articles</p>
                        <p className="font-bold text-gray-900">{facture.lignes.length}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => loadFactureDetails(facture.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        <Eye size={20} />
                        Voir les détails
                      </button>
                      {showPayButton && (
                        <div className="flex-1">
                          <Checkout factureId={facture.id} status={facture.status} />
                        </div>
                      )}
                      <button
                        onClick={() => onDownloadClick(facture.id)}
                        disabled={isDownloading === facture.id}
                        className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading === facture.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                            <span className="hidden sm:inline">Chargement...</span>
                          </>
                        ) : (
                          <>
                            <Download size={20} />
                            <span className="hidden sm:inline">PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedFacture && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-mono">
                    {selectedFacture.numero}
                  </h2>
                  <p className="text-gray-600 mt-1">{selectedFacture.comptable.cabinet}</p>
                </div>
                <button
                  onClick={() => setSelectedFacture(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {/* Cabinet Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Informations cabinet</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Cabinet:</strong> {selectedFacture.comptable.cabinet}
                  </p>
                  {selectedFacture.comptable.numeroOrdre && (
                    <p className="text-sm text-gray-600">
                      <strong>N° Ordre:</strong> {selectedFacture.comptable.numeroOrdre}
                    </p>
                  )}
                </div>

                {/* Lignes */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Articles</h3>
                  <div className="space-y-3">
                    {selectedFacture.lignes.map((ligne, index) => (
                      <div key={ligne.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-2">
                              {ligne.description}
                            </p>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Quantité</p>
                                <p className="font-semibold">{ligne.quantite}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Prix unit.</p>
                                <p className="font-semibold">{formatCurrency(ligne.prixUnitaire)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">TVA</p>
                                <p className="font-semibold">{ligne.tauxTVA}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total TTC</p>
                                <p className="font-bold text-green-600">{formatCurrency(ligne.montantTTC)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total HT:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(selectedFacture.totalHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total TVA:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(selectedFacture.totalTVA)}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t-2 border-gray-300">
                      <span className="font-bold text-gray-900">Total TTC:</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedFacture.totalTTC)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedFacture.notes && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {selectedFacture.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {canBePaid(selectedFacture.status) && (
                    <div className="flex-1">
                      <Checkout factureId={selectedFacture.id} status={selectedFacture.status} />
                    </div>
                  )}
                  <button
                    onClick={() => onDownloadClick(selectedFacture.id)}
                    disabled={isDownloading === selectedFacture.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                  >
                    {isDownloading === selectedFacture.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        Télécharger PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedFacture(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}