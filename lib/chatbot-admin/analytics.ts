import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { listLeadCaptures } from "@/lib/chatbot-admin/leads";
import type { ProductCatalogResult } from "@/lib/chatbot-admin/sources";
import type { RevenueEngineDecision } from "@/lib/revenue-engine";
import { redactPii } from "@/lib/shadyy-security";

export type AnalyticsEvent = {
  id: string;
  tenantId: string;
  chatId: string;
  traceId: string;
  question: string;
  answerPreview: string;
  pageUrl: string;
  pageTitle: string;
  pagePath: string;
  salesWorkflowName: string;
  salesWorkflowLabel: string;
  buyerIntent: string;
  buyingStage: string;
  objectionType: string;
  cognitiveBias: string;
  closeType: string;
  ctaSelected: string;
  ctaLabel: string;
  ctaReason: string;
  leadTrigger: string;
  leadCaptureSuggested: boolean;
  leadCaptureReason: string;
  missedAnswer: boolean;
  productObjection: boolean;
  conversionOpportunity: boolean;
  recommendedProducts: Array<{
    name: string;
    url: string;
    price: string;
  }>;
  catalogReady: boolean;
  catalogMessage: string;
  responseMs: number;
  openAiCostUsd: number;
  langfuseStatus: "not_configured" | "sent" | "failed";
  langfuseMessage: string;
  createdAt: string;
};

export type AnalyticsInput = {
  tenantId: string;
  chatId: string;
  question: string;
  answer: string;
  pageContext?: {
    url?: string;
    title?: string;
    path?: string;
  };
  revenueEngine: RevenueEngineDecision;
  catalogSearch: {
    ok: boolean;
    message: string;
    products: ProductCatalogResult[];
  };
  responseMs: number;
  failed?: boolean;
  openAiCostUsd?: number;
};

export type AnalyticsSummary = {
  tenantId: string;
  totalChats: number;
  totalMessages: number;
  leadsCaptured: number;
  missedAnswers: number;
  productObjections: number;
  conversionOpportunities: number;
  openAiCostUsd: number;
  langfuse: {
    configured: boolean;
    sent: number;
    failed: number;
    message: string;
  };
  commonQuestions: Array<{ question: string; count: number }>;
  missedAnswerExamples: Array<{ question: string; answerPreview: string; createdAt: string }>;
  productObjectionExamples: Array<{ question: string; createdAt: string }>;
  recommendedProducts: Array<{ name: string; url: string; price: string; count: number }>;
  conversionOpportunityExamples: Array<{ question: string; workflow: string; createdAt: string }>;
  buyerStates: Array<{ name: string; count: number }>;
  salesPlaybooks: Array<{ name: string; count: number }>;
  objectionTypes: Array<{ name: string; count: number }>;
  cognitiveBiases: Array<{ name: string; count: number }>;
  closeTypes: Array<{ name: string; count: number }>;
  ctaSelections: Array<{ name: string; count: number }>;
  leadTriggers: Array<{ name: string; count: number }>;
  recentEvents: AnalyticsEvent[];
};

const dataRoot = path.join(process.cwd(), "data", "chatbot-admin");
const analyticsFile = path.join(dataRoot, "analytics-events.json");

const nowIso = () => new Date().toISOString();

const asText = (value: unknown, maxLength = 1200) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const ensureStore = async () => {
  await fs.mkdir(dataRoot, { recursive: true });

  try {
    await fs.access(analyticsFile);
  } catch {
    await fs.writeFile(analyticsFile, "[]", "utf8");
  }
};

const readAnalyticsEvents = async (): Promise<AnalyticsEvent[]> => {
  await ensureStore();
  const raw = await fs.readFile(analyticsFile, "utf8");
  return JSON.parse(raw) as AnalyticsEvent[];
};

const writeAnalyticsEvents = async (events: AnalyticsEvent[]) => {
  await ensureStore();
  await fs.writeFile(analyticsFile, JSON.stringify(events.slice(0, 2000), null, 2), "utf8");
};

