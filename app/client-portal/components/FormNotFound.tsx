import React from 'react';
import { AlertTriangle, Clock, Shield, ArrowLeft, Mail, Phone } from 'lucide-react';

// Page pour formulaire non trouvé
export function FormNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Formulaire Introuvable
        </h1>
        
        <p className="text-gray-600 mb-6">
          Le lien que vous avez utilisé est invalide ou a expiré. 
          Veuillez vérifier le lien ou contacter votre comptable.
        </p>
        
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Causes possibles :</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Lien expiré ou utilisé</li>
              <li>• Erreur de copie du lien</li>
              <li>• Formulaire désactivé</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.history.back()} 
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </button>
        </div>
      </div>
    </div>
  );
}