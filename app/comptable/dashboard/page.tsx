// app/comptable/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Mail, 
  TrendingUp, 
  Plus,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  FileText,
  Repeat,
  Wallet,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RolePageGuard } from '@/app/common/components/RolePageGuard';
import { Role } from '@/app/auth/get-user';
import { 
  getDashboardStats, 
  getClients, 
  getTemplates,
  type DashboardStats, 
  type Client as ApiClient,
  type Template 
} from './actions/dashboard-api';

interface ClientDisplay {
  id: number;
  name: string;
  siret: string;
  status: 'active' | 'pending' | 'overdue';
  lastContact: string;
  email?: string;
}

export default function ComptableDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch stats, clients, and templates in parallel
        const [statsData, clientsData, templatesData] = await Promise.all([
          getDashboardStats(),
          getClients(),
          getTemplates()
        ]);
        
        setStats(statsData);
        
        // Transform API clients to display format
        const displayClients: ClientDisplay[] = clientsData.slice(0, 3).map(client => ({
          id: client.id,
          name: client.raisonSociale,
          siret: client.siret,
          status: client.user?.actif ? 'active' : 'pending',
          lastContact: client.derniereConnexion 
            ? new Date(client.derniereConnexion).toLocaleDateString('fr-FR')
            : 'Jamais',
          email: client.user?.email
        }));
        
        setClients(displayClients);
        
        // Get the 5 most recent templates
        const recentTemplates = templatesData
          .sort((a, b) => new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime())
          .slice(0, 5);
        
        setTemplates(recentTemplates);
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getTemplateTypeBadge = (type: string) => {
    switch (type) {
      case 'REMINDER':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Rappel' };
      case 'INVOICE':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Facture' };
      case 'INFO':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Info' };
      case 'CUSTOM':
        return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Personnalisé' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: type };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <RolePageGuard allowedRoles={[Role.COMPTABLE]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Comptable</h1>
            <p className="text-gray-600 mt-2">Gestion automatisée des obligations comptables</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Clients */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  {loading ? (
                    <div className="flex items-center mt-2">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
                  )}
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Dossiers Complets */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dossiers Complets</p>
                  {loading ? (
                    <div className="flex items-center mt-2">
                      <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats?.dossiersComplets || 0}</p>
                  )}
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Calendar className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Formulaires Pendants */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Formulaires Pendants</p>
                  {loading ? (
                    <div className="flex items-center mt-2">
                      <Loader2 className="h-6 w-6 text-orange-600 animate-spin" />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats?.pendingForms || 0}</p>
                  )}
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Mail className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Taux de Completion */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de Completion</p>
                  {loading ? (
                    <div className="flex items-center mt-2">
                      <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats?.completionRate || 0}%</p>
                  )}
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/comptable/clients" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
                <Plus className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-900">Nouveau Client</span>
              </Link>
              
              <Link href="/comptable/emails/templates" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
                <Mail className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-900">Envoyer Email</span>
              </Link>
              
              <Link href="/comptable/reports" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
                <Download className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-purple-900">Rapports</span>
              </Link>
              
              <Link 
                href="/comptable/create-dossier"
                className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
              >
                <FolderOpen className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-indigo-900">Dossier</span>
              </Link>

              <Link 
                href="/comptable/form-response"
                className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors group"
              >
                <FileText className="h-8 w-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-amber-900">Formulaires</span>
              </Link>

              <Link 
                href="/comptable/create-caisses"
                className="flex flex-col items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors group"
              >
                <Wallet className="h-8 w-8 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-teal-900">Créer Caisse</span>
              </Link>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Clients */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Clients Récents</h2>
                  <Link href="/comptable/clients" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Voir tout
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun client trouvé
                    </div>
                  ) : (
                    clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {client.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                              <p className="text-xs text-gray-500">{client.siret}</p>
                              {client.email && (
                                <p className="text-xs text-gray-500">{client.email}</p>
                              )}
                              <p className="text-xs text-gray-500">Dernière connexion: {client.lastContact}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(client.status)}`}>
                            {client.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {client.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {client.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {client.status}
                          </span>
                          <Link 
                            href={`/comptable/clients/${client.id}`}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Templates */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Templates Récents</h2>
                  <Link href="/comptable/emails/templates" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Voir tout
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Aucun template trouvé</p>
                      <Link 
                        href="/comptable/emails/templates/new"
                        className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                      >
                        Créer votre premier template
                      </Link>
                    </div>
                  ) : (
                    templates.map((template) => {
                      const typeBadge = getTemplateTypeBadge(template.type);
                      return (
                        <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 ${typeBadge.bg} rounded-full flex items-center justify-center`}>
                                  <Mail className={`h-5 w-5 ${typeBadge.text}`} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{template.nom}</p>
                                <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                                    {typeBadge.label}
                                  </span>
                                  {template.isPeriodic && (
                                    <span className="inline-flex items-center text-xs text-gray-500">
                                      <Repeat className="w-3 h-3 mr-1" />
                                      Périodique
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    Utilisé {template.usageCount} fois
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  Modifié le {formatDate(template.dateModification)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!template.actif && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                Inactif
                              </span>
                            )}
                            <Link 
                              href={`/comptable/emails/templates/${template.id}`}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RolePageGuard>
  );
}