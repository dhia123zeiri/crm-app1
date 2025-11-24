"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Building2,
  UserCheck,
  Receipt,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase,
  Hash,
  MapPinned,
  Clock,
  User,
  Shield,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getSpecificClient, deleteClient, ClientApiResponse } from "../actions/create-client";
import { withRoleGuard } from "@/app/common/components/RolePageGuard";
import { Role } from "@/app/auth/get-user";

function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;

  const [client, setClient] = useState<ClientApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSpecificClient(clientId);
      setClient(data);
    } catch (err: any) {
      console.error("Error loading client:", err);
      setError(err.message || "Erreur lors du chargement du client");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      try {
        await deleteClient(Number(clientId));
        alert("Client supprimé avec succès !");
        router.push("/comptable/clients");
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        alert("Erreur lors de la suppression du client.");
      }
    }
  };

  const handleCreateFacture = () => {
    router.push(`/comptable/facture/create?clientId=${clientId}`);
  };

  const handleViewFactures = () => {
    router.push(`/comptable/clients/${clientId}/factures`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails du client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || "Client non trouvé"}</p>
          <button
            onClick={() => router.push("/comptable/clients")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux clients
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
                onClick={() => router.push("/comptable/clients")}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Détails du Client
                  </h1>
                  <p className="text-sm text-gray-500">
                    {client.raisonSociale}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/comptable/clients/update-client/${clientId}`)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div
          className={`rounded-2xl p-6 mb-8 shadow-lg border-2 ${
            client.user.actif
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {client.user.actif ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {client.user.actif ? "Client Actif" : "Client Inactif"}
                </h2>
                <p className="text-sm text-gray-600">
                  {client.user.actif
                    ? "Ce client est actuellement actif dans le système"
                    : "Ce client est actuellement désactivé"}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                client.user.actif
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {client.user.actif ? "ACTIF" : "INACTIF"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Informations de l'Entreprise
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      Raison Sociale
                    </p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {client.raisonSociale}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">SIRET</p>
                    <p className="text-base font-semibold text-gray-900 mt-1 font-mono">
                      {client.siret}
                    </p>
                  </div>
                </div>

                {client.typeActivite && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Secteur d'Activité
                      </p>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {client.typeActivite}
                      </p>
                    </div>
                  </div>
                )}

                {client.regimeFiscal && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Régime Fiscal
                      </p>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {client.regimeFiscal}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Coordonnées
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <a
                      href={`mailto:${client.user.email}`}
                      className="text-base font-semibold text-blue-600 hover:text-blue-700 mt-1 block"
                    >
                      {client.user.email}
                    </a>
                  </div>
                </div>

                {client.telephone && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Téléphone
                      </p>
                      <a
                        href={`tel:${client.telephone}`}
                        className="text-base font-semibold text-blue-600 hover:text-blue-700 mt-1 block"
                      >
                        {client.telephone}
                      </a>
                    </div>
                  </div>
                )}

                {client.adresse && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <MapPinned className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Adresse
                      </p>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {client.adresse}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {client.codePostal} {client.ville}
                      </p>
                    </div>
                  </div>
                )}

                {!client.adresse && (client.ville || client.codePostal) && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        Localisation
                      </p>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {client.codePostal} {client.ville}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Account Info & Actions */}
          <div className="space-y-8">
            {/* Account Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Informations Compte
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    ID Utilisateur
                  </p>
                  <p className="text-base font-semibold text-gray-900 font-mono">
                    #{client.user.id}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Nom</p>
                  <p className="text-base font-semibold text-gray-900">
                    {client.user.nom}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Rôle</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                    <Shield className="h-3 w-3 mr-1" />
                    {client.user.role}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Date de Création
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(client.user.dateCreation).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Actions Rapides
                </h3>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCreateFacture}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  <FileText className="h-5 w-5" />
                  Créer une Facture
                </button>

                <button
                  onClick={handleViewFactures}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  <Receipt className="h-5 w-5" />
                  Liste des Factures
                </button>

                <button
                  onClick={() =>
                    router.push(`/comptable/clients/update-client/${clientId}`)
                  }
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  <Edit className="h-5 w-5" />
                  Modifier le Client
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(ClientDetailPage, [Role.COMPTABLE]);