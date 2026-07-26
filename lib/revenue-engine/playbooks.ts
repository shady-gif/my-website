import type {
  BuyerState,
  SalesPlaybook,
  SalesPlaybookName,
} from "@/lib/revenue-engine/types";

export type SalesPlaybookRouterInput = {
  buyerState: BuyerState;
  hasRelevantProducts?: boolean;
  missingSafeAnswer?: boolean;
  repeatedObjectionCount?: number;
};

export type SalesPlaybookRouterDecision = {
  playbook: SalesPlaybook;
  signals: string[];
};

export const salesPlaybooks: Record<SalesPlaybookName, SalesPlaybook> = {
  spin_discovery: {
    name: "spin_discovery",
    label: "Need Discovery",
    framework: "SPIN Selling",
    objective: "Clarify the buyer's situation, problem, impact, or desired payoff before recommending.",
    internalSteps: [
      "Detect what is still unclear.",
      "Choose one useful discovery angle.",
      "Ask one short question.",
      "Avoid pitching before the need is clear.",
    ],
    responseBlueprint: ["acknowledge", "one_discovery_question"],
    ctaRule: "Ask one clarifying question instead of pushing a CTA.",
    safetyRule: "Do not assume product fit until the buyer need is clearer.",
  },
  gap_value_builder: {
    name: "gap_value_builder",
    label: "Value Builder",
    framework: "Gap Selling",
    objective: "Connect the buyer's current problem to a clearer desired outcome and value bridge.",
    internalSteps: [
      "Identify current state.",
      "Identify desired state.",
      "State the gap in simple words.",
      "Bridge the gap with grounded product or service facts.",
    ],
    responseBlueprint: ["current_state", "desired_outcome", "bridge", "next_step"],
    ctaRule: "Move toward the smallest useful next step once value is clear.",
    safetyRule: "Use only known page, product, catalog, offer, and policy facts.",
  },
  challenger_recommendation: {
    name: "challenger_recommendation",
    label: "Recommendation Reframe",
    framework: "Challenger Sale",
    objective: "Teach a useful buying insight, reframe the choice, and recommend the best fit.",
    internalSteps: [
      "Teach one useful buying point.",
      "Reframe the buyer's decision around fit and outcome.",
      "Recommend the best grounded option.",
      "Control the next step without pressure.",
    ],
    responseBlueprint: ["buying_insight", "best_fit", "why", "next_step"],
    ctaRule: "Recommend one best option first, with up to three only when useful.",
    safetyRule: "Do not recommend unavailable or unknown products as if they are confirmed.",
  },
  comparison_reframe: {
    name: "comparison_reframe",
    label: "Comparison Reframe",
    framework: "Challenger Sale",
    objective: "Reduce comparison confusion and help the buyer choose between options.",
    internalSteps: [
      "Identify the compared options.",
      "Compare by buyer outcome, not feature volume.",
      "Name the best fit for each use case.",
      "Pick one winner when enough facts exist.",
    ],
    responseBlueprint: ["option_a_best_for", "option_b_best_for", "my_pick", "next_step"],
    ctaRule: "Close with the best-fit option or one narrowing question.",
    safetyRule: "Compare only products or claims present in context.",
  },
  voss_objection_loop: {
    name: "voss_objection_loop",
    label: "Objection Handler",
    framework: "Chris Voss Negotiation Loop",
    objective: "Handle hesitation without arguing or inventing claims.",
    internalSteps: [
      "Label the concern.",
      "Mirror the core hesitation in simple words.",
      "Ask one calibrated question if needed.",
      "Offer a grounded solution or safer next step.",
    ],
    responseBlueprint: ["acknowledge", "clarify_or_reframe", "grounded_solution", "next_step"],
    ctaRule: "Use a low-friction next step, such as compare, alternative, proof, callback, or one question.",
    safetyRule: "Do not invent discounts, guarantees, stock, delivery, returns, or proof.",
  },
  cialdini_evidence_selector: {
    name: "cialdini_evidence_selector",
    label: "Proof Selector",
    framework: "Cialdini Persuasion Principles",
    objective: "Choose the right proof when trust, risk, or confidence is low.",
    internalSteps: [
      "Identify what proof is missing.",
      "Prefer authority, reviews, policy, security, case study, demo, or support facts when available.",
      "Use real proof only.",
      "Offer a safer next step when proof is unavailable.",
    ],
    responseBlueprint: ["acknowledge_risk", "relevant_proof", "safe_next_step"],
    ctaRule: "Move the buyer toward proof, policy, demo, callback, or a lower-risk action.",
    safetyRule: "Never fake social proof, authority, scarcity, guarantee, or review claims.",
  },
  bias_reducer: {
    name: "bias_reducer",
    label: "Decision Simplifier",
    framework: "Decision Science",
    objective: "Reduce bias-driven friction such as choice overload, risk aversion, or decision fatigue.",
    internalSteps: [
      "Detect the likely decision bias.",
      "Remove unnecessary choices.",
      "Give one simple recommendation or risk reducer.",
      "Keep the buyer moving.",
    ],
    responseBlueprint: ["simplify_choice", "recommended_path", "next_step"],
    ctaRule: "Narrow to one or two options and ask for the next concrete preference.",
    safetyRule: "Do not manipulate urgency or create false pressure.",
  },
  closing_hierarchy: {
    name: "closing_hierarchy",
    label: "Closing Move",
    framework: "Closing Hierarchy",
    objective: "Move a ready buyer toward the correct action.",
    internalSteps: [
      "Confirm the fit in one short reason.",
      "Choose the lowest-friction close.",
      "Point to the concrete next action.",
      "Avoid adding new confusion.",
    ],
    responseBlueprint: ["fit_summary", "direct_next_action"],
    ctaRule: "Use the page or tenant CTA that matches the buyer's readiness.",
    safetyRule: "Do not pressure vulnerable or uncertain buyers.",
  },
  lead_capture: {
    name: "lead_capture",
    label: "Lead Capture",
    framework: "Shadyy Lead Qualification",
    objective: "Capture high-intent buyers who are interested but stuck.",
    internalSteps: [
      "Confirm that human follow-up would help.",
      "Ask for phone or email first.",
      "Ask for name after contact.",
      "Preserve product, budget, interest, objection, and summary context.",
    ],
    responseBlueprint: ["offer_help", "ask_contact"],
    ctaRule: "Ask for the smallest required lead detail instead of continuing to debate.",
    safetyRule: "Ask only for personal data that is useful for the follow-up.",
  },
  not_a_fit_exit: {
    name: "not_a_fit_exit",
    label: "Not A Fit Exit",
    framework: "Fit-Based Selling",
    objective: "Exit politely when the product or service is not right for the buyer.",
    internalSteps: [
      "State that this may not be the best fit.",
      "Offer a better alternative if known.",
      "Avoid forcing a sale.",
    ],
    responseBlueprint: ["not_best_fit", "better_direction", "optional_next_step"],
    ctaRule: "Offer a safer alternative or ask whether they want a different option.",
    safetyRule: "Do not push a product that does not match the buyer's stated need.",
  },
  safe_fallback: {
    name: "safe_fallback",
    label: "Safe Fallback",
    framework: "Shadyy Revenue Engine",
    objective: "Stay useful and precise when the best sales move is unclear.",
    internalSteps: [
      "Use what is known.",
      "Say what is missing.",
      "Ask one clarifying question or offer one safe next step.",
    ],
    responseBlueprint: ["known_fact", "missing_fact", "safe_next_step"],
    ctaRule: "Use a safe next step instead of guessing.",
    safetyRule: "Never invent product, pricing, policy, availability, or delivery facts.",
  },
};

