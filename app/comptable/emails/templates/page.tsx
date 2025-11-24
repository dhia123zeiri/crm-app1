"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  ArrowLeft,
  Mail,
  AlertCircle,
  Calendar,
  Users,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useTemplates } from "../actions/get-templates";
import { withRoleGuard } from "@/app/common/components/RolePageGuard";
import { Role } from "@/app/auth/get-user";
import { serverDelete } from "@/app/common/util/fetch";

function EmailTemplatesPage() {
  const { templates, loading, error, loadTemplates } = useTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Charger les templates au montage du composant
  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      template.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesCategory =
      categoryFilter === "all" || template.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && template.actif) ||
      (statusFilter === "inactive" && !template.actif);

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "reminder":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "invoice":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "info":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "custom":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "REMINDER":
        return "Rappel";
      case "INVOICE":
        return "Facture";
      case "INFO":
        return "Information";
      case "CUSTOM":
        return "Personnalisé";
      default:
        return type;
    }
  };

  const handleDuplicate = async (templateId: number) => {
    try {
      // Ici vous pouvez appeler l'API de duplication
      // await post(`template-emails/${templateId}/duplicate`, { nom: 'Nouveau nom' });
      console.log("Dupliquer template:", templateId);
      // Recharger les templates après duplication
      // await loadTemplates();
    } catch (err) {
      console.error("Erreur lors de la duplication:", err);
    }
  };

  const handleDelete = async (templateId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
      try {
        // Ici vous pouvez appeler l'API de suppression
        await serverDelete(`template-emails/${templateId}`);
        
        // Recharger les templates après suppression
        await loadTemplates();
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
      }
    }
  };

  const handleToggleStatus = async (templateId: number) => {
    try {
      // Ici vous pouvez appeler l'API pour changer le statut
      // await patch(`template-emails/${templateId}/toggle-status`);
      console.log("Changer statut template:", templateId);
      // Recharger les templates après modification
      // await loadTemplates();
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
    }
  };

  // Calcul des statistiques basé sur les données de l'API
  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.actif).length,
    byType: {
      reminder: templates.filter((t) => t.type === "REMINDER").length,
      invoice: templates.filter((t) => t.type === "INVOICE").length,
      info: templates.filter((t) => t.type === "INFO").length,
      custom: templates.filter((t) => t.type === "CUSTOM").length,
    },
  };

  // Extraction des catégories uniques
  const categories = [...new Set(templates.map((t) => t.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTemplates}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/emails"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Templates d'Emails
                  </h1>
                  <p className="text-sm text-gray-500">
                    Gérez vos modèles d'emails
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  (window.location.href = "/comptable/emails/templates/create-template")
                }
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rappels</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.byType.reminder}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Factures</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.byType.invoice}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Info</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.byType.info}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custom</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.byType.custom}
                </p>
              </div>
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="reminder">Rappels</option>
              <option value="invoice">Factures</option>
              <option value="info">Informations</option>
              <option value="custom">Personnalisés</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.nom}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(
                          template.type
                        )}`}
                      >
                        {getTypeLabel(template.type)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          template.actif ? "bg-green-400" : "bg-red-400"
                        }`}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {template.actif ? "Actif" : "Inactif"}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Utilisé {template.usageCount} fois
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-medium text-gray-700 mb-1">Objet :</div>
                  <div className="italic">{template.subject}</div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="p-6 border-b border-gray-200">
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-medium text-gray-700 mb-2">Aperçu :</div>
                  <div className="bg-gray-50 p-3 rounded-lg text-xs leading-relaxed max-h-24 overflow-hidden">
                    {template.content.substring(0, 150)}...
                  </div>
                </div>

                {template.variables.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-700 mb-2 text-sm">
                      Variables :
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {`{${variable}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div>
                    Créé le{" "}
                    {new Date(template.dateCreation).toLocaleDateString(
                      "fr-FR"
                    )}
                  </div>
                  <div>
                    Modifié le{" "}
                    {new Date(template.dateModification).toLocaleDateString(
                      "fr-FR"
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/emails/templates/${template.id}`}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`templates/update-templates/${template.id}`}
                      className="text-gray-400 hover:text-green-600 p-1 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDuplicate(template.id)}
                      className="text-gray-400 hover:text-purple-600 p-1 rounded transition-colors"
                      title="Dupliquer"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(template.id)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        template.actif
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {template.actif ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm ||
              typeFilter !== "all" ||
              categoryFilter !== "all" ||
              statusFilter !== "all"
                ? "Essayez de modifier vos filtres de recherche."
                : "Commencez par créer votre premier template d'email."}
            </p>
            <button
              onClick={() =>
                  (window.location.href = "/comptable/emails/templates/create-template")
                }
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleGuard(EmailTemplatesPage,[Role.COMPTABLE]);
