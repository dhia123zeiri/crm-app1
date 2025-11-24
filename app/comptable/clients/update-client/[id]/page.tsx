"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Building2,
  Mail,
  Lock,
  MapPin,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { getSpecificClient, updateClient, ClientApiResponse } from "../../actions/create-client";
import { useParams, useRouter } from "next/navigation";

// Types
interface UpdateClientDto {
  id?: string;
  email: string;
  siret: string;
  raisonSociale: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  typeActivite: string;
  regimeFiscal: string;
  newPassword?: string;
  password?: string; 
}

interface FormErrors {
  [key: string]: string;
}

const validateClientForm = (data: UpdateClientDto): FormErrors => {
  const errors: FormErrors = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email invalide";
  }

  if (!data.siret || data.siret.replace(/\s/g, "").length !== 14) {
    errors.siret = "Le SIRET doit contenir 14 chiffres";
  }

  if (!data.raisonSociale || data.raisonSociale.trim().length < 2) {
    errors.raisonSociale = "La raison sociale est requise";
  }

  if (data.codePostal && !/^\d{5}$/.test(data.codePostal)) {
    errors.codePostal = "Le code postal doit contenir 5 chiffres";
  }

  if (data.telephone && !/^[\d\s+().-]{10,}$/.test(data.telephone)) {
    errors.telephone = "Numéro de téléphone invalide";
  }

  if (data.newPassword && data.newPassword.length < 8) {
    errors.newPassword = "Le mot de passe doit contenir au moins 8 caractères";
  }

  return errors;
};

const formatSiret = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  const parts = [];
  for (let i = 0; i < numbers.length && i < 14; i += 3) {
    parts.push(numbers.slice(i, i + 3));
  }
  return parts.join(" ").trim();
};

function ModifyClientForm() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [formData, setFormData] = useState<UpdateClientDto>({
    id: "",
    email: "",
    siret: "",
    raisonSociale: "",
    adresse: "",
    codePostal: "",
    ville: "",
    telephone: "",
    typeActivite: "",
    regimeFiscal: "",
    newPassword: "",
  });

  const [originalData, setOriginalData] = useState<UpdateClientDto | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const regimesFiscaux = [
    "Réel normal",
    "Réel simplifié",
    "Micro-entreprise",
    "Auto-entrepreneur",
    "BNC",
    "BIC",
  ];

  const typesActivite = [
    "Commerce",
    "Artisanat",
    "Services",
    "Industrie",
    "Libéral",
    "Agriculture",
    "Autre",
  ];

  useEffect(() => {
    const loadClient = async () => {
      try {
        const data: ClientApiResponse = await getSpecificClient(clientId);
        // Now properly typed with ClientApiResponse
        const formattedData: UpdateClientDto = {
          id: clientId,
          email: data.user.email, // Now properly typed
          siret: data.siret || "",
          raisonSociale: data.raisonSociale || "",
          adresse: data.adresse || "",
          codePostal: data.codePostal || "",
          ville: data.ville || "",
          telephone: data.telephone || "",
          typeActivite: data.typeActivite || "",
          regimeFiscal: data.regimeFiscal || "",
          newPassword: "",
        };
        setFormData(formattedData);
        setOriginalData(formattedData);
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  const validateForm = (): boolean => {
    const newErrors = validateClientForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSiret(e.target.value);
    setFormData((prev) => ({ ...prev, siret: formatted }));
    if (errors.siret) {
      setErrors((prev) => ({ ...prev, siret: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const { id, newPassword, ...updateData } = formData;
      
      if (changePassword && newPassword) {
        updateData.password = newPassword;
      }

      const result = await updateClient(parseInt(clientId), updateData);

      if (result.success) {
        setSubmitStatus("success");
        setOriginalData(formData);
        setChangePassword(false);

        setTimeout(() => {
          router.push("/comptable/clients");
        }, 2000);
      } else {
        setSubmitStatus("error");
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
      }
    } catch (error) {
      setSubmitStatus("error");
      console.error("Erreur lors de la modification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
      setErrors({});
      setSubmitStatus("idle");
      setChangePassword(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-4 shadow-lg">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Modifier le Client</h1>
          <p className="text-gray-600">Mettez à jour les informations du client</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8" onKeyPress={handleKeyPress}>
            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Client modifié avec succès !</span>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Erreur lors de la modification du client</span>
              </div>
            )}

            {/* Account Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Informations de connexion
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.email ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="client@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => setChangePassword(!changePassword)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {changePassword ? "Annuler" : "Modifier le mot de passe"}
                    </button>
                  </div>
                  {changePassword && (
                    <>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword || ""}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.newPassword ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                          }`}
                          placeholder="Nouveau mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                      {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Informations de l'entreprise
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SIRET *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="siret"
                      value={formData.siret}
                      onChange={handleSiretChange}
                      maxLength={17}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.siret ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="123 456 789 12345"
                    />
                  </div>
                  {errors.siret && <p className="mt-1 text-sm text-red-600">{errors.siret}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Raison sociale *</label>
                  <input
                    type="text"
                    name="raisonSociale"
                    value={formData.raisonSociale}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.raisonSociale ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Nom de l'entreprise"
                  />
                  {errors.raisonSociale && <p className="mt-1 text-sm text-red-600">{errors.raisonSociale}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type d'activité</label>
                  <select
                    name="typeActivite"
                    value={formData.typeActivite}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">Sélectionner un type</option>
                    {typesActivite.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Régime fiscal</label>
                  <select
                    name="regimeFiscal"
                    value={formData.regimeFiscal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">Sélectionner un régime</option>
                    {regimesFiscaux.map((regime) => (
                      <option key={regime} value={regime}>
                        {regime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Informations de contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="123 Rue de la Paix"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                  <input
                    type="text"
                    name="codePostal"
                    value={formData.codePostal}
                    onChange={handleInputChange}
                    maxLength={5}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.codePostal ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="75001"
                  />
                  {errors.codePostal && <p className="mt-1 text-sm text-red-600">{errors.codePostal}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Paris"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.telephone ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100">
              <div className="mb-4 text-sm text-gray-500 text-center md:text-left">
                Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 shadow-lg ${
                    isSubmitting ? "opacity-50 cursor-not-allowed scale-100" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Modification en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      Enregistrer les modifications
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModifyClientForm;