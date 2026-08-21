// src/hooks/googleIdentity.ts
// Loads Google Identity Services and requests an OAuth2 access token via a
// user-initiated click, for use with a custom "Continue with Google" button.

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: { message?: string }) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: GoogleTokenClientConfig) => { requestAccessToken: () => void };
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleAccountsOAuth2 } };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let gisScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
}

export async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Sign-In failed to load');
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google sign-in failed'));
        } else {
          resolve(response.access_token);
        }
      },
      error_callback: (error) => {
        reject(new Error(error?.message || 'Google sign-in was cancelled'));
      },
    });
    client.requestAccessToken();
  });
}
