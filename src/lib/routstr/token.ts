/**
 * Cashu token storage and management utilities
 * Handles saving, loading, and validating Cashu tokens
 */

const TOKEN_STORAGE_KEY = 'cashu:token';

/**
 * Validates that a token string is in the correct Cashu format
 * @param token - The token string to validate
 * @returns true if the token appears to be valid, false otherwise
 */
export function validateCashuToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const trimmed = token.trim();
  return trimmed.startsWith('cashu');
}

/**
 * Saves a Cashu token to localStorage
 * @param token - The token string to save
 * @returns Promise that resolves when the token is saved
 */
export async function saveCashuToken(token: string): Promise<void> {
  if (!validateCashuToken(token)) {
    throw new Error('Invalid Cashu token format. Token should start with "cashu"');
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } else {
    // Server-side: could use a different storage mechanism if needed
    // For now, we'll just validate
    return Promise.resolve();
  }
}

/**
 * Loads a Cashu token from localStorage
 * @returns Promise that resolves to the token string or null if not found
 */
export async function loadCashuToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  
  // Server-side: return null
  return Promise.resolve(null);
}

/**
 * Removes the stored Cashu token
 */
export async function clearCashuToken(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
