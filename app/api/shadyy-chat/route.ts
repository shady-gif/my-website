import { NextResponse, type NextRequest } from "next/server";
import {
  searchProductCatalog,
  type ProductCatalogFilters,
  type ProductCatalogResult,
} from "@/lib/chatbot-admin/sources";
import { recordConversationAnalytics } from "@/lib/chatbot-admin/analytics";
import {
  buildResponseContractPrompt,
  buildRevenueEnginePrompt,
  createRevenueEngineDecision,
  type RevenueEngineDecision,
} from "@/lib/revenue-engine";
import {
  enforceRateLimit,
  looksLikePromptLeakAttempt,
  preflightResponse,
  redactPii,
  requireTenantAccess,
  sanitizeAssistantText,
  securityGuardrailPrompt,
} from "@/lib/shadyy-security";

export const runtime = "nodejs";

type PageContext = Record<string, unknown> & {
  tenantId?: string;
  url?: string;
  path?: string;
  title?: string;
  pageType?: string;
  primaryHeading?: string;
  pageDescription?: string;
  visibleText?: string;
  links?: LinkItem[];
  ctas?: LinkItem[];
  tenantContext?: {
    tenantId?: string;
    productTitle?: string;
    price?: string;
    category?: string;
    searchQuery?: string;
    productCards?: ProductCard[];
    actions?: LinkItem[];
  };
};

type LinkItem = {
  text?: string;
  url?: string;
};

type ProductCard = {
  title?: string;
  price?: string;
  url?: string;
};

const asText = (value: unknown, maxLength = 4000) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const safeJson = (value: unknown, maxLength = 12000) => {
  try {
    return redactPii(JSON.stringify(value ?? null)).slice(0, maxLength);
  } catch {
    return "null";
  }
};

const summarizeLinks = (items: LinkItem[] | undefined) =>
  (items ?? [])
    .filter((item) => item?.text || item?.url)
    .slice(0, 12)
    .map((item) => {
      const text = asText(item.text, 120);
      const url = asText(item.url, 240);
      return url ? `${text} -> ${url}` : text;
    })
    .join("\n");

const summarizeCatalogProducts = (products: ProductCatalogResult[]) =>
  products
    .slice(0, 5)
    .map((product, index) => {
      const details = [
        product.productName ? `Name: ${product.productName}` : "",
        product.category ? `Category: ${product.category}` : "",
        product.brand ? `Brand: ${product.brand}` : "",
        product.size ? `Size: ${product.size}` : "",
        product.availability ? `Availability: ${product.availability}` : "",
        product.price ? `Price: ${product.price}` : "",
        product.offers ? `Offers: ${product.offers}` : "",
        product.productUrl ? `URL: ${product.productUrl}` : "",
        product.description ? `Description: ${product.description}` : "",
      ].filter(Boolean);

      return `Product ${index + 1}\n${details.join("\n")}`;
    })
    .join("\n\n");

const catalogFiltersFromContext = (context: PageContext): ProductCatalogFilters => {
  const tenantContext = context.tenantContext ?? {};
  const filters: ProductCatalogFilters = {};

  if (tenantContext.category) filters.category = asText(tenantContext.category, 200);
  if (context.pageType === "product" && context.url) {
    filters.productUrl = asText(context.url, 600);
  }

  return filters;
};

const catalogSearchQueryFromContext = (message: string, context: PageContext) => {
  const tenantContext = context.tenantContext ?? {};
  return [
    message,
    tenantContext.productTitle,
    tenantContext.category,
    tenantContext.searchQuery,
    context.primaryHeading,
    context.pageTitle,
    context.pageDescription,
    (tenantContext.productCards ?? [])
      .slice(0, 8)
      .map((card) => [card.title, card.price].filter(Boolean).join(" "))
      .join(" "),
  ]
    .map((value) => asText(value, 500))
    .filter(Boolean)
    .join("\n");
};

const buildFlowiseQuestion = (
  message: string,
  catalogProducts: ProductCatalogResult[],
  revenueEngine: RevenueEngineDecision,
) => {
  const sections = [
    redactPii(message),
    securityGuardrailPrompt,
    buildRevenueEnginePrompt(revenueEngine),
  ];

  if (catalogProducts.length > 0) {
    sections.push(
      "Relevant catalog matches retrieved by Shadyy:",
      summarizeCatalogProducts(catalogProducts),
      "Answer using these catalog matches when they are relevant. Do not invent price, availability, offers, or product links that are not present above.",
    );
  }

  return sections.join("\n\n");
};

