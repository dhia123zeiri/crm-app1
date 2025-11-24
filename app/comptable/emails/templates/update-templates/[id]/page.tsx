"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { withRoleGuard } from "@/app/common/components/RolePageGuard";
import { Role } from "@/app/auth/get-user";
import { serverPut, serverGet } from "@/app/common/util/fetch";
import { updateTemplate } from "./update-template";

// Define interfaces (same as create page)
interface Client {
  id: string;
  raisonSociale: string;
  siret?: string;
  user?: {
    email: string;
  };
}

interface TemplateType {
  value: string;
  label: string;
  color: string;
}

interface FieldType {
  value: string;
  label: string;
  icon: string;
}

interface CronPreset {
  value: string;
  label: string;
  description: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  validation: Record<string, any>;
}

interface DynamicForm {
  title: string;
  description: string;
  fields: FormField[];
  expirationDays: number;
  requiresAuthentication: boolean;
}

interface CurrentField {
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  validation: Record<string, any>;
}

interface FormData {
  nom: string;
  subject: string;
  content: string;
  type: string;
  category: string;
  variables: string[];
  actif: boolean;
  isPeriodic: boolean;
  cronExpression: string | null;
  clientIds: string[];
  sendToAllClients: boolean;
  includeForm: boolean;
}

// API functions
async function getTemplate(templateId: string) {
  try {
    const response = await serverGet(`template-emails/${templateId}`);
    return { template: response, error: null };
  } catch (error: any) {
    return { template: null, error: error.message };
  }
}

async function getClients() {
  try {
    const response = await serverGet('template-emails/clients');
    return { clients: response, error: null };
  } catch (error: any) {
    return { clients: [], error: error.message };
  }
}



function UpdateTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    nom: "",
    subject: "",
    content: "",
    type: "CUSTOM",
    category: "",
    variables: [],
    actif: true,
    isPeriodic: false,
    cronExpression: null,
    clientIds: [],
    sendToAllClients: false,
    includeForm: false,
  });

  const [originalTemplate, setOriginalTemplate] = useState<any>(null);

  const [dynamicForm, setDynamicForm] = useState<DynamicForm>({
    title: "",
    description: "",
    fields: [],
    expirationDays: 30,
    requiresAuthentication: true,
  });

  const [currentField, setCurrentField] = useState<CurrentField>({
    type: "text",
    label: "",
    placeholder: "",
    required: true,
    options: [],
    validation: {},
  });

  const [newVariable, setNewVariable] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showFormBuilder, setShowFormBuilder] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [newOptionText, setNewOptionText] = useState<string>("");

  const templateTypes: TemplateType[] = [
    { value: "REMINDER", label: "Rappel", color: "text-orange-600" },
    { value: "INVOICE", label: "Facture", color: "text-blue-600" },
    { value: "INFO", label: "Information", color: "text-purple-600" },
    { value: "CUSTOM", label: "Personnalisé", color: "text-gray-600" },
  ];

  const fieldTypes: FieldType[] = [
    { value: "text", label: "Texte simple", icon: "📝" },
    { value: "email", label: "Email", icon: "📧" },
    { value: "tel", label: "Téléphone", icon: "📱" },
    { value: "number", label: "Nombre", icon: "🔢" },
    { value: "date", label: "Date", icon: "📅" },
    { value: "textarea", label: "Zone de texte", icon: "📄" },
    { value: "select", label: "Liste déroulante", icon: "📋" },
    { value: "radio", label: "Boutons radio", icon: "⚪" },
    { value: "checkbox", label: "Cases à cocher", icon: "☑️" },
    { value: "file", label: "Fichier", icon: "📎" },
    { value: "signature", label: "Signature", icon: "✍️" },
  ];

  const commonCategories: string[] = [
    "Facturation",
    "Rappel de paiement",
    "Information client",
    "Marketing",
    "Support",
    "Relance commerciale",
    "Confirmation",
    "Bienvenue",
  ];

  const commonVariables: string[] = [
    "client_name",
    "siret",
    "deadline",
    "month",
    "amount",
    "due_date",
    "phone",
    "email",
    "type",
    "custom_message",
    "company_name",
    "date",
    "contact_name",
    "reference",
    "address",
    "form_link",
  ];

  const cronPresets: CronPreset[] = [
    {
      value: "daily",
      label: "Quotidien (tous les jours à minuit)",
      description: "0 0 * * *",
    },
    {
      value: "weekly",
      label: "Hebdomadaire (chaque dimanche)",
      description: "0 0 * * 0",
    },
    {
      value: "monthly",
      label: "Mensuel (1er de chaque mois)",
      description: "0 0 1 * *",
    },
    { value: "quarterly", label: "Trimestriel", description: "0 0 1 */3 *" },
    { value: "yearly", label: "Annuel", description: "0 0 1 1 *" },
    { value: "hourly", label: "Toutes les heures", description: "0 * * * *" },
    {
      value: "every_30_minutes",
      label: "Toutes les 30 minutes",
      description: "*/30 * * * *",
    },
    {
      value: "every_10_minutes",
      label: "Toutes les 10 minutes",
      description: "*/10 * * * *",
    },
    {
      value: "weekdays",
      label: "Jours ouvrables (lundi à vendredi à 1h)",
      description: "0 1 * * 1-5",
    },
    {
      value: "instant_test",
      label: "Test instantané (chaque minute)",
      description: "*/1 * * * *",
    },
    { value: "custom", label: "Expression personnalisée", description: "" },
  ];

  // Load template data on mount
  useEffect(() => {
    loadTemplateData();
    loadAvailableClients();
  }, [templateId]);

  const loadTemplateData = async (): Promise<void> => {
    if (!templateId) return;

    setPageLoading(true);
    try {
      const { template, error } = await getTemplate(templateId);

      if (error) {
        throw new Error(error);
      }

      if (template) {
        setOriginalTemplate(template);
        
        // Populate form data
        setFormData({
          nom: template.nom || "",
          subject: template.subject || "",
          content: template.content || "",
          type: template.type || "CUSTOM",
          category: template.category || "",
          variables: template.variables || [],
          actif: template.actif !== undefined ? template.actif : true,
          isPeriodic: template.isPeriodic || false,
          cronExpression: template.cronExpression || null,
          clientIds: template.clients?.map((tc: any) => tc.client.id) || [],
          sendToAllClients: false, // This would need to be derived from business logic
          includeForm: template.includeForm || false,
        });

        // Populate dynamic form data if exists
        if (template.dynamicForm) {
          setDynamicForm({
            title: template.dynamicForm.title || "",
            description: template.dynamicForm.description || "",
            fields: template.dynamicForm.fields?.map((field: any, index: number) => ({
              ...field,
              id: field.id || `field-${index}`,
            })) || [],
            expirationDays: template.dynamicForm.expirationDays || 30,
            requiresAuthentication: template.dynamicForm.requiresAuthentication !== false,
          });
          setShowFormBuilder(true);
        }
      }
    } catch (error) {
      console.error("Error loading template:", error);
      setErrors({ load: "Erreur lors du chargement du template" });
    } finally {
      setPageLoading(false);
    }
  };

  const loadAvailableClients = async (): Promise<void> => {
    setLoadingClients(true);
    try {
      const { clients, error } = await getClients();

      if (error) {
        throw new Error(error);
      }

      setAvailableClients(clients);
    } catch (error) {
      console.error("Error loading clients:", error);
      setErrors((prev) => ({
        ...prev,
        clients: "Erreur lors du chargement des clients",
      }));
    } finally {
      setLoadingClients(false);
    }
  };

  // All the handler functions from create page
  const handleInputChange = (field: keyof FormData, value: any): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "isPeriodic" && !value) {
      setFormData((prev) => ({ ...prev, cronExpression: null }));
    }

    if (field === "sendToAllClients" && value) {
      setFormData((prev) => ({ ...prev, clientIds: [] }));
    }

    if (field === "clientIds" && value.length > 0) {
      setFormData((prev) => ({ ...prev, sendToAllClients: false }));
    }

    if (field === "includeForm") {
      setShowFormBuilder(value);
      if (!value) {
        setDynamicForm({
          title: "",
          description: "",
          fields: [],
          expirationDays: 30,
          requiresAuthentication: true,
        });
      }
    }
  };

  const handleFormChange = (field: keyof DynamicForm, value: any): void => {
    setDynamicForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFieldChange = (field: keyof CurrentField, value: any): void => {
    setCurrentField((prev) => ({ ...prev, [field]: value }));

    if (field === "type" && !["select", "radio", "checkbox"].includes(value)) {
      setCurrentField((prev) => ({ ...prev, options: [] }));
    }
  };

  const addFieldOption = (): void => {
    if (newOptionText.trim()) {
      setCurrentField((prev) => ({
        ...prev,
        options: [...prev.options, newOptionText.trim()],
      }));
      setNewOptionText("");
    }
  };

  const removeFieldOption = (index: number): void => {
    setCurrentField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const addFieldToForm = (): void => {
    if (!currentField.label.trim()) {
      alert("Le libellé du champ est requis");
      return;
    }

    if (
      ["select", "radio", "checkbox"].includes(currentField.type) &&
      currentField.options.length === 0
    ) {
      alert("Au moins une option est requise pour ce type de champ");
      return;
    }

    const newField: FormField = {
      ...currentField,
      id: Date.now().toString(),
    };

    setDynamicForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setCurrentField({
      type: "text",
      label: "",
      placeholder: "",
      required: true,
      options: [],
      validation: {},
    });
    setNewOptionText("");
  };

  const removeFieldFromForm = (fieldId: string): void => {
    setDynamicForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const moveField = (fieldId: string, direction: "up" | "down"): void => {
    setDynamicForm((prev) => {
      const fields = [...prev.fields];
      const index = fields.findIndex((f) => f.id === fieldId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= fields.length) return prev;

      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      return { ...prev, fields };
    });
  };

  const addVariable = (): void => {
    if (
      newVariable.trim() &&
      !formData.variables.includes(newVariable.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()],
      }));
      setNewVariable("");
    }
  };

  const addVariableFromList = (variable: string): void => {
    if (!formData.variables.includes(variable)) {
      setFormData((prev) => ({
        ...prev,
        variables: [...prev.variables, variable],
      }));
    }
  };

  const insertVariableIntoContent = (variable: string): void => {
    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      const newContent =
        currentContent.slice(0, start) +
        `{${variable}}` +
        currentContent.slice(end);

      handleInputChange("content", newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length + 2,
          start + variable.length + 2
        );
      }, 0);
    }
  };

  const insertVariableIntoSubject = (variable: string): void => {
    const input = document.getElementById("subject-input") as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentSubject = formData.subject;
      const newSubject =
        currentSubject.slice(0, start) +
        `{${variable}}` +
        currentSubject.slice(end);

      handleInputChange("subject", newSubject);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(
          start + variable.length + 2,
          start + variable.length + 2
        );
      }, 0);
    }
  };

  const handleClientSelection = (clientId: string, selected: boolean): void => {
    if (selected) {
      handleInputChange("clientIds", [...formData.clientIds, clientId]);
    } else {
      handleInputChange(
        "clientIds",
        formData.clientIds.filter((id) => id !== clientId)
      );
    }
  };

  const removeVariable = (variableToRemove: string): void => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter(
        (variable) => variable !== variableToRemove
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Le sujet est requis";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Le contenu est requis";
    }

    if (!formData.category.trim()) {
      newErrors.category = "La catégorie est requise";
    }

    if (formData.isPeriodic && !formData.cronExpression) {
      newErrors.cronExpression =
        "L'expression cron est requise pour les templates périodiques";
    }

    if (!formData.sendToAllClients && formData.clientIds.length === 0) {
      newErrors.clients =
        "Veuillez sélectionner au moins un client ou cocher 'Envoyer à tous les clients'";
    }

    if (formData.includeForm) {
      if (!dynamicForm.title.trim()) {
        newErrors.formTitle = "Le titre du formulaire est requis";
      }
      if (dynamicForm.fields.length === 0) {
        newErrors.formFields =
          "Au moins un champ est requis dans le formulaire";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = (): boolean => {
    if (!originalTemplate) return true;

    // Check basic fields
    const basicFieldsChanged = (
      formData.nom !== originalTemplate.nom ||
      formData.subject !== originalTemplate.subject ||
      formData.content !== originalTemplate.content ||
      formData.type !== originalTemplate.type ||
      formData.category !== originalTemplate.category ||
      formData.actif !== originalTemplate.actif ||
      formData.isPeriodic !== originalTemplate.isPeriodic ||
      formData.cronExpression !== originalTemplate.cronExpression ||
      formData.includeForm !== originalTemplate.includeForm ||
      JSON.stringify(formData.variables.sort()) !== JSON.stringify((originalTemplate.variables || []).sort()) ||
      JSON.stringify(formData.clientIds.sort()) !== JSON.stringify((originalTemplate.clients?.map((tc: any) => tc.client.id) || []).sort())
    );

    // Check dynamic form changes
    const originalFormFields = originalTemplate.dynamicForm?.fields || [];
    const currentFormFields = dynamicForm.fields;
    const formFieldsChanged = (
      dynamicForm.title !== (originalTemplate.dynamicForm?.title || "") ||
      dynamicForm.description !== (originalTemplate.dynamicForm?.description || "") ||
      dynamicForm.expirationDays !== (originalTemplate.dynamicForm?.expirationDays || 30) ||
      dynamicForm.requiresAuthentication !== (originalTemplate.dynamicForm?.requiresAuthentication !== false) ||
      JSON.stringify(currentFormFields) !== JSON.stringify(originalFormFields)
    );

    return basicFieldsChanged || formFieldsChanged;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const templateData = {
        nom: formData.nom,
        subject: formData.subject,
        content: formData.content,
        type: formData.type,
        category: formData.category,
        variables: formData.variables,
        actif: formData.actif,
        isPeriodic: formData.isPeriodic,
        cronExpression: formData.cronExpression,
        sendToAllClients: formData.sendToAllClients,
        clientIds: formData.clientIds,
        includeForm: formData.includeForm,
        dynamicForm: formData.includeForm ? {
          title: dynamicForm.title,
          description: dynamicForm.description,
          fields: dynamicForm.fields.map(field => ({
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options,
            validation: field.validation
          })),
          expirationDays: dynamicForm.expirationDays,
          requiresAuthentication: dynamicForm.requiresAuthentication,
          isActive: true
        } : undefined
      };

      const { error } = await updateTemplate(templateId, templateData);

      if (!error) {
        router.push("/comptable/emails/templates");
      } else {
        setErrors({ submit: error });
      }
    } catch (error) {
      console.error("Error updating template:", error);
      setErrors({
        submit: "Une erreur est survenue lors de la mise à jour du template",
      });
    } finally {
      setLoading(false);
    }
  };

  // Include all the render helper functions from create page
  const renderFormField = (field: FormField, index: number): React.JSX.Element => {
    const baseClasses =
      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            key={field.id}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className={baseClasses}
            defaultValue="Sample text for preview"
          />
        );
      case "select":
        return (
          <select
            key={field.id}
            required={field.required}
            className={baseClasses}
            defaultValue=""
          >
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
          <div key={field.id} className="space-y-2">
            {field.options.map((option, i) => (
              <label key={i} className="flex items-center">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={option}
                  required={field.required}
                  className="mr-2"
                  defaultChecked={i === 0}
                />
                {option}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="space-y-2">
            {field.options.map((option, i) => (
              <label key={i} className="flex items-center">
                <input type="checkbox" value={option} className="mr-2" />
                {option}
              </label>
            ))}
          </div>
        );
      case "file":
        return (
          <input
            key={field.id}
            type="file"
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        );
      case "signature":
        return (
          <div
            key={field.id}
            className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center"
          >
            <div className="text-gray-500 mb-2">Zone de signature</div>
            <div className="bg-white border border-dashed border-gray-300 rounded h-24 flex items-center justify-center">
              <span className="text-gray-400">Cliquez pour signer</span>
            </div>
          </div>
        );
      default:
        return (
          <input
            key={field.id}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            className={baseClasses}
            defaultValue={field.type === "email" ? "client@exemple.com" : 
                          field.type === "tel" ? "01 23 45 67 89" :
                          field.type === "date" ? "2024-01-01" :
                          field.type === "number" ? "123" : 
                          "Exemple de texte"}
          />
        );
    }
  };

  const renderContentWithVariables = (content: string): string => {
    let renderedContent = content;
    formData.variables.forEach((variable) => {
      const regex = new RegExp(`{${variable}}`, "gi");
      renderedContent = renderedContent.replace(
        regex,
        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{${variable}}</span>`
      );
    });
    return renderedContent;
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du template...</p>
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
              <button 
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-2xl">✏️</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Modifier Template: {originalTemplate?.nom}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Modifiez le template d'email{" "}
                    {formData.includeForm && "avec formulaire dynamique"}
                    {hasChanges() && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        Modifications non sauvegardées
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  showPreview
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{showPreview ? "🙈" : "👁"}</span>
                {showPreview ? "Masquer l'aperçu" : "Aperçu"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div
          className={`${
            showPreview
              ? "grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8"
              : "max-w-4xl mx-auto"
          }`}
        >
          {/* The rest of the form content is identical to create page but with updated header and submit button */}
          <div className="space-y-6">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-lg border border-gray-100"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Modifier le Template
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Apportez vos modifications au template existant
                </p>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Template Name */}
                <div>
                  <label
                    htmlFor="nom"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nom du template <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.nom ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Nom de votre template..."
                    maxLength={255}
                    required
                  />
                  {errors.nom && (
                    <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                  )}
                </div>

                {/* Type and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {templateTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="category"
                      list="categories"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.category ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Choisir ou créer..."
                      maxLength={255}
                      required
                    />
                    <datalist id="categories">
                      {commonCategories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.category}
                      </p>
                    )}
                  </div>
                </div>

                {/* Include Form Toggle */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600 text-lg">📋</span>
                      <div>
                        <h3 className="text-sm font-medium text-purple-900">
                          Formulaire Dynamique
                        </h3>
                        <p className="text-xs text-purple-700">
                          Créer un formulaire personnalisé pour les clients
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="includeForm"
                      checked={formData.includeForm}
                      onChange={(e) =>
                        handleInputChange("includeForm", e.target.checked)
                      }
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Periodic Template */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600 text-lg">⏰</span>
                      <h3 className="text-sm font-medium text-blue-900">
                        Template Périodique
                      </h3>
                    </div>
                    <input
                      type="checkbox"
                      id="isPeriodic"
                      checked={formData.isPeriodic}
                      onChange={(e) =>
                        handleInputChange("isPeriodic", e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  {formData.isPeriodic && (
                    <div>
                      <label
                        htmlFor="cronExpression"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Fréquence d'envoi{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="cronExpression"
                        value={formData.cronExpression || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "cronExpression",
                            e.target.value || null
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.cronExpression
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Sélectionner une fréquence...</option>
                        {cronPresets.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      {errors.cronExpression && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.cronExpression}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Selection */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-purple-600 text-lg">👥</span>
                    <h3 className="text-sm font-medium text-purple-900">
                      Destinataires
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sendToAllClients"
                        checked={formData.sendToAllClients}
                        onChange={(e) =>
                          handleInputChange(
                            "sendToAllClients",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="sendToAllClients"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Envoyer à tous mes clients
                      </label>
                    </div>

                    {!formData.sendToAllClients && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sélectionner des clients spécifiques
                        </label>
                        {loadingClients ? (
                          <p className="text-sm text-gray-500">
                            Chargement des clients...
                          </p>
                        ) : availableClients.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Aucun client disponible
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                            {availableClients.map((client) => (
                              <div
                                key={client.id}
                                className="flex items-center p-3 hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  id={`client-${client.id}`}
                                  checked={formData.clientIds.includes(
                                    client.id
                                  )}
                                  onChange={(e) =>
                                    handleClientSelection(
                                      client.id,
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`client-${client.id}`}
                                  className="ml-3 flex-1"
                                >
                                  <div className="text-sm font-medium text-gray-900">
                                    {client.raisonSociale}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {client.user?.email}{" "}
                                    {client.siret && `• SIRET: ${client.siret}`}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {errors.clients && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.clients}
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject-input"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sujet de l'email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.subject ? "border-red-300" : "border-gray-300"
                    } hover:border-green-400`}
                    placeholder="Sujet de votre email..."
                    maxLength={500}
                    required
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Variables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variables
                    <span
                      className="inline-flex items-center ml-1"
                      title="Les variables peuvent être utilisées dans le sujet et le contenu avec la syntaxe {nom_variable}"
                    >
                      <span className="text-gray-400">ℹ</span>
                    </span>
                  </label>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Variables courantes :
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {commonVariables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded cursor-pointer hover:bg-blue-200 transition-colors group"
                          onClick={() => addVariableFromList(variable)}
                          title="Cliquer pour ajouter"
                        >
                          {variable}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            +
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addVariable())
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nom de la variable (ex: nom_client)"
                    />
                    <button
                      type="button"
                      onClick={addVariable}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <span className="mr-2">+</span>
                    </button>
                  </div>

                  {formData.variables.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Vos variables :
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.variables.map((variable, index) => (
                          <div key={index} className="group relative">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                              {`{${variable}}`}
                              <button
                                type="button"
                                onClick={() => removeVariable(variable)}
                                className="ml-2 text-green-500 hover:text-green-700"
                              >
                                ×
                              </button>
                            </span>
                            <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <button
                                type="button"
                                onClick={() =>
                                  insertVariableIntoSubject(variable)
                                }
                                className="bg-green-500 text-white text-xs px-1 py-0.5 rounded hover:bg-green-600"
                                title="Insérer dans le sujet"
                              >
                                S
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  insertVariableIntoContent(variable)
                                }
                                className="bg-purple-500 text-white text-xs px-1 py-0.5 rounded hover:bg-purple-600"
                                title="Insérer dans le contenu"
                              >
                                C
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label
                    htmlFor="content-textarea"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contenu de l'email <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content-textarea"
                    value={formData.content}
                    onChange={(e) =>
                      handleInputChange("content", e.target.value)
                    }
                    rows={8}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-colors ${
                      errors.content ? "border-red-300" : "border-gray-300"
                    } hover:border-green-400`}
                    placeholder="Contenu de votre email... Vous pouvez utiliser les variables avec la syntaxe {nom_variable}"
                    required
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.content}
                    </p>
                  )}

                  {formData.includeForm && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-700">
                        💡 Tip: Utilisez la variable{" "}
                        <code className="bg-purple-100 px-1 rounded">
                          {"{form_link}"}
                        </code>{" "}
                        dans votre contenu pour inclure automatiquement le lien
                        vers le formulaire dynamique.
                      </p>
                      <button
                        type="button"
                        onClick={() => insertVariableIntoContent("form_link")}
                        className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                      >
                        Insérer {"{form_link}"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="actif"
                    checked={formData.actif}
                    onChange={(e) =>
                      handleInputChange("actif", e.target.checked)
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="actif"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Template actif (peut être utilisé immédiatement)
                  </label>
                </div>

                {/* Error message */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-red-400 mr-2">⚠</span>
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  </div>
                )}

                {errors.load && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="text-red-400 mr-2">⚠</span>
                      <p className="text-sm text-red-800">{errors.load}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !hasChanges()}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <span className="mr-2">💾</span>
                    )}
                    {loading ? "Mise à jour..." : "Mettre à jour le Template"}
                  </button>
                </div>
              </div>
            </form>

            {/* Dynamic Form Builder - identical to create page */}
            {showFormBuilder && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Modificateur de Formulaire Dynamique
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Modifiez le formulaire personnalisé envoyé aux clients
                  </p>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {/* Form Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre du formulaire{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={dynamicForm.title}
                        onChange={(e) =>
                          handleFormChange("title", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors.formTitle
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Ex: Questionnaire fiscal 2024"
                      />
                      {errors.formTitle && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.formTitle}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiration (jours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={dynamicForm.expirationDays}
                        onChange={(e) =>
                          handleFormChange(
                            "expirationDays",
                            parseInt(e.target.value) || 30
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description du formulaire
                    </label>
                    <textarea
                      value={dynamicForm.description}
                      onChange={(e) =>
                        handleFormChange("description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Description ou instructions pour vos clients..."
                    />
                  </div>

                  {/* Grid Layout pour Form Builder et Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Field Builder - identical to create page */}
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <h3 className="text-md font-semibold text-purple-900 mb-4">
                        Ajouter un champ
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de champ
                          </label>
                          <select
                            value={currentField.type}
                            onChange={(e) =>
                              handleFieldChange("type", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Libellé du champ{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentField.label}
                            onChange={(e) =>
                              handleFieldChange("label", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ex: Nom de l'entreprise"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Placeholder (optionnel)
                          </label>
                          <input
                            type="text"
                            value={currentField.placeholder}
                            onChange={(e) =>
                              handleFieldChange("placeholder", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Texte d'aide..."
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="fieldRequired"
                            checked={currentField.required}
                            onChange={(e) =>
                              handleFieldChange("required", e.target.checked)
                            }
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="fieldRequired"
                            className="ml-2 text-sm text-gray-700"
                          >
                            Champ obligatoire
                          </label>
                        </div>

                        {/* Options for select, radio, checkbox */}
                        {["select", "radio", "checkbox"].includes(
                          currentField.type
                        ) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options <span className="text-red-500">*</span>
                            </label>

                            <div className="flex space-x-2 mb-3">
                              <input
                                type="text"
                                value={newOptionText}
                                onChange={(e) =>
                                  setNewOptionText(e.target.value)
                                }
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addFieldOption();
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Tapez une option..."
                              />
                              <button
                                type="button"
                                onClick={addFieldOption}
                                disabled={!newOptionText.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Ajouter
                              </button>
                            </div>

                            <div className="space-y-2">
                              {currentField.options.map((option, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 bg-white p-2 rounded border"
                                >
                                  <span className="flex-1 text-sm">
                                    {option}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFieldOption(index)}
                                    className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-sm"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              ))}

                              {currentField.options.length === 0 && (
                                <p className="text-sm text-gray-500 italic bg-white p-2 rounded border border-dashed">
                                  Aucune option ajoutée. Ajoutez au moins une
                                  option.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={addFieldToForm}
                          disabled={
                            !currentField.label.trim() ||
                            (["select", "radio", "checkbox"].includes(
                              currentField.type
                            ) &&
                              currentField.options.length === 0)
                          }
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Ajouter ce champ au formulaire
                        </button>
                      </div>
                    </div>

                    {/* Structure Preview */}
                    <div className="border border-gray-200 rounded-lg bg-gray-50">
                      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
                        <h3 className="text-md font-semibold text-gray-900">
                          Structure du Formulaire
                        </h3>
                        <p className="text-sm text-gray-500">
                          Aperçu en temps réel - {dynamicForm.fields.length}{" "}
                          champ(s)
                        </p>
                      </div>

                      <div className="p-4 max-h-96 overflow-y-auto">
                        {dynamicForm.fields.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📝</div>
                            <p className="text-sm">Aucun champ ajouté</p>
                            <p className="text-xs">
                              Ajoutez des champs pour voir la structure
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dynamicForm.fields.map((field, index) => (
                              <div
                                key={field.id}
                                className="bg-white border border-gray-200 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-mono">
                                      #{index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900 text-sm">
                                      {field.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => moveField(field.id, "up")}
                                      disabled={index === 0}
                                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-xs"
                                      title="Monter"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        moveField(field.id, "down")
                                      }
                                      disabled={
                                        index === dynamicForm.fields.length - 1
                                      }
                                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-xs"
                                      title="Descendre"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFieldFromForm(field.id)
                                      }
                                      className="p-1 text-red-500 hover:text-red-700 text-xs"
                                      title="Supprimer"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 text-xs">
                                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {
                                      fieldTypes.find(
                                        (t) => t.value === field.type
                                      )?.icon
                                    }{" "}
                                    {
                                      fieldTypes.find(
                                        (t) => t.value === field.type
                                      )?.label
                                    }
                                  </span>
                                  {field.required && (
                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
                                      Obligatoire
                                    </span>
                                  )}
                                  {field.options &&
                                    field.options.length > 0 && (
                                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                        {field.options.length} option(s)
                                      </span>
                                    )}
                                  {Object.keys(field.validation).length > 0 && (
                                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded">
                                      Validation
                                    </span>
                                  )}
                                </div>

                                {field.placeholder && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    Placeholder: "{field.placeholder}"
                                  </div>
                                )}

                                {field.options && field.options.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-600 mb-1">
                                      Options:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {field.options.map((option, i) => (
                                        <span
                                          key={i}
                                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border"
                                        >
                                          {option}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {Object.keys(field.validation).length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-600 mb-1">
                                      Validations:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {field.validation.minLength && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          Min: {field.validation.minLength}
                                        </span>
                                      )}
                                      {field.validation.maxLength && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          Max: {field.validation.maxLength}
                                        </span>
                                      )}
                                      {field.validation.min !== undefined && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          Min: {field.validation.min}
                                        </span>
                                      )}
                                      {field.validation.max !== undefined && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          Max: {field.validation.max}
                                        </span>
                                      )}
                                      {field.validation.pattern && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          Pattern
                                        </span>
                                      )}
                                      {field.validation.accept && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          {field.validation.accept}
                                        </span>
                                      )}
                                      {field.validation.maxSize && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">
                                          Max: {field.validation.maxSize}MB
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel - identical to create page */}
          {showPreview && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Aperçu des Modifications
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Email + {formData.includeForm ? "Formulaire" : "Template seul"}
                  {hasChanges() && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      Modifié
                    </span>
                  )}
                </p>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Email Preview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Aperçu de l'Email
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
                          <span className="font-medium text-gray-900">
                            {formData.subject || "Sujet de l'email..."}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderContentWithVariables(
                            formData.content.replace(/\n/g, "<br>") ||
                              "<em>Contenu de l'email...</em>"
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Preview */}
                {formData.includeForm && dynamicForm.fields.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Aperçu du Formulaire
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">
                          {dynamicForm.title || "Titre du formulaire"}
                        </h4>
                        {dynamicForm.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {dynamicForm.description}
                          </p>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {dynamicForm.fields.map((field, index) => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {renderFormField(field, index)}
                          </div>
                        ))}

                        <div className="pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Soumettre le formulaire
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template Info with Changes Indicator */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Informations du Template
                    {hasChanges() && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        Modifications en cours
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium">
                        {templateTypes.find((t) => t.value === formData.type)
                          ?.label || formData.type}
                      </span>
                      {originalTemplate && originalTemplate.type !== formData.type && (
                        <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Catégorie:</span>
                      <span className="ml-2 font-medium">
                        {formData.category || "Non définie"}
                      </span>
                      {originalTemplate && originalTemplate.category !== formData.category && (
                        <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Variables:</span>
                      <span className="ml-2">
                        {formData.variables.length || 0}
                      </span>
                      {originalTemplate && 
                        JSON.stringify(originalTemplate.variables?.sort()) !== 
                        JSON.stringify(formData.variables.sort()) && (
                        <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Formulaire:</span>
                      <span
                        className={`ml-2 font-medium ${
                          formData.includeForm
                            ? "text-purple-600"
                            : "text-gray-500"
                        }`}
                      >
                        {formData.includeForm
                          ? `${dynamicForm.fields.length} champs`
                          : "Non inclus"}
                      </span>
                      {originalTemplate && originalTemplate.includeForm !== formData.includeForm && (
                        <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Statut:</span>
                      <span
                        className={`ml-2 font-medium ${
                          formData.actif ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formData.actif ? "Actif" : "Inactif"}
                      </span>
                      {originalTemplate && originalTemplate.actif !== formData.actif && (
                        <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">Destinataires:</span>
                      <span className="ml-2 font-medium">
                        {formData.sendToAllClients
                          ? "Tous les clients"
                          : `${formData.clientIds.length} sélectionné(s)`}
                      </span>
                      {originalTemplate && 
                        JSON.stringify(originalTemplate.clients?.map((tc: any) => tc.client.id).sort()) !==
                        JSON.stringify(formData.clientIds.sort()) && (
                        <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                      )}
                    </div>
                    {formData.isPeriodic && (
                      <div>
                        <span className="text-gray-600">Périodique:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {cronPresets.find(
                            (p) => p.value === formData.cronExpression
                          )?.label || "Oui"}
                        </span>
                        {originalTemplate && 
                          (originalTemplate.isPeriodic !== formData.isPeriodic ||
                           originalTemplate.cronExpression !== formData.cronExpression) && (
                          <span className="ml-1 text-orange-600 text-xs">(modifié)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show original vs current comparison */}
                  {originalTemplate && hasChanges() && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">
                        Résumé des modifications:
                      </h5>
                      <div className="space-y-1 text-xs text-gray-600">
                        {originalTemplate.nom !== formData.nom && (
                          <div>• Nom: "{originalTemplate.nom}" → "{formData.nom}"</div>
                        )}
                        {originalTemplate.subject !== formData.subject && (
                          <div>• Sujet modifié</div>
                        )}
                        {originalTemplate.content !== formData.content && (
                          <div>• Contenu modifié</div>
                        )}
                        {originalTemplate.type !== formData.type && (
                          <div>• Type: {originalTemplate.type} → {formData.type}</div>
                        )}
                        {originalTemplate.category !== formData.category && (
                          <div>• Catégorie: "{originalTemplate.category}" → "{formData.category}"</div>
                        )}
                        {originalTemplate.actif !== formData.actif && (
                          <div>• Statut: {originalTemplate.actif ? 'Actif' : 'Inactif'} → {formData.actif ? 'Actif' : 'Inactif'}</div>
                        )}
                        {originalTemplate.includeForm !== formData.includeForm && (
                          <div>• Formulaire: {originalTemplate.includeForm ? 'Inclus' : 'Non inclus'} → {formData.includeForm ? 'Inclus' : 'Non inclus'}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(UpdateTemplatePage, [Role.COMPTABLE]);