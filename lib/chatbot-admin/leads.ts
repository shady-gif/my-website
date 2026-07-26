import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { redactPii } from "@/lib/shadyy-security";

export type LeadDeliveryChannel = "email" | "google_sheet" | "crm";
export type LeadDeliveryStatus = "not_configured" | "pending" | "sent" | "failed";

export type LeadDeliveryAttempt = {
  channel: LeadDeliveryChannel;
  status: LeadDeliveryStatus;
  message: string;
  attemptedAt: string;
};

export type LeadCapture = {
  id: string;
  tenantId: string;
  chatId: string;
  name: string;
  contact: string;
  productPage: string;
  budget: string;
  interest: string;
  objection: string;
  conversationSummary: string;
  pageUrl: string;
  pageTitle: string;
  pagePath: string;
  createdAt: string;
  updatedAt: string;
  delivery: LeadDeliveryAttempt[];
};

export type LeadCaptureInput = {
  tenantId?: string;
  chatId?: string;
  name?: string;
  contact?: string;
  productPage?: string;
  budget?: string;
  interest?: string;
  objection?: string;
  conversationSummary?: string;
  pageContext?: {
    url?: string;
    path?: string;
    title?: string;
    pageType?: string;
    primaryHeading?: string;
    tenantContext?: {
      productTitle?: string;
      price?: string;
      category?: string;
    };
  };
};

const dataRoot = path.join(process.cwd(), "data", "chatbot-admin");
const leadsFile = path.join(dataRoot, "leads.json");

const nowIso = () => new Date().toISOString();

const asText = (value: unknown, maxLength = 1200) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const ensureStore = async () => {
  await fs.mkdir(dataRoot, { recursive: true });

  try {
    await fs.access(leadsFile);
  } catch {
    await fs.writeFile(leadsFile, "[]", "utf8");
  }
};

const readLeads = async (): Promise<LeadCapture[]> => {
  await ensureStore();
  const raw = await fs.readFile(leadsFile, "utf8");
  return JSON.parse(raw) as LeadCapture[];
};

const writeLeads = async (leads: LeadCapture[]) => {
  await ensureStore();
  await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2), "utf8");
};

const deliveryWebhookUrl = (channel: LeadDeliveryChannel) => {
  if (channel === "email") return process.env.SHADYY_LEAD_EMAIL_WEBHOOK_URL ?? "";
  if (channel === "google_sheet") {
    return process.env.SHADYY_LEAD_GOOGLE_SHEET_WEBHOOK_URL ?? "";
  }
  return process.env.SHADYY_LEAD_CRM_WEBHOOK_URL ?? "";
};

const deliveryLabel = (channel: LeadDeliveryChannel) => {
  if (channel === "email") return "Email";
  if (channel === "google_sheet") return "Google Sheet";
  return "CRM";
};

const postDeliveryWebhook = async (
  channel: LeadDeliveryChannel,
  lead: LeadCapture,
): Promise<LeadDeliveryAttempt> => {
  const attemptedAt = nowIso();
  const webhookUrl = deliveryWebhookUrl(channel);
  const label = deliveryLabel(channel);

  if (!webhookUrl) {
    return {
      channel,
      status: channel === "crm" ? "pending" : "not_configured",
      message:
        channel === "crm"
          ? "CRM delivery is reserved for the later CRM connection."
          : `${label} webhook is not configured.`,
      attemptedAt,
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "shadyy.lead.created", lead }),
    });

    if (!response.ok) {
      return {
        channel,
        status: "failed",
        message: `${label} webhook returned ${response.status}.`,
        attemptedAt,
      };
    }

    return {
      channel,
      status: "sent",
      message: `${label} delivery accepted.`,
      attemptedAt,
    };
  } catch (error) {
    return {
      channel,
      status: "failed",
      message: error instanceof Error ? error.message : `${label} delivery failed.`,
      attemptedAt,
    };
  }
};

const inferProductPage = (input: LeadCaptureInput) => {
  const context = input.pageContext;
  const tenantContext = context?.tenantContext;

  return (
    asText(input.productPage, 400) ||
    asText(tenantContext?.productTitle, 240) ||
    asText(context?.primaryHeading, 240) ||
    asText(context?.title, 240) ||
    asText(context?.url, 400)
  );
};

export const createLeadCapture = async (input: LeadCaptureInput) => {
  const tenantId = asText(input.tenantId || "shadyy", 80);
  const name = asText(input.name, 160);
  const contact = asText(input.contact, 240);

  if (!tenantId) throw new Error("Lead tenant is required.");
  if (!name) throw new Error("Lead name is required.");
  if (!contact) throw new Error("Phone or email is required.");

  const timestamp = nowIso();
  const lead: LeadCapture = {
    id: crypto.randomUUID(),
    tenantId,
    chatId: asText(input.chatId || `${tenantId}-anonymous`, 160),
    name,
    contact,
    productPage: inferProductPage(input),
    budget: asText(input.budget, 120),
    interest: asText(input.interest, 1200),
    objection: asText(input.objection, 1200),
    conversationSummary: redactPii(asText(input.conversationSummary, 2200)),
    pageUrl: asText(input.pageContext?.url, 600),
    pageTitle: asText(input.pageContext?.title, 300),
    pagePath: asText(input.pageContext?.path, 300),
    createdAt: timestamp,
    updatedAt: timestamp,
    delivery: [],
  };

  lead.delivery = await Promise.all(
    (["email", "google_sheet", "crm"] as LeadDeliveryChannel[]).map((channel) =>
      postDeliveryWebhook(channel, lead),
    ),
  );

  const leads = await readLeads();
  leads.unshift(lead);
  await writeLeads(leads);

  return lead;
};

export const listLeadCaptures = async (tenantId?: string) => {
  const leads = await readLeads();
  const normalizedTenantId = asText(tenantId, 80);

  return leads
    .filter((lead) => !normalizedTenantId || lead.tenantId === normalizedTenantId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};
