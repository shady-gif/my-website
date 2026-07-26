import { chooseSalesPlaybook } from "@/lib/revenue-engine/playbooks";
import type {
  BuyerState,
  SalesPlaybookName,
} from "@/lib/revenue-engine/types";

const baseBuyerState: BuyerState = {
  intent: "information",
  buyingStage: "awareness",
  needClarity: "unknown",
  trust: "medium",
  urgency: "low",
  risk: "medium",
  budget: "unknown",
  emotion: "curious",
  authority: "unknown",
  objection: "none",
  cognitiveBias: "none",
  signals: ["fixture"],
};

export type SalesPlaybookRouterFixture = {
  name: string;
  buyerState: BuyerState;
  expectedPlaybook: SalesPlaybookName;
  repeatedObjectionCount?: number;
  hasRelevantProducts?: boolean;
  missingSafeAnswer?: boolean;
};

export const salesPlaybookRouterFixtures: SalesPlaybookRouterFixture[] = [
  {
    name: "need unclear routes to SPIN",
    buyerState: {
      ...baseBuyerState,
      needClarity: "unknown",
    },
    expectedPlaybook: "spin_discovery",
  },
  {
    name: "known need routes to Gap Selling",
    buyerState: {
      ...baseBuyerState,
      needClarity: "known",
    },
    expectedPlaybook: "gap_value_builder",
  },
  {
    name: "recommendation routes to Challenger",
    buyerState: {
      ...baseBuyerState,
      intent: "recommendation",
      buyingStage: "consideration",
      needClarity: "known",
    },
    expectedPlaybook: "challenger_recommendation",
  },
  {
    name: "comparison routes to comparison reframe",
    buyerState: {
      ...baseBuyerState,
      intent: "comparison",
      buyingStage: "consideration",
      cognitiveBias: "choice_overload",
    },
    expectedPlaybook: "comparison_reframe",
  },
  {
    name: "price objection routes to Voss",
    buyerState: {
      ...baseBuyerState,
      intent: "purchase",
      buyingStage: "consideration",
      objection: "price",
      risk: "high",
      cognitiveBias: "loss_aversion",
    },
    expectedPlaybook: "voss_objection_loop",
  },
  {
    name: "trust gap routes to Cialdini",
    buyerState: {
      ...baseBuyerState,
      buyingStage: "consideration",
      trust: "low",
      objection: "trust",
      risk: "high",
    },
    expectedPlaybook: "cialdini_evidence_selector",
  },
  {
    name: "ready buyer routes to closing",
    buyerState: {
      ...baseBuyerState,
      intent: "purchase",
      buyingStage: "decision",
      trust: "high",
      risk: "low",
    },
    expectedPlaybook: "closing_hierarchy",
  },
  {
    name: "repeated objection routes to lead capture",
    buyerState: {
      ...baseBuyerState,
      buyingStage: "consideration",
      objection: "price",
      emotion: "frustrated",
    },
    repeatedObjectionCount: 2,
    expectedPlaybook: "lead_capture",
  },
  {
    name: "not a fit signal routes to polite exit",
    buyerState: {
      ...baseBuyerState,
      signals: ["not a fit signal"],
    },
    expectedPlaybook: "not_a_fit_exit",
  },
];

export const runSalesPlaybookRouterFixtures = () =>
  salesPlaybookRouterFixtures.map((fixture) => {
    const decision = chooseSalesPlaybook({
      buyerState: fixture.buyerState,
      repeatedObjectionCount: fixture.repeatedObjectionCount,
      hasRelevantProducts: fixture.hasRelevantProducts,
      missingSafeAnswer: fixture.missingSafeAnswer,
    });

    return {
      name: fixture.name,
      expectedPlaybook: fixture.expectedPlaybook,
      actualPlaybook: decision.playbook.name,
      passed: decision.playbook.name === fixture.expectedPlaybook,
      signals: decision.signals,
    };
  });
