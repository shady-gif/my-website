export const miniStoreApps = {
  mautic: {
    name: 'Signals',
    category: 'Marketing automation',
    promise: 'Run local lead capture, landing pages, and campaigns.',
    packages: {
      mac: 'shadyy-mini-store-mautic-milestone-18-mautic-first-public.tar.gz',
      windows: 'shadyy-mini-store-mautic-milestone-18-mautic-first-public.zip',
    },
  },
  twenty: {
    name: 'CRM',
    category: 'CRM',
    promise: 'Run a local CRM for companies, contacts, deals, and followups.',
    packages: {
      mac: 'shadyy-mini-store-twenty-milestone-19-twenty-public.tar.gz',
      windows: 'shadyy-mini-store-twenty-milestone-19-twenty-public.zip',
    },
  },
  postiz: {
    name: 'Social',
    category: 'Social scheduling',
    promise: 'Plan and schedule local-first social content workflows.',
    packages: {
      mac: 'shadyy-mini-store-postiz-milestone-20-postiz-proof.tar.gz',
      windows: 'shadyy-mini-store-postiz-milestone-20-postiz-proof.zip',
    },
  },
  typebot: {
    name: 'Leads',
    category: 'Forms and chat',
    promise: 'Build conversational forms that qualify leads locally.',
    packages: {
      mac: 'Typebot Desktop-0.1.0-mac-arm64.dmg',
      windows: 'Typebot Desktop-0.1.0-windows-x64.zip',
    },
  },
  growthbook: {
    name: 'Test',
    category: 'Feature flags',
    promise: 'Run local flags and experiment workflows close to your data.',
    packages: {
      mac: 'shadyy-mini-store-growthbook-milestone-23-growthbook-proof.tar.gz',
      windows: 'shadyy-mini-store-growthbook-milestone-23-growthbook-proof.zip',
    },
  },
} as const;

export type MiniStoreAppSlug = keyof typeof miniStoreApps;
export type MiniStorePlatform = 'mac' | 'windows';

export function isMiniStoreAppSlug(app: string): app is MiniStoreAppSlug {
  return app in miniStoreApps;
}

export function isMiniStorePlatform(platform: string): platform is MiniStorePlatform {
  return platform === 'mac' || platform === 'windows';
}
