// components/RolePageGuard.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, Role, TokenPayload } from '@/app/auth/get-user'


interface RolePageGuardProps {
  children: React.ReactNode
  allowedRoles: Role[]
  redirectTo?: string
}

export function RolePageGuard({ children, allowedRoles, redirectTo }: RolePageGuardProps) {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const userData = await getCurrentUser()
      
      if (!userData) {
        router.push('/auth/login')
        return
      }

      setUser(userData)

      if (allowedRoles.includes(userData.role)) {
        setHasAccess(true)
      } else {
        // Redirect based on user's actual role
        const redirectPath = redirectTo || getDefaultDashboard(userData.role)
        router.push(redirectPath)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Redirecting...</h2>
          <p className="mt-2">You're being redirected to your dashboard.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// HOC version for easier use
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role[],
  redirectTo?: string
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RolePageGuard allowedRoles={allowedRoles} redirectTo={redirectTo}>
        <Component {...props} />
      </RolePageGuard>
    )
  }
}