const route = (
  name: SalesPlaybookName,
  signals: string[],
): SalesPlaybookRouterDecision => ({
  playbook: salesPlaybooks[name],
  signals,
});

const hasSignal = (buyerState: BuyerState, pattern: string) =>
  buyerState.signals.some((signal) => signal.toLowerCase().includes(pattern));

export const chooseSalesPlaybook = ({
  buyerState,
  hasRelevantProducts = true,
  missingSafeAnswer = false,
  repeatedObjectionCount = 0,
}: SalesPlaybookRouterInput): SalesPlaybookRouterDecision => {
  const signals = [`buyer intent: ${buyerState.intent}`];

  if (missingSafeAnswer) {
    signals.push("missing safe answer");
    return route("safe_fallback", signals);
  }

  if (hasSignal(buyerState, "not a fit")) {
    signals.push("not-a-fit signal");
    return route("not_a_fit_exit", signals);
  }

  if (
    repeatedObjectionCount >= 2 ||
    (buyerState.emotion === "frustrated" &&
      buyerState.objection !== "none" &&
      buyerState.buyingStage !== "awareness")
  ) {
    signals.push("interested but stuck");
    return route("lead_capture", signals);
  }

  if (buyerState.intent === "support") {
    signals.push("support or policy path");
    return route(buyerState.trust === "low" ? "cialdini_evidence_selector" : "safe_fallback", signals);
  }

  if (buyerState.trust === "low" || buyerState.objection === "trust") {
    signals.push("trust gap");
    return route("cialdini_evidence_selector", signals);
  }

  if (buyerState.objection !== "none") {
    signals.push(`objection: ${buyerState.objection}`);
    return route("voss_objection_loop", signals);
  }

  if (buyerState.buyingStage === "decision" || buyerState.intent === "purchase") {
    signals.push("ready buyer");
    return route("closing_hierarchy", signals);
  }

  if (buyerState.intent === "comparison") {
    signals.push("comparison request");
    return route("comparison_reframe", signals);
  }

  if (
    buyerState.cognitiveBias === "choice_overload" ||
    buyerState.cognitiveBias === "decision_fatigue" ||
    buyerState.cognitiveBias === "risk_aversion" ||
    buyerState.cognitiveBias === "anchoring" ||
    buyerState.cognitiveBias === "loss_aversion" ||
    buyerState.cognitiveBias === "status_quo"
  ) {
    signals.push(`cognitive bias: ${buyerState.cognitiveBias}`);
    return route("bias_reducer", signals);
  }

  if (buyerState.intent === "recommendation") {
    signals.push("recommendation request");
    return route(hasRelevantProducts ? "challenger_recommendation" : "spin_discovery", signals);
  }

  if (buyerState.needClarity === "unknown" || buyerState.needClarity === "partial") {
    signals.push(`need clarity: ${buyerState.needClarity}`);
    return route("spin_discovery", signals);
  }

  if (buyerState.needClarity === "known") {
    signals.push("known need");
    return route("gap_value_builder", signals);
  }

  signals.push("safe fallback route");
  return route("safe_fallback", signals);
};
