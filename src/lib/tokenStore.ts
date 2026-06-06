import fs from 'fs';
import path from 'path';

/** Shape of the token object that Zoho returns */
export type ZohoTokens = {
  access_token: string;
  refresh_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number; // seconds
  expires_at: number; // epoch ms (calculated)
};

/* --------------------------------------------------------------
   Detect the best storage backend
   -------------------------------------------------------------- */
const USE_KV = Boolean(process.env.TOKEN_KV_URL && process.env.TOKEN_KV_TOKEN);
const USE_ENV = Boolean(process.env.ZOHO_TOKENS);
const IS_SERVERLESS = Boolean(process.env.VERCEL) || Boolean(process.env.NETLIFY) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

// When running in a server‑less container we can only write to /tmp
const LOCAL_PATH = IS_SERVERLESS ? '/tmp/zoho-tokens.json' : path.resolve(process.cwd(), 'zoho-tokens.json');

/* --------------------------------------------------------------
   KV implementation (Redis‑compatible)
   -------------------------------------------------------------- */
let kvClient: any = null;
async function initKv() {
  if (!kvClient) {
    const { Redis } = await import('@upstash/redis');
    kvClient = new Redis({
      url: process.env.TOKEN_KV_URL!,
      token: process.env.TOKEN_KV_TOKEN!,
    });
  }
}

/* --------------------------------------------------------------
   Public API – save / load
   -------------------------------------------------------------- */
export async function saveTokens(tokens: ZohoTokens): Promise<void> {
  // 1️⃣ KV (if configured)
  if (USE_KV) {
    await initKv();
    await kvClient.set('zohoTokens', JSON.stringify(tokens));
    return;
  }

  // 2️⃣ Encrypted env‑var – we cannot write to it at runtime, so just warn the operator
  if (USE_ENV) {
    console.warn(
      '[Zoho] Tokens are stored in ZOHO_TOKENS env‑var – you must update it manually after a refresh.\n' +
        'Example (bash): export ZOHO_TOKENS=$(echo "' +
        JSON.stringify(tokens) +
        '" | base64)'
    );
    return;
  }

  // 3️⃣ Local file fallback (dev mode)
  try {
    fs.writeFileSync(LOCAL_PATH, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (e) {
    console.error('[Zoho] Failed to write token file:', e);
    throw e;
  }
}

/** Load tokens from the highest‑priority store that is available. */
export async function loadTokens(): Promise<ZohoTokens | null> {
  // 1️⃣ KV
  if (USE_KV) {
    await initKv();
    const raw = await kvClient.get('zohoTokens');
    return raw ? (JSON.parse(raw) as ZohoTokens) : null;
  }

  // 2️⃣ Encrypted env‑var
  if (USE_ENV) {
    try {
      const decoded = Buffer.from(process.env.ZOHO_TOKENS!, 'base64').toString('utf8');
      return JSON.parse(decoded) as ZohoTokens;
    } catch (e) {
      console.error('[Zoho] Failed to parse ZOHO_TOKENS env‑var:', e);
      return null;
    }
  }

  // 3️⃣ Local file (dev)
  try {
    if (fs.existsSync(LOCAL_PATH)) {
      const data = fs.readFileSync(LOCAL_PATH, 'utf8');
      return JSON.parse(data) as ZohoTokens;
    }
  } catch (e) {
    console.error('[Zoho] Failed to read local token file:', e);
  }
  return null;
}

/** Helper – overwrite the access token only (used after a refresh) */
export async function updateAccessToken(access: string, expiresInSec: number): Promise<void> {
  const existing = (await loadTokens()) ?? ({} as ZohoTokens);
  existing.access_token = access;
  existing.expires_in = expiresInSec;
  existing.expires_at = Date.now() + expiresInSec * 1000;
  await saveTokens(existing);
}
