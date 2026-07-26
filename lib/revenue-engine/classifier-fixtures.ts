import { classifyBuyerState } from "@/lib/revenue-engine/classifier";
import type { BuyerState, RevenueEngineInput } from "@/lib/revenue-engine/types";

type BuyerStateExpectation = Partial<
  Pick<
    BuyerState,
    | "intent"
    | "buyingStage"
    | "needClarity"
    | "trust"
    | "urgency"
    | "risk"
    | "budget"
    | "emotion"
    | "authority"
    | "objection"
    | "cognitiveBias"
  >
>;

export type BuyerStateFixture = {
  name: string;
  input: RevenueEngineInput;
  expected: BuyerStateExpectation;
};

export const buyerStateClassifierFixtures: BuyerStateFixture[] = [
  {
    name: "price objection",
    input: {
      tenantId: "fixture",
      message: "This seems expensive.",
      pageContext: { pageType: "product", title: "Premium plan" },
    },
    expected: {
      intent: "purchase",
      buyingStage: "consideration",
      objection: "price",
      risk: "high",
      budget: "low",
      cognitiveBias: "loss_aversion",
      emotion: "skeptical",
    },
  },
  {
    name: "recommendation request",
    input: {
      tenantId: "fixture",
      message: "Can you recommend the best running shoe for daily use?",
      pageContext: { pageType: "category", title: "Running shoes" },
      catalogResults: [{ productName: "Daily Runner" }],
    },
    expected: {
      intent: "recommendation",
      buyingStage: "consideration",
      needClarity: "known",
    },
  },
  {
    name: "comparison request",
    input: {
      tenantId: "fixture",
      message: "Which one is better, option A vs option B?",
      productContext: { productTitle: "Option A", category: "CRM" },
    },
    expected: {
      intent: "comparison",
      buyingStage: "consideration",
      cognitiveBias: "choice_overload",
    },
  },
  {
    name: "purchase intent",
    input: {
      tenantId: "fixture",
      message: "I am ready to buy. How do I checkout?",
      pageContext: { pageType: "cart" },
    },
    expected: {
      intent: "purchase",
      buyingStage: "decision",
      trust: "high",
      emotion: "confident",
    },
  },
  {
    name: "trust concern",
    input: {
      tenantId: "fixture",
      message: "Is this legit? I need proof before I order.",
    },
    expected: {
      objection: "trust",
      trust: "low",
      risk: "high",
      emotion: "skeptical",
    },
  },
  {
    name: "urgent support",
    input: {
      tenantId: "fixture",
      message: "My order has a delivery issue and I need help today.",
    },
    expected: {
      intent: "support",
      urgency: "high",
      emotion: "frustrated",
    },
  },
];

export const runBuyerStateClassifierFixtures = () =>
  buyerStateClassifierFixtures.map((fixture) => ({
    name: fixture.name,
    expected: fixture.expected,
    actual: classifyBuyerState(fixture.input),
  }));
