import fs from 'fs';
import path from 'path';

const TOKEN_FILE_PATH = path.join(process.cwd(), 'zoho-tokens.json');

type ZohoTokens = {
  access_token: string;
  refresh_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // calculated
};

export const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID || '',
  clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
  redirectUri: process.env.ZOHO_REDIRECT_URI || '',
  accountsUrl: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in',
  apiUrl: process.env.ZOHO_API_URL || 'https://sheet.zoho.in/api/v2',
};

export function getZohoAuthUrl() {
  const scope = 'ZohoSheet.data.ALL';
  const url = new URL(`${ZOHO_CONFIG.accountsUrl}/oauth/v2/auth`);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', ZOHO_CONFIG.clientId);
  url.searchParams.append('scope', scope);
  url.searchParams.append('redirect_uri', ZOHO_CONFIG.redirectUri);
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent');
  return url.toString();
}

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

  // Calculate expiration time (usually 3600 seconds)
  data.expires_at = Date.now() + (data.expires_in * 1000);
  
  saveTokens(data);
  return data;
}

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

  const existingTokens = loadTokens();
  const updatedTokens = {
    ...existingTokens,
    ...data,
    refresh_token: existingTokens?.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in * 1000),
  };
  
  saveTokens(updatedTokens);
  return updatedTokens;
}

export function saveTokens(tokens: ZohoTokens) {
  fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2), 'utf8');
}

export function loadTokens(): ZohoTokens | null {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read zoho tokens file:", err);
  }
  return null;
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error("No Zoho refresh token available. Please authenticate.");
  }

  // Force refresh if expires_at is missing, 0, very far future (bad manual value), or within 5 min
  const isExpired = !tokens.expires_at 
    || tokens.expires_at > Date.now() + (24 * 60 * 60 * 1000) // > 24h means it was manually set wrong
    || Date.now() > tokens.expires_at - 300000;               // within 5 min of expiry

  if (isExpired) {
    console.log('[Zoho] Token expired or needs refresh, refreshing now...');
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    return newTokens.access_token;
  }

  return tokens.access_token;
}

export async function checkAuthStatus() {
  const tokens = loadTokens();
  return !!tokens && !!tokens.refresh_token;
}
