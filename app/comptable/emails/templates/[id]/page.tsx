"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Tag,
  FileText,
  Eye,
  Send,
  BarChart,
  Settings,
  RefreshCw,
} from "lucide-react";
import { serverGet, serverDelete } from "@/app/common/util/fetch";
import { withRoleGuard } from "@/app/common/components/RolePageGuard";
import { Role } from "@/app/auth/get-user";
import { cronPresetLabels, deleteTemplate, fieldTypes, FormField, getTemplate, Template, templateTypes } from "../../actions/get-templates";



function TemplateViewPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTemplate(templateId);
      setTemplate(data);
    } catch (err: any) {
      console.error("Error loading template:", err);
      setError(err.message || "Erreur lors du chargement du template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      alert("Template supprimé avec succès !");
      router.push("/comptable/emails/templates");
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression du template.");
    }
  };

  const handleDuplicate = () => {
    router.push(`/comptable/emails/templates/${templateId}/duplicate`);
  };

  const renderContentWithVariables = (content: string): string => {
    if (!template) return content;
    
    let renderedContent = content;
    template.variables.forEach((variable) => {
      const regex = new RegExp(`{${variable}}`, "gi");
      renderedContent = renderedContent.replace(
        regex,
        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{${variable}}</span>`
      );
    });
    return renderedContent;
  };

  const renderFormField = (field: FormField): React.JSX.Element => {
    const baseClasses =
      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className={baseClasses}
            disabled
            defaultValue="Exemple de texte..."
          />
        );
      case "select":
        return (
          <select required={field.required} className={baseClasses} disabled>
            <option value="">Sélectionner...</option>
            {field.options.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options.map((option, i) => (
              <label key={i} className="flex items-center">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={option}
                  disabled
                  className="mr-2"
                  defaultChecked={i === 0}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options.map((option, i) => (
              <label key={i} className="flex items-center">
                <input type="checkbox" disabled className="mr-2" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case "file":
        return (
          <input
            type="file"
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
          />
        );
      case "signature":
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
            <div className="text-gray-500 mb-2">Zone de signature</div>
            <div className="bg-white border border-dashed border-gray-300 rounded h-24 flex items-center justify-center">
              <span className="text-gray-400">Zone de signature</span>
            </div>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            disabled
            className={baseClasses}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || "Template non trouvé"}</p>
          <button
            onClick={() => router.push("/comptable/emails/templates")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux templates
          </button>
        </div>
      </div>
    );
  }

  const templateType = templateTypes.find((t) => t.value === template.type);
  const activeClients = template.clients.filter((tc) => tc.actif);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/comptable/emails/templates")}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {template.nom}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Template {template.type}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  showPreview
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Masquer" : "Aperçu"}
              </button>
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </button>
              <button
                onClick={() =>
                  router.push(`/comptable/emails/templates/update/${templateId}`)
                }
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
            template.actif
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {template.actif ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {template.actif ? "Template Actif" : "Template Inactif"}
                </h2>
                <p className="text-sm text-gray-600">
                  {template.actif
                    ? "Ce template peut être utilisé immédiatement"
                    : "Ce template est actuellement désactivé"}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                template.actif
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {template.actif ? "ACTIF" : "INACTIF"}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Utilisations
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {template.usageCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">Envois effectués</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <Send className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Destinataires
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activeClients.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Clients actifs</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variables</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {template.variables.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Variables définies</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <Tag className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {templateType?.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {template.isPeriodic ? "Périodique" : "Ponctuel"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                {template.isPeriodic ? (
                  <RefreshCw className="h-6 w-6 text-white" />
                ) : (
                  <FileText className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${
            showPreview
              ? "grid grid-cols-1 xl:grid-cols-2 gap-8"
              : "max-w-5xl mx-auto"
          }`}
        >
          {/* Main Content */}
          <div className="space-y-8">
            {/* Template Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Informations du Template
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Nom</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {template.nom}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <span
                      className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-sm font-semibold ${templateType?.bgColor} ${templateType?.color}`}
                    >
                      {templateType?.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      Catégorie
                    </p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {template.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      Date de création
                    </p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {new Date(template.dateCreation).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      Dernière modification
                    </p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {new Date(template.dateModification).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Periodic Settings */}
            {template.isPeriodic && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Configuration Périodique
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Fréquence d'envoi
                    </p>
                    <p className="text-base font-semibold text-blue-700">
                      {cronPresetLabels[template.cronExpression || ""] ||
                        template.cronExpression ||
                        "Non définie"}
                    </p>
                    {template.cronExpression && (
                      <p className="text-xs text-blue-600 mt-1 font-mono">
                        Cron: {template.cronExpression}
                      </p>
                    )}
                  </div>

                  {template.lastExecutionAt && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Dernière exécution
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(template.lastExecutionAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  )}

                  {template.nextExecutionAt && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-1">
                        Prochaine exécution
                      </p>
                      <p className="text-base font-semibold text-green-700">
                        {new Date(template.nextExecutionAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Variables */}
            {template.variables.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Variables Utilisées
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200 font-medium"
                    >
                      {`{${variable}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recipients */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Destinataires ({activeClients.length})
                </h3>
              </div>

              {activeClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Aucun destinataire actif</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeClients.map((tc) => (
                    <div
                      key={tc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {tc.client.raisonSociale}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {tc.client.user.email}
                          </span>
                        </div>
                        {tc.client.siret && (
                          <p className="text-xs text-gray-500 mt-1">
                            SIRET: {tc.client.siret}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Actif
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Depuis le{" "}
                          {new Date(tc.dateAssignation).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Form */}
            {template.includeForm && template.dynamicForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Formulaire Dynamique
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <h4 className="font-semibold text-pink-900 mb-1">
                      {template.dynamicForm.title}
                    </h4>
                    {template.dynamicForm.description && (
                      <p className="text-sm text-pink-700 mt-1">
                        {template.dynamicForm.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Nombre de champs</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.dynamicForm.fields.length}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Expiration</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.dynamicForm.expirationDays} jours
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Authentification</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.dynamicForm.requiresAuthentication
                          ? "Requise"
                          : "Non requise"}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Statut</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.dynamicForm.isActive ? "Actif" : "Inactif"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Structure du formulaire :
                    </h4>
                    <div className="space-y-2">
                      {template.dynamicForm.fields.map((field, index) => {
                        const fieldType = fieldTypes[field.type] || { icon: '📄', label: field.type };
                        return (
                        <div
                          key={`field-${field.id}-${index}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded font-mono">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {field.label}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {fieldType.icon}{" "}
                                  {fieldType.label}
                                </span>
                                {field.required && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                    Obligatoire
                                  </span>
                                )}
                                {field.options && field.options.length > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                    {field.options.length} option(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Aperçu du Template
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Visualisation de l'email
                  {template.includeForm && " + formulaire"}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Email Preview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Email
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="text-sm space-y-1">
                        <div className="font-medium text-gray-700">
                          De: votre-email@entreprise.com
                        </div>
                        <div className="text-gray-500">
                          À: client@exemple.com
                        </div>
                        <div>
                          <span className="text-gray-600">Objet: </span>
                          <span
                            className="font-medium text-gray-900"
                            dangerouslySetInnerHTML={{
                              __html: renderContentWithVariables(
                                template.subject
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderContentWithVariables(
                            template.content.replace(/\n/g, "<br>")
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Preview */}
                {template.includeForm &&
                  template.dynamicForm &&
                  template.dynamicForm.fields.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Formulaire Dynamique
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="font-semibold text-gray-900">
                            {template.dynamicForm.title}
                          </h4>
                          {template.dynamicForm.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {template.dynamicForm.description}
                            </p>
                          )}
                        </div>

                        <div className="p-4 space-y-4">
                          {template.dynamicForm.fields.map((field) => (
                            <div key={field.id}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              {renderFormField(field)}
                              {field.placeholder && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {field.placeholder}
                                </p>
                              )}
                            </div>
                          ))}

                          <div className="pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              disabled
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg opacity-50 cursor-not-allowed"
                            >
                              Soumettre le formulaire
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Template Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Métadonnées
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium">
                        {templateType?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Catégorie:</span>
                      <span className="ml-2 font-medium">
                        {template.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Variables:</span>
                      <span className="ml-2 font-medium">
                        {template.variables.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Utilisations:</span>
                      <span className="ml-2 font-medium">
                        {template.usageCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Formulaire:</span>
                      <span
                        className={`ml-2 font-medium ${
                          template.includeForm
                            ? "text-purple-600"
                            : "text-gray-500"
                        }`}
                      >
                        {template.includeForm
                          ? template.dynamicForm?.fields.length || 0
                          : "Non"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut:</span>
                      <span
                        className={`ml-2 font-medium ${
                          template.actif ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {template.actif ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    {template.isPeriodic && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Périodicité:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {cronPresetLabels[template.cronExpression || ""] ||
                            template.cronExpression}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(TemplateViewPage, [Role.COMPTABLE]);