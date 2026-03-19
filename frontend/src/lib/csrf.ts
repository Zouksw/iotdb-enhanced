/**
 * CSRF Protection Module
 *
 * Provides Cross-Site Request Forgery protection for all state-changing requests.
 * Integrates with the backend's CSRF implementation at /api/auth/csrf-token.
 */

class CsrfProtection {
  private token: string | null = null;
  private readonly STORAGE_KEY = 'csrf_token';
  private readonly TOKEN_ENDPOINT = '/api/auth/csrf-token'; // Matches backend endpoint
  private readonly HEADER_NAME = 'x-csrf-token'; // Matches backend header name (lowercase)
  private initialized = false;

  /**
   * Initialize CSRF protection by fetching token from backend
   * Should be called on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // The backend /api/auth/csrf-token endpoint returns the token
      // and sets it as an httpOnly cookie
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.csrfToken || data.token;
        this.initialized = true;

        // Store for fallback (in case backend doesn't use cookies)
        if (typeof window !== 'undefined' && this.token) {
          sessionStorage.setItem(this.STORAGE_KEY, this.token);
        }
      } else {
        console.warn('Failed to fetch CSRF token:', response.status);
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      // Don't throw - allow app to continue with degraded security
    }
  }

  /**
   * Get auth headers for API requests
   * Includes auth token if available from tokenManager
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Note: Auth token is handled by HttpOnly cookie set by backend
    // We don't need to manually add Authorization header for most requests
    // The backend will read the token from the HttpOnly cookie

    return headers;
  }

  /**
   * Get current CSRF token
   */
  getToken(): string | null {
    if (this.token) {
      return this.token;
    }

    // Fallback to sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.token = stored;
        return this.token;
      }
    }

    return null;
  }

  /**
   * Get headers object with CSRF token for API requests
   * Returns empty object if no token available
   */
  getHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      return {};
    }
    return {
      [this.HEADER_NAME]: token, // Lowercase to match backend
    };
  }

  /**
   * Check if CSRF protection is ready
   */
  isReady(): boolean {
    return this.initialized && this.token !== null;
  }

  /**
   * Refresh CSRF token from backend
   * Call this after user actions that might require token refresh
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    this.token = null;
    await this.initialize();
  }

  /**
   * Set CSRF token manually (for responses that include new token)
   */
  setToken(token: string): void {
    this.token = token;
    this.initialized = true;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.STORAGE_KEY, token);
    }
  }

  /**
   * Clear CSRF token (e.g., after logout)
   */
  clear(): void {
    this.token = null;
    this.initialized = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Get CSRF token for use in forms (hidden input)
   */
  getFormToken(): string {
    return this.getToken() || '';
  }

  /**
   * Get the header name used for CSRF token
   */
  getHeaderName(): string {
    return this.HEADER_NAME;
  }

  /**
   * Get the cookie name used by backend
   */
  getCookieName(): string {
    return 'csrf_token';
  }
}

// Export singleton instance
export const csrfProtection = new CsrfProtection();

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      csrfProtection.initialize().catch(console.error);
    });
  } else {
    // Already loaded
    csrfProtection.initialize().catch(console.error);
  }
}
