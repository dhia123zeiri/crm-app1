import React from 'react';
import { AlertTriangle, Clock, Shield, ArrowLeft, Mail, Phone } from 'lucide-react';
import { useSecureForm } from '../hooks/useSecureForm';

// Types for the component
interface FormNotFoundProps {}
interface FormExpiredProps {}

// SecurityBanner component
export function SecurityBanner() {
  const [isSecure, setIsSecure] = React.useState(false);

  React.useEffect(() => {
    // Vérifier que la connexion est sécurisée
    setIsSecure(window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  }, []);

  if (isSecure) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800 font-medium">Connexion Sécurisée</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-800 font-medium">
          Connexion non sécurisée détectée
        </span>
      </div>
    </div>
  );
}

// FormNotFound component
const FormNotFound: React.FC<FormNotFoundProps> = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Formulaire Non Trouvé
        </h1>
        
        <p className="text-gray-600 mb-6">
          Le formulaire demandé n'existe pas ou le lien est invalide.
          Veuillez contacter votre comptable pour obtenir un nouveau lien.
        </p>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-800">
            Ce lien peut avoir expiré ou avoir déjà été utilisé.
          </p>
        </div>
      </div>
    </div>
  );
};

// FormExpired component
const FormExpired: React.FC<FormExpiredProps> = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-6">
          <Clock className="h-8 w-8 text-orange-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Formulaire Expiré
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ce formulaire a expiré. Les liens de formulaire sont valables pour une durée limitée
          pour des raisons de sécurité.
        </p>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-800">
            Veuillez contacter votre comptable pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    </div>
  );
};

// Composant principal mis à jour avec les hooks de sécurité
export default function SecureClientFormWithHooks() {
  // Récupérer le token depuis l'URL
  const token = window.location.pathname.split('/').pop() || '';
  
  const { formData, loading, error, submitForm } = useSecureForm(token);
  const [responses, setResponses] = React.useState<Record<string, string | number | string[]>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string | null>>({});
  const [submitError, setSubmitError] = React.useState('');

  // Redirection si erreur de token
  React.useEffect(() => {
    if (error && error.includes('invalide')) {
      // En production, utilisez React Router pour rediriger
      console.log('Redirection vers page d\'erreur');
    }
  }, [error]);

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);
    setSubmitError('');
    
    try {
      await submitForm(responses);
      setSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (fieldLabel: string, value: string | number | string[]): void => {
    setResponses(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
    
    if (validationErrors[fieldLabel]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldLabel]: null
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement sécurisé du formulaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <FormNotFound />;
  }

  if (submitted || formData?.isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-6">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Formulaire Complété
          </h1>
          
          <p className="text-gray-600 mb-6">
            Votre formulaire a été soumis avec succès et de manière sécurisée. 
            Votre comptable a été notifié automatiquement.
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Prochaines étapes :</h3>
            <ul className="text-sm text-green-800 text-left space-y-1">
              <li>• Accusé de réception envoyé par email</li>
              <li>• Votre comptable traitera vos informations</li>
              <li>• Vous serez contacté si nécessaire</li>
            </ul>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Pour votre sécurité, ce lien ne peut plus être utilisé.</p>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier l'expiration
  const isExpired = formData && new Date() > new Date(formData.expirationDate);
  if (isExpired) {
    return <FormExpired />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <SecurityBanner />
        
        {/* Header avec informations de sécurité */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{formData?.dynamicForm?.title}</h1>
                <p className="text-gray-600">Client: {formData?.client?.raisonSociale}</p>
              </div>
            </div>
            
            <div className="text-right text-sm text-gray-500">
              <p>Accès sécurisé</p>
              <p>Token valide</p>
            </div>
          </div>
          
          {formData?.dynamicForm?.description && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-blue-900">{formData.dynamicForm.description}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm border-t pt-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Lien Sécurisé et Temporaire</span>
            </div>
            <div className="text-gray-600">
              Expire: {formData && new Date(formData.expirationDate).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {formData?.dynamicForm?.fields?.map((field, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                  <div className="relative">
                    {field.type === 'email' && <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />}
                    <input
                      type={field.type}
                      value={responses[field.label] as string || ''}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                        field.type === 'email' ? 'pl-10' : ''
                      } ${validationErrors[field.label] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={responses[field.label] as string || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-vertical ${
                      validationErrors[field.label] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={responses[field.label] as string || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      validationErrors[field.label] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez une option...</option>
                    {field.options?.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                ) : null}
                
                {validationErrors[field.label] && (
                  <p className="text-red-500 text-sm">{validationErrors[field.label]}</p>
                )}
              </div>
            ))}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700">{submitError}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Envoi sécurisé en cours...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Soumettre de Manière Sécurisée</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer avec informations de contact */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
            <p className="text-gray-700 mb-1">{formData?.comptable?.user?.nom}</p>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span>{formData?.comptable?.user?.email}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>
                  Formulaire sécurisé - Vos données sont cryptées et protégées
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ne partagez pas ce lien. Il est personnel et temporaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}