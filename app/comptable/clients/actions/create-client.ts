import { serverDelete, serverGet, serverPost, serverPut } from "@/app/common/util/fetch";

// API Response Interface
export interface ClientApiResponse {
  id: number;
  siret: string;
  raisonSociale: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  typeActivite?: string;
  regimeFiscal?: string;
  user: {
    id: number;
    email: string;
    nom: string;
    role: string;
    dateCreation: string;
    actif: boolean;
  };
  comptable?: any;
}

export interface CreateClientDto {
  email: string;
  password: string;
  siret: string;
  raisonSociale: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  typeActivite?: string;
  regimeFiscal?: string;
}

export interface UpdateClientDto {
  password?: string;
  email?: string;
  siret?: string;
  raisonSociale?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  typeActivite?: string;
  regimeFiscal?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface CreateClientResponse {
  success: boolean;
  data?: any;
  error?: string;
  fieldErrors?: FormErrors;
}

export const createClient = async (formData: CreateClientDto): Promise<CreateClientResponse> => {
  try {
    const clientData = {
      ...formData,
      siret: formData.siret.replace(/\s/g, '')
    };

    const result = await serverPost('clients', clientData);
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('Error creating client:', error);
    
    const errorMessage = error.message || 'Erreur lors de la création du client';
    const fieldErrors: FormErrors = {};
    
    if (errorMessage.includes('SIRET')) {
      fieldErrors.siret = 'Un client avec ce SIRET existe déjà';
    } else if (errorMessage.includes('email')) {
      fieldErrors.email = 'Un utilisateur avec cet email existe déjà';
    } else if (errorMessage.includes('Comptable introuvable')) {
      fieldErrors.submit = 'Erreur de configuration: Comptable introuvable';
    } else if (errorMessage.includes('Violation de contrainte')) {
      fieldErrors.submit = 'Une donnée existe déjà dans le système';
    }
    
    return {
      success: false,
      error: errorMessage,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : { submit: errorMessage }
    };
  }
};

export const validateClientForm = (formData: CreateClientDto): FormErrors => {
  const errors: FormErrors = {};

  if (!formData.email.trim()) errors.email = 'Email requis';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Format d\'email invalide';
  }

  if (!formData.password) errors.password = 'Mot de passe requis';
  else if (formData.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }

  if (!formData.siret.trim()) errors.siret = 'SIRET requis';
  else if (!/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
    errors.siret = 'Le SIRET doit contenir 14 chiffres';
  }

  if (!formData.raisonSociale.trim()) {
    errors.raisonSociale = 'Raison sociale requise';
  }

  if (formData.codePostal && !/^\d{5}$/.test(formData.codePostal)) {
    errors.codePostal = 'Code postal invalide (5 chiffres requis)';
  }

  if (formData.telephone && !/^(?:\+33|0)[1-9](?:[0-9]{8})$/.test(formData.telephone.replace(/[\s\-\.]/g, ''))) {
    errors.telephone = 'Numéro de téléphone invalide';
  }

  return errors;
};

export const formatSiret = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4').trim();
};

export const updateClient = async (
  id: number,
  data: UpdateClientDto
): Promise<CreateClientResponse> => {
  return serverPut(`clients/${id}`, data);
};

export const deleteClient = async (id: number): Promise<{ message: string }> => {
  return serverDelete(`clients/${id}`);
};

export const getSpecificClient = async (id: string): Promise<ClientApiResponse> => {
  try {
    const data = await serverGet(`clients/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching client:", error);
    throw error;
  }
};