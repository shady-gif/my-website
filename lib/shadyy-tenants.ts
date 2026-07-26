import fs from "node:fs";
import path from "node:path";

export type TenantSelectors = {
  productTitle: string[];
  price: string[];
  category: string[];
  searchInput: string[];
  productCards: string[];
  addToCart: string[];
  customActions: string[];
};

export type TenantWidgetConfig = {
  primaryColor: string;
  accentColor: string;
  launcherText: string;
  logoUrl: string;
  starterPrompts: string[];
};

export type TenantConfig = {
  tenantId: string;
  domains: string[];
  brandName: string;
  widget: TenantWidgetConfig;
  selectors: TenantSelectors;
  searchParams: string[];
  docsCatalogCollectionId: string;
  leadDestination: {
    type: "none" | "email" | "webhook" | "crm";
    value: string;
  };
  flowise: {
    apiHost: string;
    chatflowId: string;
  };
};

export type PublicTenantConfig = Pick<
  TenantConfig,
  "tenantId" | "brandName" | "widget" | "selectors" | "searchParams"
>;

const tenantConfigs: Record<string, TenantConfig> = {
  shadyy: {
    tenantId: "shadyy",
    domains: [
      "localhost:3004",
      "127.0.0.1:3004",
      "shadyy.org",
      "www.shadyy.org",
    ],
    brandName: "Shadyy",
    widget: {
      primaryColor: "#f97316",
      accentColor: "#ffffff",
      launcherText: "☺",
      logoUrl: "",
      starterPrompts: [
        "What can I do on this page?",
        "How do I use the Free AI PPT option?",
        "Which option should I open?",
        "Request a callback",
      ],
    },
    selectors: {
      productTitle: ["[data-product-title]", "h1"],
      price: ["[data-product-price]", "[itemprop='price']", ".price"],
      category: ["[data-category]", "[aria-label='breadcrumb']", ".breadcrumb"],
      searchInput: ["input[type='search']", "input[name='q']", "input[name='search']"],
      productCards: [
        "[data-product-card]",
        "[data-template-card]",
        "[data-shadyy-product-card]",
        ".product-card",
      ],
      addToCart: ["[data-add-to-cart]", "button[name='add']", "button", "a[href]"],
      customActions: ["[data-shadyy-action='true']"],
    },
    searchParams: ["q", "query", "search", "keyword"],
    docsCatalogCollectionId: "shadyy-local-default",
    leadDestination: {
      type: "none",
      value: "",
    },
    flowise: {
      apiHost: process.env.SHADYY_FLOWISE_API_HOST ?? "http://localhost:3002",
      chatflowId:
        process.env.SHADYY_FLOWISE_CHATFLOW_ID ??
        "d595d671-654f-4378-8c64-30607cc61394",
    },
  },
};

type StoredOnboardingTenant = {
  tenantId: string;
  domains: string[];
  brandName: string;
  primaryColor: string;
  accentColor: string;
  launcherText: string;
  logoUrl: string;
  starterPrompts: string[];
  selectors: TenantSelectors;
  searchParams: string[];
  docsCatalogCollectionId: string;
  leadDestination: TenantConfig["leadDestination"];
  flowiseApiHost: string;
  flowiseChatflowId: string;
};

const onboardingTenantsFile = () =>
  path.join(process.cwd(), "data", "chatbot-admin", "onboarding-tenants.json");

const readOnboardingTenants = (): TenantConfig[] => {
  try {
    if (!fs.existsSync(onboardingTenantsFile())) return [];
    const raw = fs.readFileSync(onboardingTenantsFile(), "utf8");
    const records = JSON.parse(raw) as StoredOnboardingTenant[];

    return records.map((record) => ({
      tenantId: record.tenantId,
      domains: record.domains,
      brandName: record.brandName,
      widget: {
        primaryColor: record.primaryColor,
        accentColor: record.accentColor,
        launcherText: record.launcherText,
        logoUrl: record.logoUrl,
        starterPrompts: record.starterPrompts,
      },
      selectors: record.selectors,
      searchParams: record.searchParams,
      docsCatalogCollectionId: record.docsCatalogCollectionId,
      leadDestination: record.leadDestination,
      flowise: {
        apiHost: record.flowiseApiHost,
        chatflowId: record.flowiseChatflowId,
      },
    }));
  } catch {
    return [];
  }
};

const allTenantConfigs = () => [
  ...Object.values(tenantConfigs),
  ...readOnboardingTenants(),
];

export const getTenantConfig = (tenantId: string) =>
  tenantConfigs[tenantId] ??
  readOnboardingTenants().find((tenant) => tenant.tenantId === tenantId);

const normalizeHost = (host: string) =>
  host
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();

const hostWithoutPort = (host: string) => normalizeHost(host).replace(/:\d+$/, "");

export const isHostAllowedForTenant = (tenant: TenantConfig, host: string) => {
  const normalizedHost = normalizeHost(host);
  const normalizedHostWithoutPort = hostWithoutPort(host);

  return tenant.domains.some((domain) => {
    const normalizedDomain = normalizeHost(domain);
    const normalizedDomainWithoutPort = hostWithoutPort(domain);

    return (
      normalizedHost === normalizedDomain ||
      normalizedHostWithoutPort === normalizedDomainWithoutPort ||
      normalizedHost.endsWith(`.${normalizedDomain}`) ||
      normalizedHostWithoutPort.endsWith(`.${normalizedDomainWithoutPort}`)
    );
  });
};

export const getTenantConfigForHost = (host: string) =>
  allTenantConfigs().find((tenant) => isHostAllowedForTenant(tenant, host));

export const getTenantConfigByDomain = (host: string, fallbackTenantId: string) => {
  const matchingTenant = getTenantConfigForHost(host);
  if (matchingTenant) return matchingTenant;

  const fallbackTenant = getTenantConfig(fallbackTenantId);

  return fallbackTenant && isHostAllowedForTenant(fallbackTenant, host)
    ? fallbackTenant
    : undefined;
};

export const getPublicTenantConfig = (tenant: TenantConfig): PublicTenantConfig => {
  return {
    tenantId: tenant.tenantId,
    brandName: tenant.brandName,
    widget: tenant.widget,
    selectors: tenant.selectors,
    searchParams: tenant.searchParams,
  };
};
