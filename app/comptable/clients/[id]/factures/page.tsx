"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Receipt,
  Eye,
  Download,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Building,
  X,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { withRoleGuard } from "@/app/common/components/RolePageGuard";
import { Role } from "@/app/auth/get-user";
import { useClientFactures } from "../../hooks/use-client-factures";
import { Facture } from "../../actions/get-clients";


function ClientFacturesPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const { factures, client, loading, error, refresh } = useClientFactures(clientId);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

  const filteredFactures = factures.filter((facture) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      facture.numero.toLowerCase().includes(searchLower) ||
      (facture.notes?.toLowerCase().includes(searchLower) ?? false);

    const matchesStatus =
      statusFilter === "all" || facture.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, {
      bg: string;
      text: string;
      icon: typeof CheckCircle;
      label: string;
    }> = {
      VALIDEE: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircle,
        label: "Validée",
      },
      BROUILLON: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: Clock,
        label: "Brouillon",
      },
      PAYEE: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: CheckCircle,
        label: "Payée",
      },
      ANNULEE: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: XCircle,
        label: "Annulée",
      },
    };

    const config = statusConfig[status] || statusConfig.BROUILLON;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const stats = {
    total: factures.length,
    validees: factures.filter((f) => f.status === "VALIDEE").length,
    payees: factures.filter((f) => f.status === "PAYEE").length,
    totalAmount: factures.reduce((sum, f) => sum + f.totalTTC, 0),
  };

  const handleViewFacture = (facture: Facture) => {
    setSelectedFacture(facture);
  };

  const closeModal = () => {
    setSelectedFacture(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Factures - {client?.raisonSociale || "Client"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Historique des factures du client
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info Card */}
        {client && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {client.raisonSociale}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    SIRET: {client.siret} • {client.ville}
                  </p>
                  <p className="text-sm text-gray-500">{client.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Factures
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validées</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.validees}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payées</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.payees}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Montant Total
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.totalAmount.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="VALIDEE">Validée</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="PAYEE">Payée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>
        </div>

        {/* Factures List */}
        <div className="space-y-4">
          {filteredFactures.map((facture) => (
            <div
              key={facture.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-4 mb-3 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">
                      {facture.numero}
                    </h3>
                    {getStatusBadge(facture.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Émise le{" "}
                        {new Date(facture.dateEmission).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Échéance{" "}
                        {new Date(facture.dateEcheance).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">
                        {facture.totalTTC.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        € TTC
                      </span>
                    </div>
                  </div>

                  {/* Date de paiement pour les factures payées */}
                  {facture.status === "PAYEE" && facture.datePaiement && (
                    <div className="mt-3 flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-green-700 font-medium">
                          Payée le {new Date(facture.datePaiement).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  )}

                  {facture.notes && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                      {facture.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewFacture(facture)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Voir</span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFactures.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 max-w-md mx-auto">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune facture trouvée
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche."
                  : "Ce client n'a pas encore de factures."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails Facture */}
      {selectedFacture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Receipt className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">{selectedFacture.numero}</h2>
                  <p className="text-sm text-blue-100">Détails de la facture</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut et Dates */}
              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div>{getStatusBadge(selectedFacture.status)}</div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Émise: {new Date(selectedFacture.dateEmission).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Échéance: {new Date(selectedFacture.dateEcheance).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date de paiement pour les factures payées */}
                {selectedFacture.status === "PAYEE" && selectedFacture.datePaiement && (
                  <div className="flex items-center space-x-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Facture payée</p>
                      <p className="text-sm text-green-700">
                        Paiement reçu le {new Date(selectedFacture.datePaiement).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Client */}
              {client && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Informations Client
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{client.raisonSociale}</p>
                      <p className="text-gray-600">SIRET: {client.siret}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{client.adresse}, {client.codePostal} {client.ville}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{client.user.email}</span>
                      </div>
                      {client.telephone && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{client.telephone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lignes de facturation */}
              {selectedFacture.lignes && selectedFacture.lignes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Détails de la facturation</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Qté</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">P.U. HT</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">TVA</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFacture.lignes.map((ligne) => (
                          <tr key={ligne.id} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-gray-900">{ligne.description}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{ligne.quantite}</td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {ligne.prixUnitaire.toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                              })} €
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">{ligne.tauxTVA}%</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">
                              {ligne.montantHT.toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                              })} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totaux */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total HT</span>
                  <span className="font-semibold text-gray-900">
                    {selectedFacture.totalHT.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })} €
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">TVA</span>
                  <span className="font-semibold text-gray-900">
                    {selectedFacture.totalTVA.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })} €
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200">
                  <span className="text-lg font-bold text-gray-900">Total TTC</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedFacture.totalTTC.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })} €
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedFacture.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">Notes</h3>
                  <p className="text-sm text-amber-800">{selectedFacture.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg">
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(ClientFacturesPage, [Role.COMPTABLE]);