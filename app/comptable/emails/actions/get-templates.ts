"use client"
import { serverDelete, serverGet } from "@/app/common/util/fetch";
import { useState } from "react";
import { EmailTemplate } from "../interfaces/template.interface";

export interface TemplateType {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

interface Client {
  id: number;
  raisonSociale: string;
  siret?: string;
  user: {
    email: string;
  };
}


interface DynamicForm {
  id: number;
  title: string;
  description: string;
  fields: FormField[];
  expirationDays: number;
  requiresAuthentication: boolean;
  isActive: boolean;
}


interface TemplateClient {
  id: number;
  actif: boolean;
  dateAssignation: string;
  client: Client;
}

export interface Template {
  id: number;
  nom: string;
  subject: string;
  content: string;
  type: string;
  category: string;
  actif: boolean;
  variables: string[];
  isPeriodic: boolean;
  cronExpression: string | null;
  includeForm: boolean;
  usageCount: number;
  dateCreation: string;
  dateModification: string;
  lastExecutionAt: string | null;
  nextExecutionAt: string | null;
  dynamicForm: DynamicForm | null;
  clients: TemplateClient[];
}

export const templateTypes: TemplateType[] = [
  { value: "REMINDER", label: "Rappel", color: "text-orange-600", bgColor: "bg-orange-50" },
  { value: "INVOICE", label: "Facture", color: "text-blue-600", bgColor: "bg-blue-50" },
  { value: "INFO", label: "Information", color: "text-purple-600", bgColor: "bg-purple-50" },
  { value: "CUSTOM", label: "Personnalisé", color: "text-gray-600", bgColor: "bg-gray-50" },
];

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  validation: Record<string, any>;
}

export const fieldTypes: Record<string, { label: string; icon: string }> = {
  text: { label: "Texte simple", icon: "📝" },
  email: { label: "Email", icon: "📧" },
  tel: { label: "Téléphone", icon: "📱" },
  number: { label: "Nombre", icon: "🔢" },
  date: { label: "Date", icon: "📅" },
  textarea: { label: "Zone de texte", icon: "📄" },
  select: { label: "Liste déroulante", icon: "📋" },
  radio: { label: "Boutons radio", icon: "⚪" },
  checkbox: { label: "Cases à cocher", icon: "☑️" },
  file: { label: "Fichier", icon: "📎" },
  signature: { label: "Signature", icon: "✍️" },
};

export const cronPresetLabels: Record<string, string> = {
  "0 0 * * *": "Quotidien (tous les jours à minuit)",
  "0 0 * * 0": "Hebdomadaire (chaque dimanche)",
  "0 0 1 * *": "Mensuel (1er de chaque mois)",
  "0 0 1 */3 *": "Trimestriel",
  "0 0 1 1 *": "Annuel",
  "0 * * * *": "Toutes les heures",
  "*/30 * * * *": "Toutes les 30 minutes",
  "*/10 * * * *": "Toutes les 10 minutes",
  "0 1 * * 1-5": "Jours ouvrables (lundi à vendredi à 1h)",
  "*/1 * * * *": "Test instantané (chaque minute)",
};

export async function getTemplate(templateId: string): Promise<Template> {
  return serverGet(`template-emails/${templateId}`);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  return serverDelete(`template-emails/${templateId}`);
}


export const useTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await serverGet('template-emails');
      setTemplates(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
      setError('Impossible de charger les templates');
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    loading,
    error,
    loadTemplates,
    setTemplates,
    setError
  };
};