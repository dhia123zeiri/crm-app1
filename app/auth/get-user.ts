import { serverGet } from "../common/util/fetch";

// Match your backend enum exactly
export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  COMPTABLE = 'COMPTABLE'
}

// Match your backend interface exactly
export interface TokenPayload {
  userId: number;
  nom: string;
  email: string;
  role: Role;
}

// ========== CACHE SYSTEM ==========
let cachedUser: TokenPayload | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5000; // 5 secondes de cache

export async function getCurrentUser(): Promise<TokenPayload | null> {
  try {
    // Vérifier si on a un cache valide
    const now = Date.now();
    if (cachedUser && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Using cached user data');
      return cachedUser;
    }

    console.log('🔄 Fetching fresh user data...');
    
    // Faire la requête si le cache est expiré
    const userData = await serverGet('users/me') as TokenPayload;
    
    // Mettre en cache
    cachedUser = userData;
    cacheTimestamp = now;
    
    return userData;
    
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    // Si erreur 429 (Too Many Requests) et qu'on a un cache, le retourner
    if (error instanceof Error && error.message.includes('429') && cachedUser) {
      console.warn('⚠️ Rate limited - using cached user data');
      return cachedUser;
    }
    
    // Sinon, invalider le cache et retourner null
    cachedUser = null;
    cacheTimestamp = 0;
    return null;
  }
}

// Fonction pour invalider manuellement le cache
// À appeler après login/logout
export function clearUserCache(): void {
  console.log('🗑️ Clearing user cache');
  cachedUser = null;
  cacheTimestamp = 0;
}

// Fonction pour forcer un refresh
export async function refreshCurrentUser(): Promise<TokenPayload | null> {
  clearUserCache();
  return getCurrentUser();
}