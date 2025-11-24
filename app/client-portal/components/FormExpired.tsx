// Page pour formulaire expiré
import React from 'react';
import { AlertTriangle, Clock, Shield, ArrowLeft, Mail, Phone } from 'lucide-react';

export function FormExpired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-6">
          <Clock className="h-8 w-8 text-orange-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Formulaire Expiré
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ce formulaire a expiré et ne peut plus être rempli. 
          Contactez votre comptable pour obtenir un nouveau lien.
        </p>
        
        <div className="bg-orange-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-orange-800">
            Les formulaires expirent automatiquement pour votre sécurité. 
            Votre comptable peut générer un nouveau lien si nécessaire.
          </p>
        </div>
        
        <button 
          onClick={() => window.history.back()} 
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>
      </div>
    </div>
  );
}