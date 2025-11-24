"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Search, X, Filter, Calendar, File, AlertCircle, User, CheckCircle } from 'lucide-react';
import { getClientDocuments, downloadDocument, Document } from './actions/documents-api';

type TypeDocument = 
  | 'FACTURE_VENTE' 
  | 'FACTURE_ACHAT' 
  | 'RELEVE_BANCAIRE' 
  | 'BULLETIN_PAIE' 
  | 'JUSTIFICATIF' 
  | 'CONTRAT' 
  | 'DECLARATION' 
  | 'AUTRE';

const ClientDocumentsInterface: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TypeDocument | 'ALL'>('ALL');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<number | null>(null);

  const documentTypes: Array<{value: TypeDocument | 'ALL'; label: string}> = [
    { value: 'ALL', label: 'Tous les documents' },
    { value: 'FACTURE_VENTE', label: 'Factures de vente' },
    { value: 'FACTURE_ACHAT', label: 'Factures d\'achat' },
    { value: 'RELEVE_BANCAIRE', label: 'Relevés bancaires' },
    { value: 'BULLETIN_PAIE', label: 'Bulletins de paie' },
    { value: 'JUSTIFICATIF', label: 'Justificatifs' },
    { value: 'CONTRAT', label: 'Contrats' },
    { value: 'DECLARATION', label: 'Déclarations' },
    { value: 'AUTRE', label: 'Autres' }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const result = await getClientDocuments();
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data) {
        setDocuments(result.data);
      }
    } catch (err) {
      setError('Erreur lors du chargement des documents');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.nomOriginal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.typeDocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.comptable?.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'ALL' || doc.typeDocument === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, selectedType]);

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      setDownloadingId(documentId);
      setError('');
      
      const result = await downloadDocument(documentId);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data) {
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setDownloadSuccess(documentId);
        setTimeout(() => setDownloadSuccess(null), 3000);
      }
    } catch (err) {
      setError('Erreur lors du téléchargement du document');
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getDocumentTypeLabel = (type: string): string => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType?.label || type;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Documents</h1>
                <p className="text-gray-600 mt-1">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} disponible{documents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as TypeDocument | 'ALL')}
                  className="flex-1 outline-none bg-transparent"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} trouvé{filteredDocuments.length !== 1 ? 's' : ''}
            </span>
            {(searchTerm || selectedType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('ALL');
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun document trouvé
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedType !== 'ALL'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Votre comptable n\'a pas encore uploadé de documents'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* File Icon */}
                    <div className="p-3 bg-blue-50 rounded-lg text-2xl">
                      {getFileIcon(doc.typeFichier)}
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {doc.nomOriginal}
                      </h3>
                      
                      <div className="flex flex-wrap gap-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getDocumentTypeLabel(doc.typeDocument)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {formatFileSize(doc.taille)}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Uploadé le {formatDate(doc.dateUpload)}</span>
                        </div>
                        {doc.comptable?.user && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Par {doc.comptable.user.nom}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="ml-4">
                    {downloadSuccess === doc.id ? (
                      <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Téléchargé</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(doc.id, doc.nomOriginal)}
                        disabled={downloadingId === doc.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {downloadingId === doc.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Téléchargement...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5" />
                            <span>Télécharger</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDocumentsInterface;