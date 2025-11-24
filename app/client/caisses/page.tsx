"use client"
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Shield, AlertCircle } from 'lucide-react';
import { getClientCaisses } from './actions/caisse-client-api';


// Types matching the server response
interface Caisse {
  id: number;
  nom: string;
  username: string;
  password: string | null;
  isActive: boolean;
  dateCreation: Date;
  dateModification: Date;
  clientId: number;
  comptableId: number;
}

interface ClientCaissesData {
  id: number;
  raisonSociale: string;
  siret: string;
  caisses: Caisse[];
  isFullyConfigured: boolean;
  configuredCount: number;
  activeCount: number;
}

const ClientCaissesInterface = () => {
  const [clientData, setClientData] = useState<ClientCaissesData | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client caisses data from backend
  useEffect(() => {
    const fetchCaisses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching client caisses...');
        const data = await getClientCaisses();
        console.log('Received data:', data);
        setClientData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement';
        setError(errorMessage);
        console.error('Error fetching client caisses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaisses();
  }, []);

  const togglePasswordVisibility = (caisseId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [caisseId]: !prev[caisseId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos identifiants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Identifiants CRP</h1>
              <p className="text-gray-600">Consulter vos identifiants de connexion aux organismes sociaux</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-1">{clientData.raisonSociale}</h2>
            <p className="text-sm text-gray-600">SIRET: {clientData.siret}</p>
          </div>
        </div>

        {/* Caisses Grid */}
        {clientData.caisses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientData.caisses.map(caisse => (
              <div key={caisse.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  {/* Caisse Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${caisse.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <h3 className="font-semibold text-lg text-gray-900">{caisse.nom}</h3>
                  </div>

                  {/* Information Fields */}
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Nom d'utilisateur
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm">
                        {caisse.username || <span className="text-gray-400">Non configuré</span>}
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock className="h-4 w-4 inline mr-1" />
                        Mot de passe
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm">
                          {caisse.password ? (
                            showPasswords[caisse.id] ? caisse.password : "••••••••••••"
                          ) : (
                            <span className="text-gray-400">Non configuré</span>
                          )}
                        </div>
                        {caisse.password && (
                          <button
                            onClick={() => togglePasswordVisibility(caisse.id)}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                          >
                            {showPasswords[caisse.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <div className="flex items-center">
                        <div className={`mr-2 h-4 w-4 rounded ${caisse.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {caisse.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Statut</span>
                      <span className={`px-2 py-1 rounded-full ${
                        caisse.username && caisse.password && caisse.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {caisse.username && caisse.password && caisse.isActive
                          ? 'Configuré'
                          : 'Configuration incomplète'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune caisse configurée</h3>
            <p className="text-gray-600">
              Aucune caisse n'a encore été configurée pour votre compte. 
              Contactez votre comptable pour configurer vos identifiants.
            </p>
          </div>
        )}

        {/* Summary Card */}
        {clientData.caisses.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de mes Caisses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {clientData.caisses.filter(c => c.username && c.password && c.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Configurées et actives</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {clientData.caisses.filter(c => !c.username || !c.password).length}
                </div>
                <div className="text-sm text-gray-600">À configurer</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {clientData.caisses.filter(c => !c.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Inactives</div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-blue-800 text-sm">
            Si vous avez des questions concernant vos identifiants ou si vous constatez des erreurs, 
            veuillez contacter votre comptable pour obtenir de l'aide.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientCaissesInterface;