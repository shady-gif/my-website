import type {
  LeadCaptureDecision,
  LeadCaptureTrigger,
  RevenueEngineInput,
  SalesPlaybook,
} from "@/lib/revenue-engine/types";

const asText = (value: unknown, maxLength = 4000) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const contextText = (value: unknown): string => {
  if (!value || typeof value !== "object") return asText(value);
  if (Array.isArray(value)) return value.slice(0, 8).map(contextText).join(" ");

  return Object.entries(value as Record<string, unknown>)
    .slice(0, 24)
    .map(([, entryValue]) => contextText(entryValue))
    .join(" ");
};

const hasAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

const requiredFields: LeadCaptureDecision["requiredFields"] = [
  "name",
  "phone_or_email",
  "product_or_page",
  "budget",
  "interest",
  "objection",
  "conversation_summary",
];

const capture = (
  trigger: LeadCaptureTrigger,
  reason: string,
): LeadCaptureDecision => ({
  shouldCapture: true,
  trigger,
  reason,
  requiredFields,
});

export const chooseLeadCaptureDecision = ({
  input,
  playbook,
}: {
  input: RevenueEngineInput;
  playbook: SalesPlaybook;
}): LeadCaptureDecision => {
  const text = [
    input.message,
    contextText(input.pageContext),
    contextText(input.productContext),
    contextText(input.previousTurns?.slice(-4)),
  ]
    .join(" ")
    .toLowerCase();

  if (input.missingSafeAnswer) {
    return capture(
      "missing_safe_answer",
      "The bot cannot safely answer from available facts, so human confirmation is useful.",
    );
  }

  if (hasAny(text, ["callback", "call me", "contact me", "talk to someone", "speak to someone"])) {
    return capture(
      "callback_request",
      "Buyer directly asked for contact or callback.",
    );
  }

  if (Number(input.repeatedObjectionCount ?? 0) >= 2 || playbook.name === "lead_capture") {
    return capture(
      "repeated_objection",
      "Buyer has repeated hesitation and should be routed to follow-up.",
    );
  }

  if (hasAny(text, ["quote", "custom price", "custom pricing", "proposal", "estimate"])) {
    return capture(
      "custom_price_or_quote",
      "Buyer asked for custom price, quote, proposal, or estimate.",
    );
  }

  if (hasAny(text, ["confirm", "human", "agent", "representative", "real person"])) {
    return capture(
      "human_confirmation_needed",
      "Buyer needs human confirmation before moving forward.",
    );
  }

  if (hasAny(text, ["budget", "timeline", "next week", "next month", "this week", "this month"])) {
    return capture(
      "budget_or_timeline_shared",
      "Buyer shared budget or timeline, which is useful for qualification.",
    );
  }

  if (
    hasAny(text, ["confused", "stuck", "not sure", "interested"]) &&
    hasAny(text, ["buy", "price", "recommend", "option", "demo", "call"])
  ) {
    return capture(
      "confused_but_interested",
      "Buyer appears interested but unsure.",
    );
  }

  if (
    playbook.name === "comparison_reframe" &&
    hasAny(text, ["premium", "expensive", "enterprise", "high value", "proposal"])
  ) {
    return capture(
      "high_value_comparison",
      "Buyer is comparing high-value options.",
    );
  }

  return {
    shouldCapture: false,
    trigger: "none",
    reason: "No hardcoded lead capture trigger matched.",
    requiredFields,
  };
};