const contextToVars = (
  context: PageContext,
  catalogSearch: {
    ok: boolean;
    message: string;
    products: ProductCatalogResult[];
  },
  revenueEngine: RevenueEngineDecision,
) => {
  const tenantContext = context.tenantContext ?? {};

  return {
    tenant_id: asText(context.tenantId || tenantContext.tenantId || "shadyy", 80),
    page_url: asText(context.url, 600),
    page_path: asText(context.path, 300),
    page_title: asText(context.title, 300),
    page_type: asText(context.pageType, 120),
    page_heading: asText(context.primaryHeading, 300),
    page_description: asText(context.pageDescription, 600),
    page_visible_text: redactPii(asText(context.visibleText, 2500)),
    page_links_summary: summarizeLinks(context.links),
    page_links_json: safeJson(context.links, 8000),
    page_ctas_summary: summarizeLinks(context.ctas),
    page_ctas_json: safeJson(context.ctas, 8000),
    tenant_product_title: asText(tenantContext.productTitle, 300),
    tenant_product_price: asText(tenantContext.price, 120),
    tenant_category: asText(tenantContext.category, 200),
    tenant_search_query: asText(tenantContext.searchQuery, 200),
    tenant_product_cards_json: safeJson(tenantContext.productCards, 8000),
    tenant_actions_summary: summarizeLinks(tenantContext.actions),
    tenant_actions_json: safeJson(tenantContext.actions, 8000),
    catalog_search_status: catalogSearch.ok ? "ready" : "unavailable",
    catalog_search_message: asText(catalogSearch.message, 500),
    catalog_products_summary: summarizeCatalogProducts(catalogSearch.products),
    catalog_products_json: safeJson(catalogSearch.products, 12000),
    revenue_engine_version: revenueEngine.engineVersion,
    revenue_buyer_intent: revenueEngine.buyerState.intent,
    revenue_buying_stage: revenueEngine.buyerState.buyingStage,
    revenue_need_clarity: revenueEngine.buyerState.needClarity,
    revenue_trust: revenueEngine.buyerState.trust,
    revenue_urgency: revenueEngine.buyerState.urgency,
    revenue_risk: revenueEngine.buyerState.risk,
    revenue_budget: revenueEngine.buyerState.budget,
    revenue_emotion: revenueEngine.buyerState.emotion,
    revenue_authority: revenueEngine.buyerState.authority,
    revenue_objection: revenueEngine.buyerState.objection,
    revenue_cognitive_bias: revenueEngine.buyerState.cognitiveBias,
    revenue_buyer_signals: revenueEngine.buyerState.signals.join(", "),
    revenue_playbook_name: revenueEngine.playbook.name,
    revenue_playbook_label: revenueEngine.playbook.label,
    revenue_playbook_objective: revenueEngine.playbook.objective,
    revenue_playbook_blueprint: revenueEngine.playbook.responseBlueprint.join(" -> "),
    revenue_cta_type: revenueEngine.cta.type,
    revenue_cta_label: revenueEngine.cta.label,
    revenue_cta_reason: revenueEngine.cta.reason,
    revenue_close_type: revenueEngine.cta.closeType,
    revenue_lead_should_capture: revenueEngine.leadCapture.shouldCapture ? "true" : "false",
    revenue_lead_trigger: revenueEngine.leadCapture.trigger,
    revenue_lead_reason: revenueEngine.leadCapture.reason,
    revenue_response_contract: buildResponseContractPrompt({
      contract: revenueEngine.responseContract,
      playbook: revenueEngine.playbook,
    }),
    revenue_engine_json: safeJson(revenueEngine, 12000),
    page_context_json: safeJson(context, 12000),
  };
};

const getFlowiseText = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "";

  const data = payload as Record<string, unknown>;
  return asText(data.text || data.answer || data.response || data.output, 8000);
};

const getOpenAiCost = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return 0;

  const data = payload as Record<string, unknown>;
  const usage = data.usage as Record<string, unknown> | undefined;
  const cost =
    data.totalCost ||
    data.cost ||
    usage?.totalCost ||
    usage?.cost ||
    usage?.total_cost;
  const parsed = Number(cost);

  return Number.isFinite(parsed) ? parsed : 0;
};

const needsSafeAnswerFromCatalog = (message: string, context: PageContext) => {
  const text = [
    message,
    context.pageType,
    context.title,
    context.primaryHeading,
    context.tenantContext?.productTitle,
    context.tenantContext?.price,
    context.tenantContext?.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "price",
    "available",
    "availability",
    "stock",
    "return",
    "refund",
    "shipping",
    "delivery",
    "warranty",
    "policy",
    "discount",
    "offer",
    "recommend",
    "compare",
  ].some((word) => text.includes(word));
};

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}