const normalizeQuestion = (question: string) =>
  asText(question, 180)
    .toLowerCase()
    .replace(/[^\w\s?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isMissedAnswer = (input: AnalyticsInput) => {
  const answer = input.answer.toLowerCase();

  return (
    Boolean(input.failed) ||
    !input.answer ||
    input.revenueEngine.playbook.name === "safe_fallback" ||
    answer.includes("i could not") ||
    answer.includes("i don't know") ||
    answer.includes("not available") ||
    answer.includes("ask a human")
  );
};

const isConversionOpportunity = (input: AnalyticsInput) =>
  [
    "challenger_recommendation",
    "comparison_reframe",
    "gap_value_builder",
    "bias_reducer",
    "closing_hierarchy",
  ].includes(
    input.revenueEngine.playbook.name,
  );

const recommendedProductsFrom = (products: ProductCatalogResult[]) =>
  products.slice(0, 3).map((product) => ({
    name: asText(product.productName || product.text, 180),
    url: asText(product.productUrl, 600),
    price: asText(product.price, 120),
  }));

const incrementCount = (counts: Map<string, { name: string; count: number }>, name: string) => {
  const cleanName = asText(name || "unknown", 120);
  if (!cleanName || cleanName === "none") return;
  const current = counts.get(cleanName) ?? { name: cleanName, count: 0 };
  current.count += 1;
  counts.set(cleanName, current);
};

const langfuseBaseUrl = () =>
  (process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com").replace(/\/$/, "");

const langfuseConfigured = () =>
  Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);

const postLangfuseTrace = async (event: AnalyticsEvent) => {
  if (!langfuseConfigured()) {
    return {
      status: "not_configured" as const,
      message: "Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to send traces.",
    };
  }

  const auth = Buffer.from(
    `${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`,
  ).toString("base64");

  try {
    const response = await fetch(`${langfuseBaseUrl()}/api/public/ingestion`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batch: [
          {
            id: event.id,
            type: "trace-create",
            timestamp: event.createdAt,
            body: {
              id: event.traceId,
              name: "shadyy-chat",
              sessionId: event.chatId,
              input: event.question,
              output: event.answerPreview,
              metadata: {
                tenantId: event.tenantId,
                pageUrl: event.pageUrl,
                salesWorkflow: event.salesWorkflowName,
                buyerIntent: event.buyerIntent,
                buyingStage: event.buyingStage,
                objectionType: event.objectionType,
                cognitiveBias: event.cognitiveBias,
                closeType: event.closeType,
                ctaSelected: event.ctaSelected,
                leadTrigger: event.leadTrigger,
                leadCaptureSuggested: event.leadCaptureSuggested,
                missedAnswer: event.missedAnswer,
                productObjection: event.productObjection,
                conversionOpportunity: event.conversionOpportunity,
                recommendedProducts: event.recommendedProducts,
                responseMs: event.responseMs,
              },
              tags: ["shadyy", "conversation-analytics"],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        status: "failed" as const,
        message: `Langfuse ingestion returned ${response.status}.`,
      };
    }

    return {
      status: "sent" as const,
      message: "Sent to Langfuse ingestion API.",
    };
  } catch (error) {
    return {
      status: "failed" as const,
      message: error instanceof Error ? error.message : "Langfuse ingestion failed.",
    };
  }
};

export const recordConversationAnalytics = async (input: AnalyticsInput) => {
  const createdAt = nowIso();
  const event: AnalyticsEvent = {
    id: crypto.randomUUID(),
    tenantId: asText(input.tenantId, 80),
    chatId: asText(input.chatId, 160),
    traceId: crypto.createHash("sha256").update(`${input.chatId}:${createdAt}`).digest("hex"),
    question: redactPii(asText(input.question, 1200)),
    answerPreview: redactPii(asText(input.answer, 1800)),
    pageUrl: asText(input.pageContext?.url, 600),
    pageTitle: asText(input.pageContext?.title, 300),
    pagePath: asText(input.pageContext?.path, 300),
    salesWorkflowName: input.revenueEngine.playbook.name,
    salesWorkflowLabel: input.revenueEngine.playbook.label,
    buyerIntent: input.revenueEngine.buyerState.intent,
    buyingStage: input.revenueEngine.buyerState.buyingStage,
    objectionType: input.revenueEngine.buyerState.objection,
    cognitiveBias: input.revenueEngine.buyerState.cognitiveBias,
    closeType: input.revenueEngine.cta.closeType,
    ctaSelected: input.revenueEngine.cta.type,
    ctaLabel: input.revenueEngine.cta.label,
    ctaReason: input.revenueEngine.cta.reason,
    leadTrigger: input.revenueEngine.leadCapture.trigger,
    leadCaptureSuggested: input.revenueEngine.leadCapture.shouldCapture,
    leadCaptureReason: input.revenueEngine.leadCapture.reason,
    missedAnswer: isMissedAnswer(input),
    productObjection:
      input.revenueEngine.playbook.name === "voss_objection_loop" ||
      input.revenueEngine.buyerState.objection !== "none",
    conversionOpportunity: isConversionOpportunity(input),
    recommendedProducts: recommendedProductsFrom(input.catalogSearch.products),
    catalogReady: input.catalogSearch.ok,
    catalogMessage: asText(input.catalogSearch.message, 500),
    responseMs: Math.max(0, Math.round(input.responseMs)),
    openAiCostUsd: Number(input.openAiCostUsd ?? 0),
    langfuseStatus: "not_configured",
    langfuseMessage: "",
    createdAt,
  };

  const langfuse = await postLangfuseTrace(event);
  event.langfuseStatus = langfuse.status;
  event.langfuseMessage = langfuse.message;

  const events = await readAnalyticsEvents();
  events.unshift(event);
  await writeAnalyticsEvents(events);

  return event;
};

const topByCount = <T extends { count: number }>(items: T[], limit = 8) =>
  items.sort((first, second) => second.count - first.count).slice(0, limit);

export const getConversationAnalyticsSummary = async (
  tenantId = "shadyy",
): Promise<AnalyticsSummary> => {
  const [events, leads] = await Promise.all([
    readAnalyticsEvents(),
    listLeadCaptures(tenantId),
  ]);
  const tenantEvents = events.filter((event) => event.tenantId === tenantId);
  const uniqueChats = new Set(tenantEvents.map((event) => event.chatId));
  const questionCounts = new Map<string, { question: string; count: number }>();
  const buyerStateCounts = new Map<string, { name: string; count: number }>();
  const playbookCounts = new Map<string, { name: string; count: number }>();
  const objectionCounts = new Map<string, { name: string; count: number }>();
  const biasCounts = new Map<string, { name: string; count: number }>();
  const closeTypeCounts = new Map<string, { name: string; count: number }>();
  const ctaCounts = new Map<string, { name: string; count: number }>();
  const leadTriggerCounts = new Map<string, { name: string; count: number }>();
  const productCounts = new Map<
    string,
    { name: string; url: string; price: string; count: number }
  >();

  for (const event of tenantEvents) {
    const normalizedQuestion = normalizeQuestion(event.question);
    if (normalizedQuestion) {
      const current = questionCounts.get(normalizedQuestion) ?? {
        question: event.question,
        count: 0,
      };
      current.count += 1;
      questionCounts.set(normalizedQuestion, current);
    }

    incrementCount(buyerStateCounts, event.buyingStage || "unknown");
    incrementCount(playbookCounts, event.salesWorkflowLabel || event.salesWorkflowName);
    incrementCount(objectionCounts, event.objectionType);
    incrementCount(biasCounts, event.cognitiveBias);
    incrementCount(closeTypeCounts, event.closeType);
    incrementCount(ctaCounts, event.ctaLabel || event.ctaSelected);
    incrementCount(leadTriggerCounts, event.leadTrigger);

    for (const product of event.recommendedProducts ?? []) {
      if (!product.name) continue;
      const key = `${product.name}:${product.url}`;
      const current = productCounts.get(key) ?? { ...product, count: 0 };
      current.count += 1;
      productCounts.set(key, current);
    }
  }

  const langfuseSent = tenantEvents.filter(
    (event) => event.langfuseStatus === "sent",
  ).length;
  const langfuseFailed = tenantEvents.filter(
    (event) => event.langfuseStatus === "failed",
  ).length;

  return {
    tenantId,
    totalChats: uniqueChats.size,
    totalMessages: tenantEvents.length,
    leadsCaptured: leads.length,
    missedAnswers: tenantEvents.filter((event) => event.missedAnswer).length,
    productObjections: tenantEvents.filter((event) => event.productObjection).length,
    conversionOpportunities: tenantEvents.filter((event) => event.conversionOpportunity)
      .length,
    openAiCostUsd: tenantEvents.reduce(
      (total, event) => total + event.openAiCostUsd,
      0,
    ),
    langfuse: {
      configured: langfuseConfigured(),
      sent: langfuseSent,
      failed: langfuseFailed,
      message: langfuseConfigured()
        ? `${langfuseSent} trace${langfuseSent === 1 ? "" : "s"} sent, ${langfuseFailed} failed.`
        : "Langfuse env vars are not configured yet.",
    },
    commonQuestions: topByCount(Array.from(questionCounts.values())),
    missedAnswerExamples: tenantEvents
      .filter((event) => event.missedAnswer)
      .slice(0, 8)
      .map((event) => ({
        question: event.question,
        answerPreview: event.answerPreview,
        createdAt: event.createdAt,
      })),
    productObjectionExamples: tenantEvents
      .filter((event) => event.productObjection)
      .slice(0, 8)
      .map((event) => ({ question: event.question, createdAt: event.createdAt })),
    recommendedProducts: topByCount(Array.from(productCounts.values())),
    conversionOpportunityExamples: tenantEvents
      .filter((event) => event.conversionOpportunity)
      .slice(0, 8)
      .map((event) => ({
        question: event.question,
        workflow: event.salesWorkflowLabel,
        createdAt: event.createdAt,
      })),
    buyerStates: topByCount(Array.from(buyerStateCounts.values())),
    salesPlaybooks: topByCount(Array.from(playbookCounts.values())),
    objectionTypes: topByCount(Array.from(objectionCounts.values())),
    cognitiveBiases: topByCount(Array.from(biasCounts.values())),
    closeTypes: topByCount(Array.from(closeTypeCounts.values())),
    ctaSelections: topByCount(Array.from(ctaCounts.values())),
    leadTriggers: topByCount(Array.from(leadTriggerCounts.values())),
    recentEvents: tenantEvents.slice(0, 12),
  };
};
