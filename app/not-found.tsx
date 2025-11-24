// app/not-found.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, Role } from '@/app/auth/get-user'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    redirectToDefaultPage()
  }, [])

  const redirectToDefaultPage = async () => {
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        // Pas d'utilisateur connecté, rediriger vers login
        setTimeout(() => router.push('/auth/login'), 0)
        return
      }

      // Obtenir le chemin de redirection
      const defaultPath = getDefaultDashboard(user.role)

      // Démarrer le compte à rebours
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push(defaultPath)
      }, 3000)

      return () => clearInterval(timer)
    } catch (error) {
      console.error('Error redirecting:', error)
      setTimeout(() => router.push('/auth/login'), 0)
    }
  }

  const getDefaultDashboard = (role: Role): string => {
    switch (role) {
      case Role.CLIENT:
        return '/client/dashboard'
      case Role.COMPTABLE:
        return '/comptable/dashboard'
      case Role.ADMIN:
        return '/admin/dashboard'
      default:
        return '/auth/login'
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Page non trouvée
        </h2>
        <p className="text-gray-600 mb-6">
          Désolé, la page que vous recherchez n'existe pas.
        </p>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <p className="text-indigo-700 font-medium">
            Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
          </p>
        </div>

        <button
          onClick={() => {
            const user = getCurrentUser().then(userData => {
              if (userData) {
                const defaultPath = getDefaultDashboard(userData.role)
                router.push(defaultPath)
              } else {
                router.push('/auth/login')
              }
            })
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
        >
          Retourner au tableau de bord maintenant
        </button>
      </div>
    </div>
  )
}