"use client"
import { useState, useEffect } from 'react';
import {
  Mail,
  MailOpen,
  Eye,
  Trash2,
  Search,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import {
  getFormResponses,
  getFormResponseStats,
  getFormResponseById,
  toggleResponseReadStatus,
  deleteFormResponse,
  type FormResponse,
  type Stats,
  type Pagination,
} from './actions/form-responses.actions';

interface Filters {
  isRead: string;
  status: string;
  search: string;
}

export default function FormResponsesPage() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [filters, setFilters] = useState<Filters>({
    isRead: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    unreadCount: 0
  });

  useEffect(() => {
    loadStats();
    loadResponses();
  }, [filters, pagination.page]);

  const loadStats = async (): Promise<void> => {
    try {
      const data = await getFormResponseStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadResponses = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const data = await getFormResponses({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.isRead && { isRead: filters.isRead === 'true' }),
        ...(filters.status && { status: filters.status })
      });
      
      setResponses(data.responses);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = async (response: FormResponse): Promise<void> => {
    setSelectedResponse(response);
    
    if (!response.isRead) {
      try {
        await toggleResponseReadStatus(response.id, false);
        
        setResponses(prev =>
          prev.map(r =>
            r.id === response.id ? { ...r, isRead: true, dateRead: new Date().toISOString() } : r
          )
        );
        loadStats();
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleToggleRead = async (responseId: number, currentStatus: boolean): Promise<void> => {
    try {
      await toggleResponseReadStatus(responseId, currentStatus);
      loadResponses();
      loadStats();
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const handleDelete = async (responseId: number): Promise<void> => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) return;
    
    try {
      await deleteFormResponse(responseId);
      loadResponses();
      loadStats();
      setSelectedResponse(null);
    } catch (error) {
      console.error('Error deleting response:', error);
    }
  };

  const filteredResponses = responses.filter(response => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        response.client.raisonSociale.toLowerCase().includes(searchLower) ||
        response.dynamicForm.title.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (selectedResponse) {
    return (
      <ResponseDetailView
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
        onDelete={handleDelete}
        onToggleRead={handleToggleRead}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Réponses des Formulaires</h1>
          <p className="text-gray-600">Gérez les réponses de vos clients</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Non lues</p>
                  <p className="text-2xl font-bold text-red-500">{stats.unreadCount}</p>
                </div>
                <Mail className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lues</p>
                  <p className="text-2xl font-bold text-green-500">{stats.readCount}</p>
                </div>
                <MailOpen className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-purple-500">{stats.completedToday}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filters.isRead}
              onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="false">Non lues</option>
              <option value="true">Lues</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="COMPLETED">Complété</option>
              <option value="PENDING">En attente</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement...</p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Aucune réponse trouvée</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredResponses.map((response) => (
                <div
                  key={response.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !response.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleViewResponse(response)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        response.isRead ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        {response.isRead ? (
                          <MailOpen className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Mail className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-semibold ${
                            response.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {response.client.raisonSociale}
                          </h3>
                          {!response.isRead && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              Nouveau
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {response.dynamicForm.title}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {response.dateCompletion && new Date(response.dateCompletion).toLocaleDateString('fr-FR')}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {response.dateCompletion && new Date(response.dateCompletion).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </span>
                          {response.status === 'COMPLETED' && (
                            <span className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>Complété</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRead(response.id, response.isRead);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title={response.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      >
                        {response.isRead ? (
                          <Mail className="h-4 w-4 text-gray-600" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewResponse(response);
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {pagination.pages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.pages} ({pagination.total} réponses)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResponseDetailViewProps {
  response: FormResponse;
  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
  onToggleRead: (id: number, isRead: boolean) => Promise<void>;
}

function ResponseDetailView({ response, onClose, onDelete, onToggleRead }: ResponseDetailViewProps) {
  const [detailedResponse, setDetailedResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDetailedResponse();
  }, [response.id]);

  const loadDetailedResponse = async (): Promise<void> => {
    try {
      const data = await getFormResponseById(response.id);
      setDetailedResponse(data);
    } catch (error) {
      console.error('Error loading detailed response:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !detailedResponse) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fields = detailedResponse.dynamicForm.fields;
  const responses = detailedResponse.responses;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Retour
                </button>
                {!detailedResponse.isRead && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    Non lu
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {detailedResponse.dynamicForm.title}
              </h1>
              <p className="text-gray-600">
                Réponse de {detailedResponse.client.raisonSociale}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onToggleRead(detailedResponse.id, detailedResponse.isRead)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                {detailedResponse.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                <span>{detailedResponse.isRead ? 'Non lu' : 'Lu'}</span>
              </button>
              <button
                onClick={() => onDelete(detailedResponse.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-semibold">{detailedResponse.client.raisonSociale}</p>
              <p className="text-sm text-gray-500">{detailedResponse.client.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de soumission</p>
              <p className="font-semibold">
                {detailedResponse.dateCompletion && new Date(detailedResponse.dateCompletion).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Réponses</h2>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={index} className="border-b pb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="text-gray-900">
                  {Array.isArray(responses[field.label]) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {responses[field.label].map((item: any, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : field.type === 'file' && responses._uploadedFiles?.[field.label] ? (
                    <div className="space-y-2">
                      {responses._uploadedFiles[field.label].map((file: any, i: number) => (
                        <div key={i} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.originalName}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : responses[field.label] ? (
                    <p className="whitespace-pre-wrap">{responses[field.label]}</p>
                  ) : (
                    <p className="text-gray-400 italic">Aucune réponse</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}