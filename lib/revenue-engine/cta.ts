import type {
  CloseType,
  CtaDecision,
  CtaType,
  RevenueEngineInput,
  SalesPlaybook,
} from "@/lib/revenue-engine/types";

type LinkLike = {
  text?: unknown;
  url?: unknown;
};

const asText = (value: unknown, maxLength = 240) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const linksFrom = (value: unknown): LinkLike[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 16).filter((item) => item && typeof item === "object") as LinkLike[];
};

const pageContextLinks = (input: RevenueEngineInput) => {
  const pageContext = (input.pageContext ?? {}) as Record<string, unknown>;
  const tenantContext = (pageContext.tenantContext ?? {}) as Record<string, unknown>;

  return [
    ...linksFrom(pageContext.ctas),
    ...linksFrom(tenantContext.actions),
  ].map((link) => ({
    text: asText(link.text).toLowerCase(),
    url: asText(link.url, 600),
  }));
};

const hasLink = (input: RevenueEngineInput, words: string[]) =>
  pageContextLinks(input).some((link) =>
    words.some((word) => link.text.includes(word) || link.url.toLowerCase().includes(word)),
  );

const decideCloseType = (playbook: SalesPlaybook): CloseType => {
  if (playbook.name === "closing_hierarchy") return "assumptive_close";
  if (playbook.name === "comparison_reframe") return "summary_close";
  if (playbook.name === "cialdini_evidence_selector") return "proof_close";
  if (playbook.name === "voss_objection_loop") return "value_close";
  if (playbook.name === "lead_capture") return "next_step_close";
  if (playbook.name === "bias_reducer") return "alternative_close";
  if (playbook.name === "safe_fallback") return "risk_reversal_close";

  return "next_step_close";
};

const decision = (
  type: CtaType,
  label: string,
  reason: string,
  requiresTenantUrl: boolean,
  closeType: CloseType,
): CtaDecision => ({
  type,
  label,
  reason,
  requiresTenantUrl,
  closeType,
});

export const chooseCtaDecision = ({
  input,
  playbook,
}: {
  input: RevenueEngineInput;
  playbook: SalesPlaybook;
}): CtaDecision => {
  const closeType = decideCloseType(playbook);

  if (playbook.name === "lead_capture") {
    return decision(
      "submit_lead",
      "Capture lead",
      "Buyer is interested but stuck, so the safest commercial step is lead capture.",
      false,
      closeType,
    );
  }

  if (playbook.name === "comparison_reframe") {
    return decision(
      "compare_options",
      "Compare options",
      "Buyer is comparing options and needs a short decision path.",
      false,
      closeType,
    );
  }

  if (playbook.name === "spin_discovery") {
    return decision(
      "ask_clarifying_question",
      "Ask one question",
      "Buyer need is unclear, so one focused question should come before a pitch.",
      false,
      closeType,
    );
  }

  if (playbook.name === "safe_fallback") {
    if (hasLink(input, ["policy", "return", "refund", "privacy", "terms"])) {
      return decision(
        "read_policy",
        "Read policy",
        "Buyer asked a policy or safety-sensitive question and a policy CTA is available.",
        true,
        closeType,
      );
    }
  }

  if (playbook.name === "safe_fallback" || playbook.name === "not_a_fit_exit") {
    return decision(
      "safe_next_step",
      "Safe next step",
      "The bot should avoid guessing and move to a safer next action.",
      false,
      closeType,
    );
  }

  if (playbook.name === "cialdini_evidence_selector") {
    if (hasLink(input, ["policy", "return", "refund", "privacy", "terms"])) {
      return decision(
        "read_policy",
        "Read policy",
        "Buyer needs proof or risk reduction and a policy CTA is available.",
        true,
        closeType,
      );
    }
    if (hasLink(input, ["demo", "book", "call"])) {
      return decision(
        "book_demo",
        "Book demo",
        "Buyer needs proof or risk reduction and a demo CTA is available.",
        true,
        closeType,
      );
    }
  }

  if (playbook.name === "closing_hierarchy") {
    if (hasLink(input, ["cart", "checkout", "buy", "order"])) {
      return decision(
        "add_to_cart",
        "Add to cart",
        "Buyer is ready and a purchase CTA is available.",
        true,
        closeType,
      );
    }
    if (hasLink(input, ["whatsapp"])) {
      return decision(
        "open_whatsapp",
        "Open WhatsApp",
        "Buyer is ready and WhatsApp is the available conversion path.",
        true,
        closeType,
      );
    }
    if (hasLink(input, ["demo", "book", "call"])) {
      return decision(
        "book_demo",
        "Book demo",
        "Buyer is ready and a demo/call CTA is available.",
        true,
        closeType,
      );
    }
  }

  if (playbook.name === "challenger_recommendation" || playbook.name === "gap_value_builder") {
    return decision(
      "view_product",
      "View product",
      "Buyer needs a grounded next step after recommendation or value building.",
      true,
      closeType,
    );
  }

  if (playbook.name === "bias_reducer") {
    return decision(
      "view_product",
      "View product",
      "Buyer needs fewer choices, so the bot should point to one clear option.",
      true,
      closeType,
    );
  }

  if (playbook.name === "voss_objection_loop") {
    return decision(
      "request_callback",
      "Request callback",
      "Buyer has a concern that may need a lower-friction human follow-up.",
      false,
      closeType,
    );
  }

  return decision(
    "safe_next_step",
    "Safe next step",
    "No stronger CTA was available from buyer state or page context.",
    false,
    closeType,
  );
};
