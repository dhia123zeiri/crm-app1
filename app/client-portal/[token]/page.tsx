"use client";
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Lock,
  Building2,
  Mail,
  Phone,
  Calendar,
  FileText,
  Send,
  Eye,
  EyeOff,
  Upload,
  X,
} from "lucide-react";
import { useSecureForm, FormData } from "../hooks/useSecureForm";

// Types
interface FormField {
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
  };
  options?: string[];
}

interface FormResponses {
  [key: string]: string | string[] | number;
}

interface ValidationErrors {
  [key: string]: string | null;
}

interface ShowPasswordState {
  [key: string]: boolean;
}

export default function SecureClientForm() {
  const [responses, setResponses] = useState<FormResponses>({});
  const [files, setFiles] = useState<{ [key: string]: File[] }>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState<ShowPasswordState>({});

  // Extract token from URL
  const getTokenFromUrl = (): string => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromQuery = urlParams.get("token");

      if (tokenFromQuery) {
        return tokenFromQuery;
      }

      // Alternative: extract from path if URL is like /form/token123
      const pathSegments = window.location.pathname.split("/");
      const tokenFromPath = pathSegments[pathSegments.length - 1];

      if (tokenFromPath && tokenFromPath !== "form") {
        return tokenFromPath;
      }
    }

    return "";
  };

  const token = getTokenFromUrl();
  const { formData, loading, submitting, error, setError, loadFormData, submitForm } = useSecureForm(token);

  useEffect(() => {
    loadFormData();
  }, []);

  // Load existing responses if form is already completed
  useEffect(() => {
    if (formData?.isCompleted && formData?.existingResponse) {
      setResponses(formData.existingResponse.responses || {});
      setSubmitted(true);
    }
  }, [formData]);

  const handleInputChange = (
    fieldLabel: string,
    value: string | string[] | number
  ): void => {
    setResponses((prev) => ({
      ...prev,
      [fieldLabel]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[fieldLabel]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldLabel]: null,
      }));
    }
  };

  const validateField = (
    field: FormField,
    value: string | string[] | number
  ): string[] => {
    const errors: string[] = [];

    if (
      field.required &&
      (!value ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0))
    ) {
      errors.push(`${field.label} est obligatoire`);
    }

    if (value && value !== "") {
      switch (field.type) {
        case "email":
          if (typeof value === "string") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push("Format email invalide");
            }
          }
          break;

        case "tel":
          if (typeof value === "string") {
            const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
            if (!phoneRegex.test(value)) {
              errors.push("Format téléphone invalide");
            }
          }
          break;

        case "number":
          if (typeof value === "string") {
            if (isNaN(Number(value))) {
              errors.push("Doit être un nombre");
            } else {
              const numValue = Number(value);
              if (
                field.validation?.min !== undefined &&
                numValue < field.validation.min
              ) {
                errors.push(
                  `Doit être supérieur ou égal à ${field.validation.min}`
                );
              }
              if (
                field.validation?.max !== undefined &&
                numValue > field.validation.max
              ) {
                errors.push(
                  `Doit être inférieur ou égal à ${field.validation.max}`
                );
              }
            }
          }
          break;

        case "date":
          if (typeof value === "string" && isNaN(Date.parse(value))) {
            errors.push("Format date invalide");
          }
          break;

        case "file":
          const fileList = files[field.label] || [];
          if (field.required && fileList.length === 0) {
            errors.push(`${field.label} est obligatoire`);
          }
          if (field.validation?.max && fileList.length > field.validation.max) {
            errors.push(`Maximum ${field.validation.max} fichier(s) autorisé(s)`);
          }
          if (field.validation?.maxLength) {
            const oversizedFiles = fileList.filter(
              (file) => file.size > field.validation!.maxLength!
            );
            if (oversizedFiles.length > 0) {
              errors.push(
                `Fichier(s) trop volumineux: ${oversizedFiles.map((f) => f.name).join(", ")}`
              );
            }
          }
          break;
      }

      if (field.validation && typeof value === "string") {
        if (
          field.validation.minLength &&
          value.length < field.validation.minLength
        ) {
          errors.push(`Minimum ${field.validation.minLength} caractères`);
        }
        if (
          field.validation.maxLength &&
          value.length > field.validation.maxLength
        ) {
          errors.push(`Maximum ${field.validation.maxLength} caractères`);
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push(field.validation.patternMessage || "Format invalide");
          }
        }
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData) return;

    const errors: ValidationErrors = {};
    let hasErrors = false;

    // Validate all fields
    formData.dynamicForm.fields.forEach((field) => {
      const fieldErrors = validateField(field, responses[field.label] || "");
      if (fieldErrors.length > 0) {
        errors[field.label] = fieldErrors[0];
        hasErrors = true;
      }
    });

    setValidationErrors(errors);

    if (hasErrors) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const success = await submitForm(responses, files);
    if (success) {
      setSubmitted(true);
    }
  };

  const renderField = (field: FormField): React.JSX.Element | null => {
    const value = responses[field.label] || "";
    const hasError = validationErrors[field.label];

    const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
      hasError
        ? "border-red-500 bg-red-50"
        : "border-gray-300 hover:border-gray-400"
    }`;

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              {field.type === "email" && (
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              )}
              {field.type === "tel" && (
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              )}
              <input
                type={field.type}
                value={value as string}
                onChange={(e) => handleInputChange(field.label, e.target.value)}
                placeholder={field.placeholder}
                className={`${baseInputClasses} ${
                  field.type === "email" || field.type === "tel" ? "pl-10" : ""
                }`}
                disabled={submitted}
              />
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "password":
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type={showPassword[field.label] ? "text" : "password"}
                value={value as string}
                onChange={(e) => handleInputChange(field.label, e.target.value)}
                placeholder={field.placeholder}
                className={`${baseInputClasses} pl-10 pr-10`}
                disabled={submitted}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    [field.label]: !prev[field.label],
                  }))
                }
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                disabled={submitted}
              >
                {showPassword[field.label] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "date":
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={value as string}
                onChange={(e) => handleInputChange(field.label, e.target.value)}
                className={`${baseInputClasses} pl-10`}
                disabled={submitted}
              />
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <textarea
                value={value as string}
                onChange={(e) => handleInputChange(field.label, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                className={`${baseInputClasses} pl-10 resize-vertical`}
                disabled={submitted}
              />
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "select":
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value as string}
              onChange={(e) => handleInputChange(field.label, e.target.value)}
              className={baseInputClasses}
              disabled={submitted}
            >
              <option value="">Sélectionnez une option...</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-3">
              {field.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={field.label}
                    value={option}
                    checked={value === option}
                    onChange={(e) =>
                      handleInputChange(field.label, e.target.value)
                    }
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    disabled={submitted}
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "checkbox":
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-3">
              {field.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={checkboxValues.includes(option)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...checkboxValues, option]
                        : checkboxValues.filter((v) => v !== option);
                      handleInputChange(field.label, newValues);
                    }}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    disabled={submitted}
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      case "file":
        const selectedFiles = files[field.label] || [];
        return (
          <div className="space-y-2" key={field.label}>
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
              <input
                type="file"
                id={`file-${field.label}`}
                multiple={field.validation?.max !== 1}
                accept={field.validation?.pattern || "*/*"}
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setFiles((prev) => ({
                    ...prev,
                    [field.label]: newFiles,
                  }));
                  handleInputChange(
                    field.label,
                    newFiles.map((f) => f.name)
                  );
                }}
                className="hidden"
                disabled={submitted}
              />

              <label
                htmlFor={`file-${field.label}`}
                className={`${baseInputClasses} cursor-pointer flex items-center justify-center space-x-2 hover:bg-gray-50 ${
                  submitted ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} fichier(s) sélectionné(s)`
                    : field.placeholder ||
                      "Cliquez pour sélectionner des fichiers"}
                </span>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    {!submitted && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedFiles = selectedFiles.filter(
                            (_, i) => i !== index
                          );
                          setFiles((prev) => ({
                            ...prev,
                            [field.label]: updatedFiles,
                          }));
                          handleInputChange(
                            field.label,
                            updatedFiles.map((f) => f.name)
                          );
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {field.validation && (
              <div className="text-xs text-gray-500 space-y-1">
                {field.validation.max && (
                  <p>Maximum {field.validation.max} fichier(s)</p>
                )}
                {field.validation.pattern && (
                  <p>Types acceptés: {field.validation.pattern}</p>
                )}
                {field.validation.maxLength && (
                  <p>
                    Taille maximale:{" "}
                    {(field.validation.maxLength / 1024 / 1024).toFixed(1)} MB
                    par fichier
                  </p>
                )}
              </div>
            )}

            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">
            Chargement du formulaire...
          </p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Erreur de Chargement
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFormData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (submitted || formData?.isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Formulaire Complété
          </h2>
          <p className="text-gray-600 mb-4">
            Merci ! Votre formulaire a été soumis avec succès. Votre comptable a
            été notifié.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">
              Un accusé de réception sera envoyé à{" "}
              {formData?.client?.user?.email}
            </p>
          </div>
          {formData?.existingResponse?.dateCompletion && (
            <div className="mt-4 text-sm text-gray-600">
              Complété le:{" "}
              {new Date(
                formData.existingResponse.dateCompletion
              ).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!formData) return null;

  const daysUntilExpiration = Math.ceil(
    (new Date(formData.expirationDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formData.dynamicForm.title}
              </h1>
              <p className="text-gray-600">
                Pour: {formData.client.raisonSociale}
              </p>
            </div>
          </div>

          {formData.dynamicForm.description && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-blue-800">
                {formData.dynamicForm.description}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">
                Connexion Sécurisée
              </span>
            </div>
            <div
              className={`${
                daysUntilExpiration <= 3
                  ? "text-red-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              Expire dans {daysUntilExpiration} jour
              {daysUntilExpiration > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {formData.dynamicForm.fields.map((field, index) => (
              <div key={index}>{renderField(field)}</div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t">
              <button
                onClick={handleSubmit}
                disabled={submitting || submitted}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : submitted ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Formulaire Soumis</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Soumettre le Formulaire</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="text-center text-gray-600">
            <p className="font-medium">
              Envoyé par: {formData.comptable.user.nom}
            </p>
            <p className="text-sm">Contact: {formData.comptable.user.email}</p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Ce formulaire est sécurisé et vos données sont protégées. Ne
                partagez pas ce lien avec d'autres personnes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}