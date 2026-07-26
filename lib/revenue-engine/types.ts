export type BuyerIntent =
  | "information"
  | "recommendation"
  | "comparison"
  | "purchase"
  | "support";

export type BuyingStage = "awareness" | "consideration" | "decision";

export type NeedClarity = "unknown" | "partial" | "known";

export type SignalStrength = "low" | "medium" | "high";

export type BudgetSignal = SignalStrength | "unknown";

export type BuyerEmotion =
  | "curious"
  | "excited"
  | "frustrated"
  | "skeptical"
  | "confident";

export type BuyerAuthority =
  | "decision_maker"
  | "researcher"
  | "influencer"
  | "unknown";

export type ObjectionType =
  | "none"
  | "price"
  | "need"
  | "timing"
  | "competitor"
  | "trust"
  | "status_quo"
  | "technical"
  | "policy";

export type CognitiveBias =
  | "none"
  | "loss_aversion"
  | "status_quo"
  | "choice_overload"
  | "risk_aversion"
  | "anchoring"
  | "decision_fatigue";

export type BuyerState = {
  intent: BuyerIntent;
  buyingStage: BuyingStage;
  needClarity: NeedClarity;
  trust: SignalStrength;
  urgency: SignalStrength;
  risk: SignalStrength;
  budget: BudgetSignal;
  emotion: BuyerEmotion;
  authority: BuyerAuthority;
  objection: ObjectionType;
  cognitiveBias: CognitiveBias;
  signals: string[];
};

export type SalesPlaybookName =
  | "spin_discovery"
  | "gap_value_builder"
  | "challenger_recommendation"
  | "comparison_reframe"
  | "voss_objection_loop"
  | "cialdini_evidence_selector"
  | "bias_reducer"
  | "closing_hierarchy"
  | "lead_capture"
  | "not_a_fit_exit"
  | "safe_fallback";

export type SalesPlaybook = {
  name: SalesPlaybookName;
  label: string;
  framework: string;
  objective: string;
  internalSteps: string[];
  responseBlueprint: string[];
  ctaRule: string;
  safetyRule: string;
};

export type ResponseContract = {
  language: "simple_english";
  tone: Array<"helpful" | "calm" | "confident" | "sales_aware" | "not_pushy">;
  sentenceTarget: {
    min: number;
    max: number;
  };
  maxWordsPerSentence: number;
  maxQuestions: number;
  maxRecommendations: number;
  preferredShape: "answer_reason_next_step";
  allowedListUse: Array<"comparison" | "short_options">;
  bannedPhrases: string[];
  bannedInternalTerms: string[];
  rules: string[];
};

export type ResponseFormatName =
  | "general_answer"
  | "recommendation"
  | "comparison"
  | "objection"
  | "lead_capture"
  | "fallback";

export type ResponseFormat = {
  name: ResponseFormatName;
  label: string;
  shape: string[];
  rules: string[];
  example: string;
};

export type ResponseContractValidationIssue = {
  code:
    | "too_many_sentences"
    | "too_many_questions"
    | "too_many_recommendations"
    | "banned_phrase"
    | "internal_framework_name"
    | "sentence_too_long"
    | "empty_response";
  message: string;
};

export type ResponseContractValidationResult = {
  ok: boolean;
  sentenceCount: number;
  questionCount: number;
  recommendationCount: number;
  issues: ResponseContractValidationIssue[];
};

export type CtaType =
  | "view_product"
  | "compare_options"
  | "add_to_cart"
  | "book_demo"
  | "request_callback"
  | "open_whatsapp"
  | "submit_lead"
  | "read_policy"
  | "ask_clarifying_question"
  | "safe_next_step"
  | "none";

export type CloseType =
  | "assumptive_close"
  | "summary_close"
  | "proof_close"
  | "value_close"
  | "next_step_close"
  | "risk_reversal_close"
  | "alternative_close"
  | "none";

export type CtaDecision = {
  type: CtaType;
  label: string;
  reason: string;
  requiresTenantUrl: boolean;
  closeType: CloseType;
};

export type LeadCaptureTrigger =
  | "callback_request"
  | "repeated_objection"
  | "confused_but_interested"
  | "custom_price_or_quote"
  | "human_confirmation_needed"
  | "budget_or_timeline_shared"
  | "high_value_comparison"
  | "missing_safe_answer";

export type LeadCaptureDecision = {
  shouldCapture: boolean;
  trigger: LeadCaptureTrigger | "none";
  reason: string;
  requiredFields: Array<
    | "name"
    | "phone_or_email"
    | "product_or_page"
    | "budget"
    | "interest"
    | "objection"
    | "conversation_summary"
  >;
};

export type TenantFactBoundary = {
  tenantSpecificFacts: string[];
  globalShadyyBehavior: string[];
};

export type RevenueSafetyBoundaries = {
  neverInvent: string[];
  neverReveal: string[];
  piiRules: string[];
};

export type RevenueEngineDecision = {
  engineVersion: string;
  buyerState: BuyerState;
  playbook: SalesPlaybook;
  responseContract: ResponseContract;
  cta: CtaDecision;
  leadCapture: LeadCaptureDecision;
  tenantFactBoundary: TenantFactBoundary;
  safetyBoundaries: RevenueSafetyBoundaries;
};

export type RevenueEngineInput = {
  tenantId: string;
  message: string;
  chatId?: string;
  pageContext?: Record<string, unknown>;
  productContext?: Record<string, unknown>;
  catalogResults?: Array<Record<string, unknown>>;
  previousTurns?: Array<{
    role: "user" | "assistant";
    text: string;
  }>;
  missingSafeAnswer?: boolean;
  repeatedObjectionCount?: number;
};
