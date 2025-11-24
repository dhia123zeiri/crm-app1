/**
 * Formatte un montant en devise EUR
 * @param amount - Le montant à formatter
 * @returns Le montant formatté en euros (ex: "1 234,56 €")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Formatte une date au format français
 * @param dateString - La date à formatter (format ISO ou string)
 * @returns La date formatée (ex: "28/10/2025")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatte une date avec l'heure
 * @param dateString - La date à formatter (format ISO ou string)
 * @returns La date et l'heure formatées (ex: "28/10/2025 à 14:30")
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatte une date de manière relative (il y a X jours)
 * @param dateString - La date à formatter
 * @returns La date relative (ex: "il y a 2 jours", "dans 5 jours")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return "Demain";
  } else if (diffDays === -1) {
    return "Hier";
  } else if (diffDays > 0) {
    return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  } else {
    return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
  }
}

/**
 * Calcule le nombre de jours avant/après échéance
 * @param dateEcheance - La date d'échéance
 * @returns Le nombre de jours (positif = futur, négatif = passé)
 */
export function getDaysUntilDue(dateEcheance: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(dateEcheance);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si une date est passée
 * @param dateString - La date à vérifier
 * @returns true si la date est passée
 */
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Formatte un pourcentage
 * @param value - La valeur à formatter (ex: 20 pour 20%)
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns Le pourcentage formatté (ex: "20,00 %")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

/**
 * Formatte un nombre avec séparateurs de milliers
 * @param value - Le nombre à formatter
 * @param decimals - Nombre de décimales (défaut: 0)
 * @returns Le nombre formatté (ex: "1 234,56")
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Tronque un texte à une longueur maximale
 * @param text - Le texte à tronquer
 * @param maxLength - La longueur maximale
 * @returns Le texte tronqué avec "..." si nécessaire
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalise la première lettre d'une chaîne
 * @param text - Le texte à capitaliser
 * @returns Le texte avec la première lettre en majuscule
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Génère une couleur aléatoire en hexadécimal
 * @returns Une couleur hex (ex: "#A3B5C7")
 */
export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Vérifie si un SIRET est valide (format français)
 * @param siret - Le numéro SIRET à valider
 * @returns true si le SIRET est valide
 */
export function isValidSiret(siret: string): boolean {
  if (!siret || siret.length !== 14) {
    return false;
  }
  
  // Vérification que ce sont bien des chiffres
  if (!/^\d+$/.test(siret)) {
    return false;
  }
  
  // Algorithme de Luhn pour vérifier le SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  
  return sum % 10 === 0;
}

/**
 * Formate un numéro de téléphone français
 * @param phone - Le numéro de téléphone
 * @returns Le numéro formatté (ex: "01 23 45 67 89")
 */
export function formatPhoneNumber(phone: string): string {
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Formate par groupes de 2
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
}

/**
 * Calcule le montant TTC à partir du HT et du taux de TVA
 * @param montantHT - Montant hors taxes
 * @param tauxTVA - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Le montant TTC
 */
export function calculateTTC(montantHT: number, tauxTVA: number): number {
  return montantHT * (1 + tauxTVA / 100);
}

/**
 * Calcule le montant HT à partir du TTC et du taux de TVA
 * @param montantTTC - Montant toutes taxes comprises
 * @param tauxTVA - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Le montant HT
 */
export function calculateHT(montantTTC: number, tauxTVA: number): number {
  return montantTTC / (1 + tauxTVA / 100);
}

/**
 * Calcule le montant de TVA
 * @param montantHT - Montant hors taxes
 * @param tauxTVA - Taux de TVA en pourcentage (ex: 20 pour 20%)
 * @returns Le montant de TVA
 */
export function calculateTVA(montantHT: number, tauxTVA: number): number {
  return montantHT * (tauxTVA / 100);
}

/**
 * Arrondit un nombre à 2 décimales (pour les montants)
 * @param value - La valeur à arrondir
 * @returns La valeur arrondie à 2 décimales
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}