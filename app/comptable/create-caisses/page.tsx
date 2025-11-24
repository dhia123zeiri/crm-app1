"use client"
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, User, Lock, Shield, Search, AlertCircle, Edit3, Building2 } from 'lucide-react';
import { getCaissesByClient, getClients, saveClientCaisses } from './actions/caisses-api';

// Types matching backend DTOs
interface CaisseFormData {
  id?: number;
  nom: string;
  username: string;
  password: string;
  isActive: boolean;
}

interface ClientCaissesResponse {
  id: number;
  raisonSociale: string;
  siret: string;
  caisses: any[];
  isFullyConfigured: boolean;
}

// Fixed 6 caisse types - must all be filled
const FIXED_CAISSE_TYPES = [
  'CNAV',
  'URSSAF', 
  'AGIRC-ARRCO',
  'Pôle Emploi',
  'CPAM',
  'MSA'
];

const ComptableCaissesInterface = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: CaisseFormData }>({});
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [isModifying, setIsModifying] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientCaissesResponse | null>(null);
  const [caisseKeys, setCaisseKeys] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // Initialize form data - always use the 6 fixed caisses
  const initializeFormData = (clientCaisses?: ClientCaissesResponse) => {
    const newFormData: { [key: string]: CaisseFormData } = {};
    const keys: string[] = [];
    
    // Always create exactly 6 caisses based on FIXED_CAISSE_TYPES
    FIXED_CAISSE_TYPES.forEach((caisseType, index) => {
      const key = `caisse_${index}`;
      keys.push(key);
      
      // Find existing caisse data if available
      const existingCaisse = clientCaisses?.caisses?.find(c => c.nom === caisseType);
      
      newFormData[key] = {
        id: existingCaisse?.id,
        nom: caisseType,
        username: existingCaisse?.username || '',
        password: '', // Always empty for security
        isActive: existingCaisse?.isActive || false
      };
    });
    
    setCaisseKeys(keys);
    setFormData(newFormData);
    setErrors({});
    setShowErrors(false);
    setIsModifying(false);
  };

  // Load all clients
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const clientsData = await getClients();
      const safeClientsData = Array.isArray(clientsData) ? clientsData : [];
      
      setClients(safeClientsData);
      setFilteredClients(safeClientsData);
      
      if (safeClientsData.length > 0 && !selectedClientId) {
        setSelectedClientId(safeClientsData[0].id);
        await loadClientCaisses(safeClientsData[0].id);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Erreur lors du chargement des clients');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Load caisses for a specific client
  const loadClientCaisses = async (clientId: number) => {
    try {
      const clientCaisses = await getCaissesByClient(clientId);
      setSelectedClient(clientCaisses);
      initializeFormData(clientCaisses);
    } catch (error) {
      console.error('Error loading client caisses:', error);
      alert('Erreur lors du chargement des caisses du client');
      setSelectedClient(null);
      initializeFormData(); // Initialize with default caisses
    }
  };

  // Filter clients based on search term
  useEffect(() => {
    if (!Array.isArray(clients)) {
      setFilteredClients([]);
      return;
    }

    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.raisonSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.siret.includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const handleClientChange = async (clientId: number) => {
    setSelectedClientId(clientId);
    await loadClientCaisses(clientId);
  };

  const togglePasswordVisibility = (caisseKey: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [caisseKey]: !prev[caisseKey]
    }));
  };

  const updateFormData = (caisseKey: string, field: keyof CaisseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [caisseKey]: {
        ...prev[caisseKey],
        [field]: value
      }
    }));
    
    // Clear errors for this field when user starts typing
    if (showErrors && errors[caisseKey]) {
      setErrors(prev => ({
        ...prev,
        [caisseKey]: []
      }));
    }
  };

  const generatePassword = (caisseKey: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateFormData(caisseKey, 'password', password);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string[] } = {};
    let isValid = true;

    // Validate all 6 caisses - all must be completed
    caisseKeys.forEach(caisseKey => {
      const data = formData[caisseKey];
      if (data) {
        const caisseErrors: string[] = [];
        
        // All caisses must have a name
        if (!data.nom.trim()) {
          caisseErrors.push('Le nom de la caisse est requis');
          isValid = false;
        } else if (data.nom.length < 2) {
          caisseErrors.push('Le nom de la caisse doit contenir au moins 2 caractères');
          isValid = false;
        }
        
        // All caisses must have username and password
        if (!data.username.trim()) {
          caisseErrors.push('Le nom d\'utilisateur est requis');
          isValid = false;
        } else if (data.username.length < 3) {
          caisseErrors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
          isValid = false;
        }
        
        if (!data.password.trim()) {
          caisseErrors.push('Le mot de passe est requis');
          isValid = false;
        } else if (data.password.length < 6) {
          caisseErrors.push('Le mot de passe doit contenir au moins 6 caractères');
          isValid = false;
        }
        
        if (caisseErrors.length > 0) {
          newErrors[caisseKey] = caisseErrors;
        }
      }
    });

    // Check for duplicate caisse names
    const caisseNames = caisseKeys
      .map(key => formData[key]?.nom?.trim().toLowerCase())
      .filter(nom => nom);
    
    const duplicates = caisseNames.filter((nom, index) => caisseNames.indexOf(nom) !== index);
    
    if (duplicates.length > 0) {
      caisseKeys.forEach(caisseKey => {
        const data = formData[caisseKey];
        if (data && duplicates.includes(data.nom?.trim().toLowerCase())) {
          if (!newErrors[caisseKey]) {
            newErrors[caisseKey] = [];
          }
          if (!newErrors[caisseKey].includes('Le nom de la caisse doit être unique')) {
            newErrors[caisseKey].push('Le nom de la caisse doit être unique');
            isValid = false;
          }
        }
      });
    }

    setErrors(newErrors);
    setShowErrors(!isValid);
    return isValid;
  };

  const saveAllCaisses = async () => {
    if (!selectedClient) return;

    // Validate form and show errors
    if (!validateForm()) {
      alert('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    setSaving(true);
    try {
      // Save all 6 caisses with their data
      const caissesToSave = caisseKeys
        .map(key => formData[key])
        .filter(data => data && data.nom.trim())
        .map(data => ({
          id: data.id,
          nom: data.nom,
          username: data.username,
          password: data.password,
          isActive: data.isActive,
          clientId: selectedClient.id
        }));

      console.log(caissesToSave);

      await saveClientCaisses(selectedClient.id, caissesToSave);
      
      alert('Caisses sauvegardées avec succès !');
      await loadClientCaisses(selectedClient.id);
      setIsModifying(false);
      
    } catch (error) {
      console.error('Error saving caisses:', error);
      alert('Erreur lors de la sauvegarde des caisses');
    } finally {
      setSaving(false);
    }
  };

  const handleModify = () => {
    setIsModifying(true);
    setShowErrors(false);
    setErrors({});
  };

  const getFieldErrors = (caisseKey: string): string[] => {
    return showErrors ? (errors[caisseKey] || []) : [];
  };

  const hasErrors = showErrors && Object.keys(errors).length > 0;
  const totalErrors = showErrors ? Object.values(errors).reduce((sum, errorArray) => sum + errorArray.length, 0) : 0;
  const canModify = selectedClient?.isFullyConfigured && !isModifying;
  const safeFilteredClients = Array.isArray(filteredClients) ? filteredClients : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Caisses CRP - Comptable</h1>
              <p className="text-gray-600">Configurer les identifiants de connexion aux organismes sociaux</p>
            </div>
          </div>

          {/* Client Search and Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Rechercher un client :</label>
              <div className="flex-1 max-w-md relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom d'entreprise ou SIRET..."
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Client sélectionné :</label>
              <select 
                value={selectedClientId || ''}
                onChange={(e) => handleClientChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-96"
                disabled={loading}
              >
                <option value="">Sélectionner un client...</option>
                {safeFilteredClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.raisonSociale} - {client.siret}
                    {client.isFullyConfigured && ' ✓ Configuré'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Summary - Only show when there are errors and user tried to save */}
          {hasErrors && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {totalErrors} erreur{totalErrors > 1 ? 's' : ''} à corriger
                </span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Veuillez remplir tous les champs obligatoires et corriger les erreurs.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedClient && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3 flex-wrap">
              {canModify ? (
                <button
                  onClick={handleModify}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier les caisses
                </button>
              ) : (
                <button
                  onClick={saveAllCaisses}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Sauvegarde en cours...' : 'Enregistrer les caisses'}
                </button>
              )}
              
              {hasErrors && (
                <p className="text-sm text-red-600 self-center">
                  Corrigez les erreurs pour pouvoir sauvegarder
                </p>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Chargement des clients...</div>
          </div>
        )}

        {/* No Clients State */}
        {!loading && safeFilteredClients.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Aucun client trouvé</div>
          </div>
        )}

        {/* Caisses Grid */}
        {selectedClient && !loading && (
          <>
            <div className="mb-6 p-4 rounded-lg border bg-white">
              <h3 className="font-medium text-gray-900 mb-2">
                Configuration des caisses pour : {selectedClient.raisonSociale}
              </h3>
              <p className="text-sm text-gray-600">
                {canModify 
                  ? 'Caisses configurées. Cliquez sur "Modifier les caisses" pour apporter des modifications.'
                  : 'Configurez les 6 caisses obligatoires avec leurs identifiants. Tous les champs doivent être remplis.'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caisseKeys.map((caisseKey, index) => {
                const currentFormData = formData[caisseKey];
                const fieldErrors = getFieldErrors(caisseKey);
                const hasFieldErrors = fieldErrors.length > 0;
                const isDisabled = canModify && !isModifying;

                return (
                  <div key={caisseKey} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${hasFieldErrors ? 'border-red-300' : ''} ${isDisabled ? 'opacity-75' : ''}`}>
                    <div className="p-6">
                      {/* Caisse Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-3 h-3 rounded-full ${currentFormData?.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <h3 className="font-semibold text-lg text-gray-900">
                            {currentFormData?.nom || `Caisse ${index + 1}`}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {hasFieldErrors && <AlertCircle className="h-5 w-5 text-red-500" />}
                        </div>
                      </div>

                      {/* Field Errors - Only show when user tried to save */}
                      {hasFieldErrors && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <ul className="text-sm text-red-600 space-y-1">
                            {fieldErrors.map((error, errorIndex) => (
                              <li key={errorIndex}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="space-y-4">
                        {/* Caisse Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            Nom de la caisse *
                          </label>
                          <input
                            type="text"
                            value={currentFormData?.nom || ''}
                            onChange={(e) => updateFormData(caisseKey, 'nom', e.target.value)}
                            disabled={isDisabled}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                              hasFieldErrors && fieldErrors.some(e => e.includes('nom') || e.includes('caisse')) 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            placeholder="Ex: CNAV, URSSAF, CPAM..."
                          />
                        </div>

                        {/* Status Checkbox */}
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={currentFormData?.isActive || false}
                              onChange={(e) => updateFormData(caisseKey, 'isActive', e.target.checked)}
                              disabled={isDisabled}
                              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Utiliser cette caisse
                            </span>
                          </label>
                        </div>

                        {/* Username */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <User className="h-4 w-4 inline mr-1" />
                            Nom d'utilisateur *
                          </label>
                          <input
                            type="text"
                            value={currentFormData?.username || ''}
                            onChange={(e) => updateFormData(caisseKey, 'username', e.target.value)}
                            disabled={isDisabled}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                              hasFieldErrors && fieldErrors.some(e => e.includes('utilisateur')) 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            placeholder="Saisir le nom d'utilisateur"
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Lock className="h-4 w-4 inline mr-1" />
                            Mot de passe *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type={showPasswords[caisseKey] ? "text" : "password"}
                              value={currentFormData?.password || ''}
                              onChange={(e) => updateFormData(caisseKey, 'password', e.target.value)}
                              disabled={isDisabled}
                              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                                hasFieldErrors && fieldErrors.some(e => e.includes('mot de passe'))
                                  ? 'border-red-300 bg-red-50' 
                                  : 'border-gray-300'
                              }`}
                              placeholder="Saisir le mot de passe"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(caisseKey)}
                              disabled={isDisabled}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {showPasswords[caisseKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => generatePassword(caisseKey)}
                              disabled={isDisabled}
                              className="px-3 py-2 text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-300"
                            >
                              Générer
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Connection Status */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Statut</span>
                          <span className={`px-2 py-1 rounded-full ${
                            !currentFormData?.nom?.trim()
                              ? 'bg-gray-100 text-gray-600'
                              : isDisabled && currentFormData?.isActive
                              ? 'bg-green-100 text-green-800'
                              : !currentFormData?.isActive
                              ? 'bg-yellow-100 text-yellow-800'
                              : currentFormData?.username && currentFormData?.password && (!showErrors || !hasFieldErrors)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {!currentFormData?.nom?.trim()
                              ? 'À nommer'
                              : !currentFormData?.isActive 
                              ? 'Non utilisée'
                              : isDisabled 
                              ? 'Configurée'
                              : currentFormData?.username && currentFormData?.password && (!showErrors || !hasFieldErrors)
                              ? 'Prête à sauvegarder'
                              : 'À compléter'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Instructions */}
        {selectedClient && !loading && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Toutes les 6 caisses doivent être remplies avec leurs informations complètes</li>
              <li>• Personnalisez le nom de chaque caisse selon vos besoins (CNAV, URSSAF, CPAM, etc.)</li>
              <li>• Cochez "Utiliser cette caisse" pour activer l'organisme social</li>
              <li>• Tous les champs sont obligatoires et doivent être remplis</li>
              <li>• Le nom de la caisse doit contenir au moins 2 caractères et être unique</li>
              <li>• Le nom d'utilisateur doit contenir au moins 3 caractères</li>
              <li>• Le mot de passe doit contenir au moins 6 caractères</li>
              <li>• Utilisez le bouton "Générer" pour créer un mot de passe sécurisé</li>
              <li>• Après sauvegarde, utilisez "Modifier les caisses" pour apporter des modifications</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComptableCaissesInterface;