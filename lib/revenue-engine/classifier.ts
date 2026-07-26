import type {
  BuyerAuthority,
  BuyerEmotion,
  BuyerIntent,
  BuyerState,
  BuyingStage,
  BudgetSignal,
  CognitiveBias,
  NeedClarity,
  ObjectionType,
  RevenueEngineInput,
  SignalStrength,
} from "@/lib/revenue-engine/types";

const asText = (value: unknown, maxLength = 1200) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const contextText = (value: unknown): string => {
  if (!value || typeof value !== "object") return asText(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => contextText(item))
      .filter(Boolean)
      .join(" ");
  }

  return Object.entries(value as Record<string, unknown>)
    .filter(
      ([key]) =>
        ![
          "url",
          "href",
          "src",
          "image",
          "logo",
          "ctas",
          "links",
          "actions",
          "productcards",
        ].includes(key.toLowerCase()),
    )
    .slice(0, 24)
    .map(([, entryValue]) => contextText(entryValue))
    .filter(Boolean)
    .join(" ");
};

const buildClassifierText = (input: RevenueEngineInput) =>
  [
    input.message,
    contextText(input.pageContext),
    contextText(input.productContext),
    contextText(input.previousTurns?.slice(-4)),
  ]
    .map((value) => asText(value, 1600).toLowerCase())
    .filter(Boolean)
    .join(" ");

const hasAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

const add = (signals: string[], signal: string) => {
  if (!signals.includes(signal)) signals.push(signal);
};

const words = {
  comparison: [
    "compare",
    " vs ",
    "versus",
    "difference",
    "better than",
    "which one",
    "which is better",
    "option a",
    "option b",
  ],
  purchase: [
    "buy",
    "purchase",
    "order",
    "checkout",
    "cart",
    "payment",
    "add to cart",
    "book",
    "sign up",
    "start now",
    "ready",
  ],
  recommendation: [
    "recommend",
    "suggest",
    "best",
    "which",
    "find",
    "looking for",
    "need",
    "want",
    "choose",
    "pick",
  ],
  support: [
    "support",
    "help",
    "return",
    "refund",
    "shipping",
    "delivery",
    "warranty",
    "policy",
    "cancel",
    "track",
    "issue",
  ],
  price: [
    "expensive",
    "costly",
    "too much",
    "price",
    "cost",
    "budget",
    "cheap",
    "affordable",
    "discount",
    "deal",
    "overpriced",
  ],
  trust: [
    "trust",
    "legit",
    "real",
    "safe",
    "secure",
    "reviews",
    "testimonial",
    "proof",
    "guarantee",
    "scam",
    "authentic",
  ],
  timing: [
    "later",
    "not now",
    "next month",
    "next week",
    "soon",
    "timeline",
    "delay",
    "wait",
    "maybe later",
  ],
  competitor: [
    "competitor",
    "alternative",
    "instead of",
    "mailchimp",
    "hubspot",
    "shopify",
    "amazon",
  ],
  statusQuo: [
    "currently use",
    "already use",
    "current setup",
    "existing",
    "switch",
    "change",
    "migrate",
  ],
  technical: [
    "integrate",
    "integration",
    "api",
    "technical",
    "setup",
    "install",
    "bug",
    "error",
    "not working",
  ],
  urgencyHigh: ["urgent", "asap", "today", "now", "immediately", "right away", "tonight"],
  urgencyMedium: ["soon", "this week", "next week", "this month", "timeline"],
  frustration: [
    "frustrated",
    "annoying",
    "confusing",
    "confused",
    "stuck",
    "problem",
    "issue",
    "not working",
    "hate",
  ],
  skeptical: ["not sure", "doubt", "concern", "worried", "risk", "trust", "expensive"],
  excited: ["love", "great", "perfect", "awesome", "excited", "nice"],
  confident: ["ready", "buy", "order", "checkout", "go ahead", "let's do it"],
  decisionMaker: ["i decide", "my decision", "owner", "founder", "ceo", "manager", "i approve"],
  researcher: ["researching", "looking into", "exploring", "shortlist", "for my boss", "for my team"],
};

const classifyIntent = (text: string, signals: string[]): BuyerIntent => {
  if (hasAny(text, words.comparison)) {
    add(signals, "comparison intent");
    return "comparison";
  }
  if (hasAny(text, words.support.filter((word) => word !== "help"))) {
    add(signals, "support intent");
    return "support";
  }
  if (hasAny(text, words.purchase) || hasAny(text, words.price)) {
    add(signals, "purchase intent");
    return "purchase";
  }
  if (hasAny(text, words.recommendation)) {
    add(signals, "recommendation intent");
    return "recommendation";
  }
  add(signals, "information intent fallback");
  return "information";
};

const classifyObjection = (text: string, signals: string[]): ObjectionType => {
  if (hasAny(text, words.price)) {
    add(signals, "price objection signal");
    return "price";
  }
  if (hasAny(text, words.trust)) {
    add(signals, "trust objection signal");
    return "trust";
  }
  if (hasAny(text, words.timing)) {
    add(signals, "timing objection signal");
    return "timing";
  }
  if (hasAny(text, words.competitor)) {
    add(signals, "competitor objection signal");
    return "competitor";
  }
  if (hasAny(text, words.statusQuo)) {
    add(signals, "status quo objection signal");
    return "status_quo";
  }
  if (hasAny(text, words.technical)) {
    add(signals, "technical objection signal");
    return "technical";
  }
  if (hasAny(text, ["return", "refund", "shipping", "delivery", "warranty", "policy"])) {
    add(signals, "policy objection signal");
    return "policy";
  }
  if (hasAny(text, ["do i need", "worth it", "necessary", "not needed"])) {
    add(signals, "need objection signal");
    return "need";
  }
  if (hasAny(text, ["not a fit", "not for me", "doesn't fit", "does not fit", "wrong for me"])) {
    add(signals, "not a fit signal");
    return "need";
  }

  return "none";
};

