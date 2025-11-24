"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Building,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Building2,
  UserCheck,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useClients } from "./actions/get-clients";
import { withRoleGuard } from "@/app/common/components/RolePageGuard";
import { Role } from "@/app/auth/get-user";
import { deleteClient } from "./actions/create-client";

function ClientsPage() {
  const router = useRouter();
  const { clients, loading, error, loadClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      (client.raisonSociale?.toLowerCase().includes(searchLower) ?? false) ||
      (client.siret?.toLowerCase().includes(searchLower) ?? false) ||
      (client.user?.email?.toLowerCase().includes(searchLower) ?? false) ||
      (client.ville?.toLowerCase().includes(searchLower) ?? false);

    const matchesSector =
      sectorFilter === "all" ||
      (client.secteurActivite && client.secteurActivite === sectorFilter);
    
    const matchesCity =
      cityFilter === "all" || client.ville === cityFilter;
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && client.user?.actif) ||
      (statusFilter === "inactive" && !client.user?.actif);

    return matchesSearch && matchesSector && matchesCity && matchesStatus;
  });

  const handleDelete = async (clientId: number) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
    try {
      await deleteClient(clientId);
      
      // Show success message
      alert("Client supprimé avec succès !");
      
      // Refresh the clients list to update the UI
      await loadClients();
      
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      // Show error message
      alert("Erreur lors de la suppression du client. Veuillez réessayer.");
    }
  }
};

  const handleToggleStatus = async (clientId: number) => {
    try {
      console.log("Changer statut client:", clientId);
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
    }
  };

  const handleCreateFacture = (clientId: number) => {
    router.push(`/comptable/facture/create?clientId=${clientId}`);
  };

  const handleViewFactures = (clientId: number) => {
    router.push(`/comptable/clients/${clientId}/factures`);
  };

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.user?.actif).length,
    bySector: clients.reduce((acc, client) => {
      const sector = client.secteurActivite || 'Non défini';
      acc[sector] = (acc[sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCity: clients.reduce((acc, client) => {
      const city = client.ville || 'Non définie';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const sectors = [...new Set(clients.map((c) => c.secteurActivite).filter(Boolean))];
  const cities = [...new Set(clients.map((c) => c.ville).filter(Boolean))];
  const topSectors = Object.entries(stats.bySector)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
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
            onClick={loadClients}
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
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Gestion des Clients
                  </h1>
                  <p className="text-sm text-gray-500">
                    Gérez votre portefeuille client
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/comptable/clients/create-client")}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Client
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.active} actifs
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.active}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% du total
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Villes</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {cities.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Zones couvertes
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Secteurs</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {sectors.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Diversité d'activité
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Sectors */}
        {topSectors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Secteurs d'Activité
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSectors.map(([sector, count], index) => (
                <div key={sector} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{sector}</p>
                    <p className="text-xs text-gray-500">{count} clients</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les secteurs</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        client.user?.actif ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        client.user?.actif 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {client.user?.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {client.raisonSociale || 'Nom non défini'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      SIRET: {client.siret || 'Non défini'}
                    </p>
                    {client.secteurActivite && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Building className="h-3 w-3 mr-1" />
                        {client.secteurActivite}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>
                    {client.ville || 'Ville non définie'}, {client.codePostal || 'CP non défini'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{client.user?.email || 'Email non défini'}</span>
                </div>

                {client.telephone && (
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.telephone}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    Créé le {client.user?.dateCreation 
                      ? new Date(client.user.dateCreation).toLocaleDateString("fr-FR")
                      : 'Date non définie'
                    }
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`clients/update-client/${client.id}`}
                      className="text-gray-400 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(client.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      client.user?.actif
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {client.user?.actif ? "Désactiver" : "Activer"}
                  </button>
                </div>

                {/* Boutons d'action pour les factures */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleCreateFacture(client.id)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    Créer une Facture
                  </button>

                  <button
                    onClick={() => handleViewFactures(client.id)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <Receipt className="h-4 w-4" />
                    Liste des Factures
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 max-w-md mx-auto">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun client trouvé
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm ||
                sectorFilter !== "all" ||
                cityFilter !== "all" ||
                statusFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche."
                  : "Commencez par ajouter votre premier client."}
              </p>
              <button
                onClick={() => router.push("/comptable/clients/create-client")}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Client
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(ClientsPage,[Role.COMPTABLE]);