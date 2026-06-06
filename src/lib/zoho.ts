import { URLSearchParams } from 'url';

import { ZohoTokens, loadTokens, saveTokens } from './tokenStore';

/**
 * Static Zoho configuration – all values come from env vars.
 */
export const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID ?? '',
  clientSecret: process.env.ZOHO_CLIENT_SECRET ?? '',
  redirectUri: process.env.ZOHO_REDIRECT_URI ?? '',
  accountsUrl: process.env.ZOHO_ACCOUNTS_URL ?? 'https://accounts.zoho.in',
  apiUrl: process.env.ZOHO_API_URL ?? 'https://sheet.zoho.in/api/v2',
};

/** Generate the Zoho OAuth URL for the user to click */
export function getZohoAuthUrl(): string {
  const scope = 'ZohoSheet.dataAPI.READ,ZohoSheet.dataAPI.UPDATE';
  const url = new URL(`${ZOHO_CONFIG.accountsUrl}/oauth/v2/auth`);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', ZOHO_CONFIG.clientId);
  url.searchParams.append('scope', scope);
  url.searchParams.append('redirect_uri', ZOHO_CONFIG.redirectUri);
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent');
  return url.toString();
}

/** Exchange a one‑time auth code for access & refresh tokens */
export async function exchangeCodeForTokens(code: string): Promise<ZohoTokens> {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', ZOHO_CONFIG.clientId);
  params.append('client_secret', ZOHO_CONFIG.clientSecret);
  params.append('redirect_uri', ZOHO_CONFIG.redirectUri);
  params.append('code', code);

  const res = await fetch(`${ZOHO_CONFIG.accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Zoho auth error: ${data.error}`);
  }
  // Calculate absolute expiry (ms since epoch)
  data.expires_at = Date.now() + data.expires_in * 1000;
  await saveTokens(data);
  return data;
}

/** Refresh the access token using the stored refresh token */
export async function refreshAccessToken(refreshToken: string): Promise<ZohoTokens> {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', ZOHO_CONFIG.clientId);
  params.append('client_secret', ZOHO_CONFIG.clientSecret);
  params.append('refresh_token', refreshToken);

  const res = await fetch(`${ZOHO_CONFIG.accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Zoho refresh error: ${data.error}`);
  }

  const existing = (await loadTokens()) ?? ({} as ZohoTokens);
  const merged: ZohoTokens = {
    ...existing,
    ...data,
    refresh_token: existing.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await saveTokens(merged);
  return merged;
}

// Guard to avoid parallel refreshes that could trigger Zoho rate limits
let ongoingRefresh: Promise<string> | null = null;

/** Return a fresh access token, refreshing when needed */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens?.refresh_token) {
    throw new Error('No Zoho refresh token available – you must authenticate first.');
  }
  const now = Date.now();
  const needsRefresh =
    !tokens.expires_at ||
    tokens.expires_at > now + 24 * 60 * 60 * 1000 || // unrealistic future value → treat as bad
    now > tokens.expires_at - 5 * 60 * 1000; // less than 5 min left

  if (!needsRefresh) {
    return tokens.access_token;
  }

  // If a refresh is already in progress, wait for it instead of starting a new one
  if (ongoingRefresh) {
    return ongoingRefresh;
  }

  // Start a new refresh and store the promise so others can await it
  ongoingRefresh = (async () => {
    try {
      const fresh = await refreshAccessToken(tokens.refresh_token!);
      return fresh.access_token;
    } finally {
      // Reset guard for next calls
      ongoingRefresh = null;
    }
  })();

  return ongoingRefresh;
}

/** Simple helper for UI – are we already authenticated? */
export async function checkAuthStatus(): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens?.refresh_token;
}