const classifyBuyingStage = (
  text: string,
  intent: BuyerIntent,
  objection: ObjectionType,
  signals: string[],
): BuyingStage => {
  if (hasAny(text, words.purchase) || hasAny(text, ["checkout", "cart", "ready", "buy now"])) {
    add(signals, "decision stage signal");
    return "decision";
  }
  if (intent === "comparison" || intent === "recommendation" || objection !== "none") {
    add(signals, "consideration stage signal");
    return "consideration";
  }

  return "awareness";
};

const classifyNeedClarity = (text: string, input: RevenueEngineInput, signals: string[]): NeedClarity => {
  if (
    contextText(input.productContext).length > 0 ||
    (input.catalogResults?.length ?? 0) > 0 ||
    hasAny(text, ["for running", "for work", "for daily", "for business", "for my team", "i need"])
  ) {
    add(signals, "known need signal");
    return "known";
  }
  if (hasAny(text, words.recommendation) || hasAny(text, ["not sure", "help me choose", "which"])) {
    add(signals, "partial need signal");
    return "partial";
  }

  return "unknown";
};

const classifySignalStrengths = (
  text: string,
  intent: BuyerIntent,
  objection: ObjectionType,
): Pick<BuyerState, "trust" | "urgency" | "risk"> => {
  const trust: SignalStrength = hasAny(text, words.trust)
    ? "low"
    : intent === "purchase"
      ? "high"
      : "medium";

  const urgency: SignalStrength = hasAny(text, words.urgencyHigh)
    ? "high"
    : hasAny(text, words.urgencyMedium) || intent === "purchase"
      ? "medium"
      : "low";

  const risk: SignalStrength =
    objection !== "none" || hasAny(text, ["risk", "worried", "concern", "refund", "guarantee"])
      ? "high"
      : intent === "purchase"
        ? "low"
        : "medium";

  return { trust, urgency, risk };
};

const classifyBudget = (text: string, objection: ObjectionType, signals: string[]): BudgetSignal => {
  if (objection === "price" || hasAny(text, ["cheap", "affordable", "budget", "lower price"])) {
    add(signals, "low budget signal");
    return "low";
  }
  if (hasAny(text, ["premium", "best quality", "top option", "no budget", "highest quality"])) {
    add(signals, "high budget signal");
    return "high";
  }
  if (hasAny(text, ["value", "mid range", "reasonable", "worth it"])) {
    add(signals, "medium budget signal");
    return "medium";
  }

  return "unknown";
};

const classifyEmotion = (text: string): BuyerEmotion => {
  if (hasAny(text, words.frustration)) return "frustrated";
  if (hasAny(text, words.skeptical)) return "skeptical";
  if (hasAny(text, words.confident)) return "confident";
  if (hasAny(text, words.excited)) return "excited";

  return "curious";
};

const classifyAuthority = (text: string): BuyerAuthority => {
  if (hasAny(text, words.decisionMaker)) return "decision_maker";
  if (hasAny(text, words.researcher)) return "researcher";
  if (hasAny(text, ["recommend to", "send to", "share with", "for approval"])) return "influencer";

  return "unknown";
};

const classifyBias = (
  text: string,
  intent: BuyerIntent,
  objection: ObjectionType,
  risk: SignalStrength,
  signals: string[],
): CognitiveBias => {
  if (objection === "price" || hasAny(text, ["lose", "waste", "pay back", "worth it"])) {
    add(signals, "loss aversion signal");
    return "loss_aversion";
  }
  if (objection === "status_quo") {
    add(signals, "status quo bias signal");
    return "status_quo";
  }
  if (intent === "comparison" || hasAny(text, ["too many", "overwhelmed", "many options", "can't choose"])) {
    add(signals, "choice overload signal");
    return "choice_overload";
  }
  if (risk === "high" || hasAny(text, ["safe", "guarantee", "refund", "risk"])) {
    add(signals, "risk aversion signal");
    return "risk_aversion";
  }
  if (hasAny(text, ["cheaper elsewhere", "saw it for", "other price", "anchored"])) {
    add(signals, "anchoring signal");
    return "anchoring";
  }
  if (hasAny(text, ["tired", "spent weeks", "too much research", "many demos"])) {
    add(signals, "decision fatigue signal");
    return "decision_fatigue";
  }

  return "none";
};

export const classifyBuyerState = (input: RevenueEngineInput): BuyerState => {
  const text = buildClassifierText(input);
  const signals: string[] = [];
  const intent = classifyIntent(text, signals);
  const objection = classifyObjection(text, signals);
  const buyingStage = classifyBuyingStage(text, intent, objection, signals);
  const needClarity = classifyNeedClarity(text, input, signals);
  const { trust, urgency, risk } = classifySignalStrengths(text, intent, objection);
  const budget = classifyBudget(text, objection, signals);
  const emotion = classifyEmotion(text);
  const authority = classifyAuthority(text);
  const cognitiveBias = classifyBias(text, intent, objection, risk, signals);

  if (signals.length === 0) add(signals, "safe default classification");

  return {
    intent,
    buyingStage,
    needClarity,
    trust,
    urgency,
    risk,
    budget,
    emotion,
    authority,
    objection,
    cognitiveBias,
    signals,
  };
};
