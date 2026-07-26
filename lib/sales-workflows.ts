import type { ProductCatalogResult } from "@/lib/chatbot-admin/sources";

export type SalesWorkflowName =
  | "need_discovery"
  | "objection_handling"
  | "comparison"
  | "recommendation"
  | "upsell_cross_sell"
  | "close_with_cta"
  | "fallback_when_unsure";

type SalesWorkflow = {
  name: SalesWorkflowName;
  label: string;
  flowiseNode: string;
  goal: string;
  instructions: string[];
  ctaRule: string;
};

type PageContext = {
  pageType?: string;
  title?: string;
  primaryHeading?: string;
  pageDescription?: string;
  visibleText?: string;
  ctas?: Array<{ text?: string; url?: string }>;
  tenantContext?: {
    productTitle?: string;
    price?: string;
    category?: string;
    searchQuery?: string;
    productCards?: Array<{ title?: string; price?: string; url?: string }>;
    actions?: Array<{ text?: string; url?: string }>;
  };
};

export type SalesWorkflowDecision = SalesWorkflow & {
  signals: string[];
};

const workflows: Record<SalesWorkflowName, SalesWorkflow> = {
  need_discovery: {
    name: "need_discovery",
    label: "Need Discovery",
    flowiseNode: "Condition Agent -> Need Discovery Agent",
    goal: "Understand what the visitor wants before pushing a product.",
    instructions: [
      "Ask one useful discovery question when the buyer intent is unclear.",
      "Use current page/category/search context to make the question specific.",
      "Keep it short, natural, and helpful like an in-store salesperson.",
      "Do not ask for information already visible in page context or catalog matches.",
    ],
    ctaRule: "Guide the visitor to the next relevant product/category only after learning the main need.",
  },
  objection_handling: {
    name: "objection_handling",
    label: "Objection Handling",
    flowiseNode: "Condition Agent -> Objection Handling Agent",
    goal: "Resolve hesitation without pressure or invented claims.",
    instructions: [
      "Acknowledge the concern plainly before recommending.",
      "Use only known catalog, policy, offer, and page facts.",
      "If the objection is price, fit, quality, availability, delivery, return, or trust, answer that exact concern first.",
      "Offer one practical alternative if the current item may not fit the buyer.",
    ],
    ctaRule: "Close with a low-friction next step such as compare, view alternative, add to cart, or ask one follow-up.",
  },
  comparison: {
    name: "comparison",
    label: "Comparison",
    flowiseNode: "Condition Agent -> Comparison Agent",
    goal: "Help the visitor choose between products quickly.",
    instructions: [
      "Compare only products found in page context or retrieved catalog results.",
      "Use a concise side-by-side explanation: best for, price, fit/use case, availability, and tradeoff.",
      "Recommend one best option when the context is sufficient.",
      "Ask one narrowing question if the products cannot be compared safely.",
    ],
    ctaRule: "End by suggesting the best next click for the recommended option.",
  },
  recommendation: {
    name: "recommendation",
    label: "Recommendation",
    flowiseNode: "Condition Agent -> Recommendation Agent",
    goal: "Recommend the best product or shortlist from the catalog.",
    instructions: [
      "Start with the best match and why it fits the stated need.",
      "Use retrieved product metadata, page context, and offers before generic advice.",
      "Give up to three options only when useful.",
      "Avoid recommending unavailable products unless clearly framed as unavailable.",
    ],
    ctaRule: "Close by inviting the buyer to view, compare, or add the best match.",
  },
  upsell_cross_sell: {
    name: "upsell_cross_sell",
    label: "Upsell/Cross-sell",
    flowiseNode: "Condition Agent -> Upsell Cross-sell Agent",
    goal: "Increase order value with genuinely relevant add-ons or upgrades.",
    instructions: [
      "Suggest an add-on, bundle, or upgrade only when it clearly complements the current item or category.",
      "Explain the benefit in one sentence.",
      "Do not distract the buyer from checkout when they are ready to purchase.",
      "If no relevant add-on exists in catalog context, skip the upsell and help them proceed.",
    ],
    ctaRule: "Offer the add-on as optional, then return to the primary buying action.",
  },
  close_with_cta: {
    name: "close_with_cta",
    label: "Close With CTA",
    flowiseNode: "Condition Agent -> Closing Agent",
    goal: "Move a ready buyer toward the next purchase action.",
    instructions: [
      "Assume helpful momentum, not pressure.",
      "Summarize the fit in one short reason.",
      "Use page CTAs or product URLs when available.",
      "If the buyer asks how to proceed, give the direct next step first.",
    ],
    ctaRule: "End with a clear CTA grounded in page/product context.",
  },
  fallback_when_unsure: {
    name: "fallback_when_unsure",
    label: "Fallback When Unsure",
    flowiseNode: "Condition Agent -> Fallback Agent",
    goal: "Stay precise when the answer cannot be grounded.",
    instructions: [
      "Say what is known from page context or retrieved products.",
      "Do not invent policies, prices, discounts, availability, or delivery timelines.",
      "Ask one clarifying question or suggest where on the page the user can continue.",
      "Keep the tone confident and helpful even when declining to guess.",
    ],
    ctaRule: "Close with a clarification question or safe next step.",
  },
};

const hasAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

export const chooseSalesWorkflow = ({
  message,
  context,
  catalogProducts,
  catalogReady,
}: {
  message: string;
  context: PageContext;
  catalogProducts: ProductCatalogResult[];
  catalogReady: boolean;
}): SalesWorkflowDecision => {
  const tenantContext = context.tenantContext ?? {};
  const text = [
    message,
    context.pageType,
    context.title,
    context.primaryHeading,
    tenantContext.productTitle,
    tenantContext.category,
    tenantContext.searchQuery,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const signals: string[] = [];

  if (!catalogReady && hasAny(text, ["price", "available", "stock", "offer", "product", "recommend", "compare"])) {
    signals.push("catalog unavailable for product-specific question");
    return { ...workflows.fallback_when_unsure, signals };
  }

  if (hasAny(text, ["compare", "vs", "versus", "difference", "better than", "which one"])) {
    signals.push("comparison language");
    return { ...workflows.comparison, signals };
  }

  if (hasAny(text, ["expensive", "costly", "not sure", "doubt", "quality", "return", "refund", "delivery", "shipping", "too much", "trust"])) {
    signals.push("buyer hesitation");
    return { ...workflows.objection_handling, signals };
  }

  if (hasAny(text, ["recommend", "suggest", "best", "which", "find", "looking for", "need", "want"])) {
    signals.push("recommendation intent");
    return { ...workflows.recommendation, signals };
  }

  if (
    context.pageType === "cart" ||
    context.pageType === "checkout" ||
    hasAny(text, ["cart", "checkout", "buy", "purchase", "order", "payment", "add to cart"])
  ) {
    signals.push("purchase momentum");
    return { ...workflows.close_with_cta, signals };
  }

  if (
    context.pageType === "product" &&
    catalogProducts.length > 0 &&
    hasAny(text, ["also", "with this", "bundle", "accessory", "complete"])
  ) {
    signals.push("complementary product opportunity");
    return { ...workflows.upsell_cross_sell, signals };
  }

  signals.push("intent unclear");
  return { ...workflows.need_discovery, signals };
};

export const buildSalesWorkflowPrompt = (decision: SalesWorkflowDecision) =>
  [
    `Active Flowise sales workflow node: ${decision.flowiseNode}`,
    `Workflow: ${decision.label}`,
    `Goal: ${decision.goal}`,
    "Instructions:",
    ...decision.instructions.map((instruction) => `- ${instruction}`),
    `CTA rule: ${decision.ctaRule}`,
    "Never fabricate product facts, prices, availability, offers, delivery details, or policies.",
  ].join("\n");

export const getFlowiseSalesWorkflowNodes = () =>
  Object.values(workflows).map((workflow) => ({
    node: workflow.flowiseNode,
    workflow: workflow.name,
    label: workflow.label,
    goal: workflow.goal,
    instructions: workflow.instructions,
    ctaRule: workflow.ctaRule,
  }));
