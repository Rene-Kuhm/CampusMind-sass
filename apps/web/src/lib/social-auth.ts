// Social Authentication Configuration
// Supports Google and GitHub OAuth

export type SocialProvider = 'google' | 'github';

export interface SocialAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scope: string[];
  };
  github: {
    clientId: string;
    redirectUri: string;
    scope: string[];
  };
}

export interface SocialUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: SocialProvider;
  accessToken?: string;
}

// Configuration from environment
const config: SocialAuthConfig = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/google`,
    scope: ['openid', 'email', 'profile'],
  },
  github: {
    clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/github`,
    scope: ['read:user', 'user:email'],
  },
};

// Generate OAuth URL for Google
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: config.google.scope.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Generate OAuth URL for GitHub
export function getGitHubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.redirectUri,
    scope: config.github.scope.join(' '),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// Get OAuth URL by provider
export function getSocialAuthUrl(provider: SocialProvider): string {
  switch (provider) {
    case 'google':
      return getGoogleAuthUrl();
    case 'github':
      return getGitHubAuthUrl();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Exchange code for token (calls backend)
export async function exchangeCodeForToken(
  provider: SocialProvider,
  code: string
): Promise<{ accessToken: string; user: SocialUser }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const response = await fetch(`${apiUrl}/api/v1/auth/social/${provider}/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al autenticar con proveedor social');
  }

  return response.json();
}

// Connect social account to existing user
export async function connectSocialAccount(
  provider: SocialProvider,
  code: string,
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const response = await fetch(`${apiUrl}/api/v1/auth/social/${provider}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al conectar cuenta social');
  }

  return response.json();
}

// Disconnect social account from user
export async function disconnectSocialAccount(
  provider: SocialProvider,
  accessToken: string
): Promise<{ success: boolean; message: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const response = await fetch(`${apiUrl}/api/v1/auth/social/${provider}/disconnect`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al desconectar cuenta social');
  }

  return response.json();
}

// Get connected social accounts
export async function getConnectedAccounts(
  accessToken: string
): Promise<{ provider: SocialProvider; email: string; connectedAt: string }[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const response = await fetch(`${apiUrl}/api/v1/auth/social/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener cuentas conectadas');
  }

  return response.json();
}

// Check if provider is configured
export function isProviderConfigured(provider: SocialProvider): boolean {
  return Boolean(config[provider]?.clientId);
}

// Get all configured providers
export function getConfiguredProviders(): SocialProvider[] {
  const providers: SocialProvider[] = [];

  if (config.google.clientId) providers.push('google');
  if (config.github.clientId) providers.push('github');

  return providers;
}

// Parse user from Google token payload
export function parseGoogleUser(payload: {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}): SocialUser {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    firstName: payload.given_name,
    lastName: payload.family_name,
    avatar: payload.picture,
    provider: 'google',
  };
}

// Parse user from GitHub API response
export function parseGitHubUser(payload: {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}): SocialUser {
  const nameParts = (payload.name || payload.login).split(' ');

  return {
    id: payload.id.toString(),
    email: payload.email || `${payload.login}@github.local`,
    name: payload.name || payload.login,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ') || undefined,
    avatar: payload.avatar_url,
    provider: 'github',
  };
}

// Social login with popup (alternative to redirect)
export function openSocialAuthPopup(
  provider: SocialProvider,
  onSuccess: (data: { accessToken: string; user: SocialUser }) => void,
  onError: (error: Error) => void
): Window | null {
  const url = getSocialAuthUrl(provider);
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    url,
    `${provider}-auth`,
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    onError(new Error('No se pudo abrir la ventana de autenticación'));
    return null;
  }

  // Listen for callback message
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === 'social-auth-success') {
      window.removeEventListener('message', handleMessage);
      popup.close();
      onSuccess(event.data.payload);
    } else if (event.data.type === 'social-auth-error') {
      window.removeEventListener('message', handleMessage);
      popup.close();
      onError(new Error(event.data.error));
    }
  };

  window.addEventListener('message', handleMessage);

  // Check if popup was closed manually
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
    }
  }, 500);

  return popup;
}

// Send message from callback page to opener
export function sendAuthResultToOpener(
  success: boolean,
  data?: { accessToken: string; user: SocialUser },
  error?: string
): void {
  if (window.opener) {
    if (success && data) {
      window.opener.postMessage(
        { type: 'social-auth-success', payload: data },
        window.location.origin
      );
    } else {
      window.opener.postMessage(
        { type: 'social-auth-error', error },
        window.location.origin
      );
    }
  }
}
