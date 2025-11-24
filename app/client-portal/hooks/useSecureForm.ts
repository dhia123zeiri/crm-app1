import { useState } from "react";

// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types
interface User {
  email: string;
  nom: string;
}

interface Client {
  id: number;
  raisonSociale: string;
  user: User;
}

interface Comptable {
  user: User;
}

interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

interface FormField {
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: ValidationRules;
  options?: string[];
}

interface DynamicForm {
  id: number;
  title: string;
  description: string;
  fields: FormField[];
  expirationDays: number;
}

interface ExistingResponse {
  id: number;
  responses: any;
  dateCompletion: string;
}

export interface FormData {
  dynamicForm: DynamicForm;
  client: Client;
  comptable: Comptable;
  expirationDate: string;
  isCompleted: boolean;
  existingResponse?: ExistingResponse | null;
}

interface ApiResponse {
  success: boolean;
  data: FormData;
}

interface FormResponses {
  [key: string]: string | string[] | number;
}

export const useSecureForm = (token: string) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  /**
   * Load form data from the API using the provided token
   */
  const loadFormData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/dynamic-forms/token/${token}`
      );

      console.log("API Response:", response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const apiData: ApiResponse = await response.json();

      console.log("Form Data:", apiData);

      if (!apiData.success) {
        throw new Error("API returned unsuccessful response");
      }

      setFormData(apiData.data);
      return;
    } catch (err) {
      console.error("Error loading form:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le formulaire. Le lien peut être expiré ou invalide."
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit form responses to the API
   */
  const submitForm = async (
    responses: FormResponses,
    files: { [key: string]: File[] }
  ): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError("");

      // Create FormData for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append("responses", JSON.stringify(responses));
      formDataToSend.append("ipAddress", window.location.hostname);
      formDataToSend.append("userAgent", navigator.userAgent);

      // Add files to FormData
      Object.keys(files).forEach((fieldLabel) => {
        files[fieldLabel].forEach((file, index) => {
          formDataToSend.append(`files_${fieldLabel}_${index}`, file);
        });
      });

      const response = await fetch(
        `${API_URL}/dynamic-forms/submit/${token}`,
        {
          method: "POST",
          headers: {
            "User-Agent": navigator.userAgent,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la soumission");
      }

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        throw new Error(result.message || "Erreur lors de la soumission");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la soumission. Veuillez réessayer."
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    loading,
    submitting,
    error,
    setError,
    loadFormData,
    submitForm,
  };
};