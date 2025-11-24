// app/common/util/roleConfig.ts
export interface RoleConfig {
  routePrefix: string;
  defaultDashboard: string;
  allowedRoutes?: string[];
  // ✅ NOUVEAU: Routes de base qui autorisent automatiquement les sous-routes
  allowedBasePaths?: string[];
}

export const ROLES = {
  COMPTABLE: 'comptable',
  CLIENT: 'client',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const roleConfigs: Record<UserRole, RoleConfig> = {
  [ROLES.COMPTABLE]: {
    routePrefix: '/comptable',
    defaultDashboard: '/comptable/dashboard',
    // ✅ SOLUTION OPTIMISÉE: Utilisez allowedBasePaths pour autoriser toutes les sous-routes
    allowedBasePaths: [
      '/comptable/dashboard',
      '/comptable/reports',
      '/comptable/clients',        // ✅ Autorise automatiquement /clients/create-client, /clients/[id], etc.
      '/comptable/emails',         // ✅ Autorise automatiquement /emails/templates, /emails/templates/create-template, etc.
      '/comptable/tasks',
      '/comptable/settings',
      '/comptable/client-portal',
    ]
  },
  [ROLES.CLIENT]: {
    routePrefix: '/client',
    defaultDashboard: '/client/dashboard',
    allowedBasePaths: [
      '/client/dashboard',
      '/client/profile',
      '/client/documents',
      '/client/appointments',
    ]
  },
  [ROLES.ADMIN]: {
    routePrefix: '/admin',
    defaultDashboard: '/admin/dashboard',
    allowedBasePaths: [
      '/admin/dashboard',
      '/admin/users',
      '/admin/settings',
      '/admin/reports',
    ]
  }
};

// Fixed utility functions
export function getRoleConfig(role: string): RoleConfig | null {
  const normalizedRole = role.toLowerCase() as UserRole;
  return roleConfigs[normalizedRole] || null;
}

export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role.toLowerCase() as UserRole);
}

// ✅ FONCTION PRINCIPALE OPTIMISÉE
export function canAccessRoute(userRole: string, requestedPath: string): boolean {
  const config = getRoleConfig(userRole);
  if (!config) return false;
  
  // Check if the requested path starts with the user's allowed route prefix
  if (!requestedPath.startsWith(config.routePrefix)) {
    return false;
  }

  // ✅ LOGIQUE SIMPLIFIÉE: Utilise allowedBasePaths (plus flexible)
  if (config.allowedBasePaths && config.allowedBasePaths.length > 0) {
    return config.allowedBasePaths.some(basePath => {
      // Permet l'accès exact ou aux sous-routes
      return requestedPath === basePath || 
             requestedPath.startsWith(basePath + '/');
    });
  }

  // ✅ FALLBACK: Support pour l'ancien système allowedRoutes
  if (config.allowedRoutes && config.allowedRoutes.length > 0) {
    return config.allowedRoutes.some(allowedRoute => {
      return requestedPath === allowedRoute || 
             requestedPath.startsWith(allowedRoute + '/');
    });
  }

  return true;
}

export function getDefaultDashboard(role: string): string | null {
  const config = getRoleConfig(role);
  return config?.defaultDashboard || null;
}

// Helper to get all protected route prefixes
export function getProtectedRoutePrefixes(): string[] {
  return Object.values(roleConfigs).map(config => config.routePrefix);
}

// ✅ FONCTION DE DEBUG AMÉLIORÉE
export function isRouteAllowed(userRole: string, requestedPath: string): boolean {
  const config = getRoleConfig(userRole);
  if (!config) {
    console.log(`❌ No config found for role: ${userRole}`);
    return false;
  }

  // Vérification du préfixe
  if (!requestedPath.startsWith(config.routePrefix)) {
    console.log(`❌ Path ${requestedPath} doesn't start with ${config.routePrefix}`);
    return false;
  }

  // Vérification avec allowedBasePaths (prioritaire)
  if (config.allowedBasePaths && config.allowedBasePaths.length > 0) {
    const isAllowed = config.allowedBasePaths.some(basePath => {
      const exactMatch = requestedPath === basePath;
      const subRouteMatch = requestedPath.startsWith(basePath + '/');
      if (exactMatch || subRouteMatch) {
        console.log(`✅ Route ${requestedPath} matches base path: ${basePath}`);
        return true;
      }
      return false;
    });

    if (!isAllowed) {
      console.log(`❌ Route ${requestedPath} doesn't match any base path`);
      console.log('Available base paths:', config.allowedBasePaths);
    }
    
    return isAllowed;
  }

  // Fallback pour allowedRoutes
  if (config.allowedRoutes && config.allowedRoutes.length > 0) {
    const isAllowed = config.allowedRoutes.some(allowedRoute => {
      const exactMatch = requestedPath === allowedRoute;
      const subRouteMatch = requestedPath.startsWith(allowedRoute + '/');
      return exactMatch || subRouteMatch;
    });

    console.log(`${isAllowed ? '✅' : '❌'} Route ${requestedPath} is ${isAllowed ? 'allowed' : 'not allowed'} (fallback)`);
    return isAllowed;
  }

  // Si aucune restriction, tout est autorisé sous le préfixe
  console.log(`✅ No restrictions defined, allowing ${requestedPath}`);
  return true;
}

// ✅ FONCTION POUR TESTER PLUSIEURS ROUTES
export function testRoutes(userRole: string, paths: string[]) {
  console.log(`\n🧪 Testing routes for role: ${userRole}`);
  console.log('='.repeat(50));
  
  paths.forEach(path => {
    const allowed = canAccessRoute(userRole, path);
    console.log(`${allowed ? '✅' : '❌'} ${path}`);
  });
  
  console.log('='.repeat(50));
}

// Additional helper function to debug role issues
export function debugRoleAccess(userRole: string, requestedPath: string) {
  console.log('\n🔍 Debug Role Access:');
  console.log('='.repeat(40));
  console.log('  - User Role:', userRole);
  console.log('  - Normalized Role:', userRole.toLowerCase());
  console.log('  - Requested Path:', requestedPath);
  console.log('  - Is Valid Role:', isValidRole(userRole));
  console.log('  - Role Config:', getRoleConfig(userRole));
  console.log('  - Can Access:', canAccessRoute(userRole, requestedPath));
  console.log('  - Default Dashboard:', getDefaultDashboard(userRole));
  console.log('='.repeat(40));
}

// ✅ UTILITAIRE POUR DÉVELOPPEMENT
export function getAllowedRoutesForRole(userRole: string): string[] {
  const config = getRoleConfig(userRole);
  if (!config) return [];
  
  return config.allowedBasePaths || config.allowedRoutes || [];
}