"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, User, Search, X, Check, AlertCircle, Building, MapPin, Phone, Mail, Users } from 'lucide-react';
import { getClients, uploadDocuments } from './actions/upload-document';
import { Role } from '@/app/auth/get-user';
import { withRoleGuard } from '@/app/common/components/RolePageGuard';


// Types TypeScript
interface Client {
  id: number;
  userId: number;
  siret: string;
  raisonSociale: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  typeActivite?: string;
  regimeFiscal?: string;
  derniereConnexion?: Date;
  comptableId: number;
  user?: {
    email: string;
    nom: string;
  };
}

interface FileData {
  file: File;
  id: number;
  name: string;
  size: number;
  type: string;
  documentType: TypeDocument;
  preview?: string;
}

type TypeDocument = 
  | 'FACTURE_VENTE' 
  | 'FACTURE_ACHAT' 
  | 'RELEVE_BANCAIRE' 
  | 'BULLETIN_PAIE' 
  | 'JUSTIFICATIF' 
  | 'CONTRAT' 
  | 'DECLARATION' 
  | 'AUTRE';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const DocumentUploadInterface: React.FC = () => {
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Récupération des clients depuis l'API avec Server Action
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const result = await getClients();
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        if (result.data) {
          setClients(result.data);
        }
      } catch (err) {
        setError('Erreur lors du chargement des clients');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const documentTypes: Array<{value: TypeDocument; label: string}> = [
    { value: 'FACTURE_VENTE', label: 'Facture de vente' },
    { value: 'FACTURE_ACHAT', label: 'Facture d\'achat' },
    { value: 'RELEVE_BANCAIRE', label: 'Relevé bancaire' },
    { value: 'BULLETIN_PAIE', label: 'Bulletin de paie' },
    { value: 'JUSTIFICATIF', label: 'Justificatif' },
    { value: 'CONTRAT', label: 'Contrat' },
    { value: 'DECLARATION', label: 'Déclaration' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  // Filtrage intelligent des clients avec useMemo
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.raisonSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.siret.includes(searchTerm) ||
      client.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.typeActivite?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  // Calcul des clients affichés avec useMemo
  const displayedClients = useMemo(() => {
    if (searchTerm.trim() === '') {
      return clients.slice(0, 3);
    } else {
      return filteredClients;
    }
  }, [searchTerm, clients, filteredClients]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (!event.target.files) return;
    
    const files = Array.from(event.target.files);
    const newFiles: FileData[] = files.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      documentType: 'AUTRE' as TypeDocument,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (fileId: number): void => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  const updateFileDocumentType = (fileId: number, documentType: TypeDocument): void => {
    setUploadedFiles(uploadedFiles.map(f => 
      f.id === fileId ? { ...f, documentType } : f
    ));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const isClientSelected = (client: Client): boolean => {
    return selectedClients.some(c => c.id === client.id);
  };

  const handleClientToggle = (client: Client): void => {
    if (isClientSelected(client)) {
      setSelectedClients(selectedClients.filter(c => c.id !== client.id));
    } else {
      setSelectedClients([...selectedClients, client]);
    }
  };

  const removeSelectedClient = (clientId: number): void => {
    setSelectedClients(selectedClients.filter(c => c.id !== clientId));
  };

  const clearAllSelectedClients = (): void => {
    setSelectedClients([]);
  };

  const handleUpload = async (): Promise<void> => {
    if (selectedClients.length === 0 || uploadedFiles.length === 0) {
      setUploadStatus('error');
      setError('Veuillez sélectionner au moins un client et un fichier');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setError('');

    try {
      // Préparer les données pour l'upload
      const clientIds = selectedClients.map(client => client.id);
      const documentTypesData = uploadedFiles.map(file => file.documentType);
      const files = uploadedFiles.map(fileData => fileData.file);

      // Appeler la Server Action
      const result = await uploadDocuments(files, clientIds, documentTypesData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setUploadStatus('success');
      setTimeout(() => {
        setUploadedFiles([]);
        setUploadStatus('idle');
      }, 3000);
      
    } catch (err) {
      setUploadStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload de Documents</h1>
              <p className="text-gray-600 mt-1">Sélectionnez un ou plusieurs clients et uploadez leurs documents</p>
            </div>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Section Clients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="h-6 w-6 mr-3 text-blue-600" />
                Clients ({selectedClients.length} sélectionné{selectedClients.length !== 1 ? 's' : ''})
              </h2>

              {/* Clients sélectionnés */}
              {selectedClients.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Clients sélectionnés:</h3>
                    <button
                      onClick={clearAllSelectedClients}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedClients.map(client => (
                      <div key={client.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900 truncate">{client.raisonSociale}</p>
                          <p className="text-xs text-blue-600">{client.ville}</p>
                        </div>
                        <button
                          onClick={() => removeSelectedClient(client.id)}
                          className="ml-2 p-1 hover:bg-blue-100 rounded"
                        >
                          <X className="h-4 w-4 text-blue-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barre de recherche */}
              <div className="relative mb-6">
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
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

              {/* Liste des clients */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {displayedClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientToggle(client)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isClientSelected(client)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                            {client.raisonSociale}
                          </h3>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">SIRET:</span>
                            <span>{client.siret}</span>
                          </div>
                          
                          {client.ville && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{client.ville} ({client.codePostal})</span>
                            </div>
                          )}
                          
                          {client.telephone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{client.telephone}</span>
                            </div>
                          )}
                          
                          {client.user?.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.user.email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {client.typeActivite}
                          </span>
                          {client.derniereConnexion && (
                            <span className="text-xs text-gray-500">
                              {formatDate(client.derniereConnexion)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isClientSelected(client) && (
                        <Check className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
                
                {displayedClients.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun client trouvé</p>
                    <p className="text-sm">Essayez avec d'autres mots-clés</p>
                  </div>
                )}
              </div>
              
              {!searchTerm && clients.length > 3 && (
                <div className="mt-4">
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-500">
                      {clients.length - 3} autres clients disponibles
                    </p>
                    <p className="text-xs text-gray-400">Utilisez la recherche pour les voir</p>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setSelectedClients([...clients])}
                      disabled={selectedClients.length === clients.length}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedClients.length === clients.length
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      Sélectionner tous les clients ({clients.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Upload */}
          <div className="lg:col-span-2 space-y-8">
            {/* Clients sélectionnés - Vue détaillée */}
            {selectedClients.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Clients sélectionnés ({selectedClients.length})
                  </h3>
                  <button
                    onClick={clearAllSelectedClients}
                    className="text-sm text-red-600 hover:text-red-800 px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClients.map(client => (
                    <div key={client.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-green-800">{client.raisonSociale}</div>
                          <div className="text-sm text-green-600">
                            {client.adresse}, {client.ville} • {client.regimeFiscal}
                          </div>
                        </div>
                        <button
                          onClick={() => removeSelectedClient(client.id)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors duration-150"
                        >
                          <X className="h-5 w-5 text-green-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone d'upload */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-blue-600" />
                Upload des Documents
              </h2>

              {/* Drop zone */}
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
                selectedClients.length > 0 ? 'border-gray-300 hover:border-blue-400' : 'border-gray-200 bg-gray-50'
              }`}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  disabled={selectedClients.length === 0}
                />
                <label htmlFor="file-upload" className={selectedClients.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}>
                  <div className={`p-4 rounded-full inline-block mb-4 ${
                    selectedClients.length > 0 ? 'bg-blue-50' : 'bg-gray-100'
                  }`}>
                    <Upload className={`h-12 w-12 ${selectedClients.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className={`text-xl font-semibold mb-2 ${
                    selectedClients.length > 0 ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {selectedClients.length > 0 ? 'Cliquez pour sélectionner des fichiers' : 'Sélectionnez d\'abord un ou plusieurs clients'}
                  </div>
                  {selectedClients.length > 0 && (
                    <>
                      <div className="text-gray-500">
                        ou glissez-déposez vos documents ici
                      </div>
                      <div className="text-sm text-gray-400 mt-2">
                        PDF, Images, Word, Excel acceptés (max 10MB par fichier)
                      </div>
                      <div className="text-sm text-blue-600 mt-2 font-medium">
                        Les documents seront envoyés à {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* Liste des fichiers uploadés */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Fichiers sélectionnés ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-4">
                    {uploadedFiles.map((fileData) => (
                      <div key={fileData.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{fileData.name}</div>
                            <div className="text-sm text-gray-600">{formatFileSize(fileData.size)}</div>
                          </div>
                          <select
                            value={fileData.documentType}
                            onChange={(e) => updateFileDocumentType(fileData.id, e.target.value as TypeDocument)}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {documentTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeFile(fileData.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton d'upload et status */}
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {uploadStatus === 'success' && (
                    <div className="flex items-center text-green-600">
                      <Check className="h-6 w-6 mr-2" />
                      <span className="font-semibold">Documents uploadés avec succès!</span>
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-6 w-6 mr-2" />
                      <span className="font-semibold">Erreur lors de l'upload</span>
                    </div>
                  )}
                  {uploadStatus === 'uploading' && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      <span className="font-semibold">Upload en cours...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={selectedClients.length === 0 || uploadedFiles.length === 0 || isUploading}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    selectedClients.length === 0 || uploadedFiles.length === 0 || isUploading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 transform hover:scale-105 shadow-lg'
                  }`}
                >
                  {isUploading 
                    ? `Upload en cours pour ${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}...` 
                    : `Uploader ${uploadedFiles.length} document(s) pour ${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRoleGuard(DocumentUploadInterface,[Role.COMPTABLE]);