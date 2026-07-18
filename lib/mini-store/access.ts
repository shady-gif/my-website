import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { miniStoreApps, type MiniStoreAppSlug, type MiniStorePlatform } from './apps';

export const miniStoreSessionCookieName = 'shadyy_mini_store_access';

type LicenseRecord = {
  id: string;
  identity: string;
  customer_name?: string | null;
  access_code_hash?: string | null;
  access_code_sha256?: string | null;
  allowed_apps?: string[] | string | null;
  active?: boolean | null;
  expires_at?: string | null;
};

export type MiniStoreSession = {
  app: MiniStoreAppSlug;
  exp: number;
  identity: string;
  licenseId: string;
};

type AccessResult =
  | {
      ok: true;
      identity: string;
      licenseId: string;
    }
  | {
      ok: false;
      reason: 'configuration' | 'invalid' | 'expired' | 'not_entitled';
    };

function getSessionSecret() {
  return process.env.MINI_STORE_SESSION_SECRET ?? '';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signValue(value: string) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('MINI_STORE_SESSION_SECRET is required');
  }

  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function hashAccessCode(accessCode: string) {
  const salt = process.env.MINI_STORE_ACCESS_SALT ?? '';
  return createHash('sha256').update(`${salt}:${accessCode}`).digest('hex');
}

function normalizeAllowedApps(value: LicenseRecord['allowed_apps']) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((app) => app.trim())
      .filter(Boolean);
  }

  return [];
}

function isExpired(expiresAt: string | null | undefined) {
  return Boolean(expiresAt && Date.parse(expiresAt) < Date.now());
}

async function fetchSupabaseLicenses(identity: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const url = new URL('/rest/v1/mini_store_licenses', supabaseUrl);
  url.searchParams.set('identity', `eq.${identity}`);
  url.searchParams.set('active', 'eq.true');
  url.searchParams.set(
    'select',
    'id,identity,customer_name,access_code_hash,allowed_apps,active,expires_at',
  );

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase license lookup failed: ${response.status} ${message}`);
  }

  return (await response.json()) as LicenseRecord[];
}

function getEnvLicenses() {
  const rawLicenses = process.env.MINI_STORE_LICENSES_JSON;

  if (!rawLicenses) {
    return null;
  }

  return JSON.parse(rawLicenses) as LicenseRecord[];
}

export async function verifyMiniStoreAccess({
  accessCode,
  app,
  identity,
}: {
  accessCode: string;
  app: MiniStoreAppSlug;
  identity: string;
}): Promise<AccessResult> {
  const normalizedIdentity = identity.trim().toLowerCase();
  const expectedHash = hashAccessCode(accessCode.trim());
  const licenses =
    (await fetchSupabaseLicenses(normalizedIdentity)) ??
    getEnvLicenses()?.filter((license) => license.identity.toLowerCase() === normalizedIdentity);

  if (!licenses) {
    return { ok: false, reason: 'configuration' };
  }

  const license = licenses.find((candidate) => {
    const storedHash = candidate.access_code_hash ?? candidate.access_code_sha256 ?? '';
    return storedHash && safeEqual(storedHash, expectedHash);
  });

  if (!license) {
    return { ok: false, reason: 'invalid' };
  }

  if (isExpired(license.expires_at)) {
    return { ok: false, reason: 'expired' };
  }

  const allowedApps = normalizeAllowedApps(license.allowed_apps);
  if (!allowedApps.includes(app) && !allowedApps.includes('*')) {
    return { ok: false, reason: 'not_entitled' };
  }

  return {
    ok: true,
    identity: normalizedIdentity,
    licenseId: String(license.id),
  };
}

export function createMiniStoreSession({
  app,
  identity,
  licenseId,
}: {
  app: MiniStoreAppSlug;
  identity: string;
  licenseId: string;
}) {
  const session: MiniStoreSession = {
    app,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    identity,
    licenseId,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${signValue(payload)}`;
}

export function readMiniStoreSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split('.');
  if (!payload || !signature || !safeEqual(signValue(payload), signature)) {
    return null;
  }

  const session = JSON.parse(base64UrlDecode(payload)) as MiniStoreSession;

  if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  if (!(session.app in miniStoreApps)) {
    return null;
  }

  return session;
}

export async function logMiniStoreDownload({
  app,
  identity,
  licenseId,
  platform,
}: {
  app: MiniStoreAppSlug;
  identity: string;
  licenseId: string;
  platform: MiniStorePlatform;
}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  await fetch(new URL('/rest/v1/mini_store_download_logs', supabaseUrl), {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      app_slug: app,
      identity,
      license_id: licenseId,
      platform,
    }),
  });
}