export async function POST(request: NextRequest) {
  let body: {
    tenantId?: string;
    chatId?: string;
    message?: string;
    context?: PageContext;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ text: "Send a valid chat message." }, { status: 400 });
  }

  const tenantId = asText(body.tenantId || body.context?.tenantId || "shadyy", 80);
  const security = requireTenantAccess(request, tenantId);
  const message = asText(body.message, 4000);
  const chatId = asText(body.chatId || `${tenantId}-anonymous`, 160);

  if (!security.ok) return security.response;

  const rate = enforceRateLimit(request, {
    keyPrefix: "chat",
    tenantId,
    limit: Number(process.env.SHADYY_CHAT_RATE_LIMIT ?? 30),
    windowMs: 60_000,
  });
  if (!rate.ok) return rate.response;

  const tenant = security.tenant;
  const responseHeaders = { ...security.headers, ...rate.headers };
  const startedAt = Date.now();
  const context = body.context ?? {};

  if (!message) {
    return NextResponse.json(
      { text: "I could not start this chat session yet." },
      { status: 400, headers: responseHeaders },
    );
  }

  if (looksLikePromptLeakAttempt(message)) {
    return NextResponse.json(
      {
        text:
          "I cannot share internal prompts, API keys, Flowise details, or hidden configuration. I can still help with the page, product, policy, or a callback request.",
        chatId,
      },
      { headers: responseHeaders },
    );
  }

  try {
    const catalogSearch = await searchProductCatalog({
      tenantId,
      query: catalogSearchQueryFromContext(message, context),
      filters: catalogFiltersFromContext(context),
      limit: Number(process.env.SHADYY_CATALOG_SEARCH_LIMIT ?? 5),
    }).catch((error) => ({
      ok: false,
      message: error instanceof Error ? error.message : "Catalog retrieval failed.",
      products: [] as ProductCatalogResult[],
    }));

    const revenueEngine = createRevenueEngineDecision({
      tenantId,
      message,
      chatId,
      pageContext: context,
      productContext: context.tenantContext,
      catalogResults: catalogSearch.products,
      missingSafeAnswer: !catalogSearch.ok && needsSafeAnswerFromCatalog(message, context),
    });

    const flowiseResponse = await fetch(
      `${tenant.flowise.apiHost}/api/v1/prediction/${tenant.flowise.chatflowId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: buildFlowiseQuestion(message, catalogSearch.products, revenueEngine),
          chatId,
          overrideConfig: {
            sessionId: chatId,
            vars: contextToVars(context, catalogSearch, revenueEngine),
          },
        }),
      },
    );

    if (!flowiseResponse.ok) {
      throw new Error(`Flowise request failed: ${flowiseResponse.status}`);
    }

    const data = await flowiseResponse.json();
    const text = sanitizeAssistantText(getFlowiseText(data));
    const answer =
      text ||
      "I could not answer that from the current page context yet.";

    await recordConversationAnalytics({
      tenantId,
      chatId,
      question: message,
      answer,
      pageContext: context,
      revenueEngine,
      catalogSearch,
      responseMs: Date.now() - startedAt,
      openAiCostUsd: getOpenAiCost(data),
    }).catch((error) => {
      console.error(error instanceof Error ? error.message : "Analytics logging failed.");
    });

    return NextResponse.json(
      {
        text: answer,
        chatId,
        cta: revenueEngine.cta,
        leadCapture: revenueEngine.leadCapture,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Shadyy chat failed.");
    const fallbackRevenueEngine = createRevenueEngineDecision({
      tenantId,
      message,
      chatId,
      pageContext: context,
      productContext: context.tenantContext,
      catalogResults: [],
      missingSafeAnswer: true,
    });
    await recordConversationAnalytics({
      tenantId,
      chatId,
      question: message,
      answer: "I could not reach the Shadyy assistant right now.",
      pageContext: context,
      revenueEngine: fallbackRevenueEngine,
      catalogSearch: {
        ok: false,
        message: "Flowise request failed.",
        products: [],
      },
      responseMs: Date.now() - startedAt,
      failed: true,
    }).catch((analyticsError) => {
      console.error(
        analyticsError instanceof Error
          ? analyticsError.message
          : "Analytics logging failed.",
      );
    });

    return NextResponse.json(
      { text: "I could not reach the Shadyy assistant right now.", chatId },
      { status: 502, headers: responseHeaders },
    );
  }
}
