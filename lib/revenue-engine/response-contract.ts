import type {
  ResponseContract,
  ResponseContractValidationIssue,
  ResponseContractValidationResult,
  ResponseFormat,
  ResponseFormatName,
  SalesPlaybook,
} from "@/lib/revenue-engine/types";

export const responseFormats: Record<ResponseFormatName, ResponseFormat> = {
  general_answer: {
    name: "general_answer",
    label: "General Answer",
    shape: ["answer", "reason", "next_step"],
    rules: [
      "Answer the question directly.",
      "Give one plain reason.",
      "End with one useful next step or one question.",
    ],
    example: "Yes. This is a good fit for daily use. Want the cheaper option too?",
  },
  recommendation: {
    name: "recommendation",
    label: "Recommendation",
    shape: ["best_fit", "why", "next_step"],
    rules: [
      "Recommend one best fit first.",
      "Give up to three options only when useful.",
      "Explain each option by buyer benefit, not feature volume.",
    ],
    example: "Pick this one for daily use. It is stronger and still simple. Want the budget option?",
  },
  comparison: {
    name: "comparison",
    label: "Comparison",
    shape: ["best_for_a", "best_for_b", "my_pick"],
    rules: [
      "Use short bullets only when comparing options.",
      "Say which option is best for which need.",
      "Pick one winner when the facts are enough.",
    ],
    example: "Choose A for price. Choose B for daily use. My pick is B.",
  },
  objection: {
    name: "objection",
    label: "Objection",
    shape: ["acknowledge", "clarify_or_reframe", "safe_next_step"],
    rules: [
      "Acknowledge the concern first.",
      "Do not argue.",
      "Ask one useful question or offer one safer next step.",
    ],
    example: "Fair point. Is the concern price, trust, or whether it fits your need?",
  },
  lead_capture: {
    name: "lead_capture",
    label: "Lead Capture",
    shape: ["offer_help", "ask_contact"],
    rules: [
      "Offer human help in one short sentence.",
      "Ask for phone or email first.",
      "Do not ask for every lead field at once.",
    ],
    example: "I can have someone help. What phone or email should they use?",
  },
  fallback: {
    name: "fallback",
    label: "Fallback",
    shape: ["known_fact", "missing_fact", "safe_next_step"],
    rules: [
      "Say what is known.",
      "Say what is missing without blame.",
      "Do not guess.",
    ],
    example: "I do not see that detail here. I can take your contact so the team can confirm.",
  },
};

export const defaultResponseContract: ResponseContract = {
  language: "simple_english",
  tone: ["helpful", "calm", "confident", "sales_aware", "not_pushy"],
  sentenceTarget: {
    min: 1,
    max: 4,
  },
  maxWordsPerSentence: 22,
  maxQuestions: 1,
  maxRecommendations: 3,
  preferredShape: "answer_reason_next_step",
  allowedListUse: ["comparison", "short_options"],
  bannedPhrases: [
    "as an ai",
    "certainly, i would be delighted",
    "i hope this message finds you well",
    "it depends on various factors",
    "there are many things to consider",
    "i am just a",
  ],
  bannedInternalTerms: [
    "spin selling",
    "gap selling",
    "challenger sale",
    "chris voss",
    "cialdini",
    "decision science",
    "revenue engine",
    "playbook",
    "buyer state",
  ],
  rules: [
    "Use simple English.",
    "Use short sentences.",
    "Usually answer in one to four sentences.",
    "Answer first, then give the reason, then move to one next step.",
    "Ask at most one question.",
    "Recommend at most three options.",
    "Use bullets only for comparisons or short option lists.",
    "Do not show internal framework names to the buyer.",
    "Do not use generic AI phrases.",
    "Do not add filler or long introductions.",
  ],
};

export const chooseResponseFormat = (playbook: SalesPlaybook): ResponseFormat => {
  if (playbook.name === "challenger_recommendation" || playbook.name === "bias_reducer") {
    return responseFormats.recommendation;
  }
  if (playbook.name === "comparison_reframe") return responseFormats.comparison;
  if (playbook.name === "voss_objection_loop" || playbook.name === "cialdini_evidence_selector") {
    return responseFormats.objection;
  }
  if (playbook.name === "lead_capture") return responseFormats.lead_capture;
  if (playbook.name === "safe_fallback" || playbook.name === "not_a_fit_exit") {
    return responseFormats.fallback;
  }

  return responseFormats.general_answer;
};

export const buildResponseContractPrompt = ({
  contract = defaultResponseContract,
  playbook,
}: {
  contract?: ResponseContract;
  playbook: SalesPlaybook;
}) => {
  const format = chooseResponseFormat(playbook);

  return [
    "Plain-language response contract:",
    `Format: ${format.label}`,
    `Shape: ${format.shape.join(" -> ")}`,
    "Global rules:",
    ...contract.rules.map((rule) => `- ${rule}`),
    "Format rules:",
    ...format.rules.map((rule) => `- ${rule}`),
    `Example style: ${format.example}`,
  ].join("\n");
};

const sentenceParts = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const wordCount = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const countRecommendations = (text: string) => {
  const optionLines = text
    .split(/\n+/)
    .filter((line) => /^\s*(-|\d+\.|option\s+\w+|choose\s+\w+)/i.test(line.trim()));

  const optionMentions = text.match(/\b(option|choose|pick)\s+[a-z0-9]/gi)?.length ?? 0;

  return Math.max(optionLines.length, optionMentions);
};

export const validatePlainLanguageResponse = (
  response: string,
  contract: ResponseContract = defaultResponseContract,
): ResponseContractValidationResult => {
  const normalized = response.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const sentences = sentenceParts(normalized);
  const questionCount = (normalized.match(/\?/g) ?? []).length;
  const recommendationCount = countRecommendations(response);
  const issues: ResponseContractValidationIssue[] = [];

  if (!normalized) {
    issues.push({
      code: "empty_response",
      message: "Response is empty.",
    });
  }

  if (sentences.length > contract.sentenceTarget.max) {
    issues.push({
      code: "too_many_sentences",
      message: `Response has ${sentences.length} sentences; max is ${contract.sentenceTarget.max}.`,
    });
  }

  if (questionCount > contract.maxQuestions) {
    issues.push({
      code: "too_many_questions",
      message: `Response has ${questionCount} questions; max is ${contract.maxQuestions}.`,
    });
  }

  if (recommendationCount > contract.maxRecommendations) {
    issues.push({
      code: "too_many_recommendations",
      message: `Response appears to recommend ${recommendationCount} options; max is ${contract.maxRecommendations}.`,
    });
  }

  for (const phrase of contract.bannedPhrases) {
    if (lower.includes(phrase)) {
      issues.push({
        code: "banned_phrase",
        message: `Response includes banned phrase: ${phrase}.`,
      });
    }
  }

  for (const term of contract.bannedInternalTerms) {
    if (lower.includes(term)) {
      issues.push({
        code: "internal_framework_name",
        message: `Response exposes internal term: ${term}.`,
      });
    }
  }

  for (const sentence of sentences) {
    if (wordCount(sentence) > contract.maxWordsPerSentence) {
      issues.push({
        code: "sentence_too_long",
        message: `Sentence is longer than ${contract.maxWordsPerSentence} words.`,
      });
    }
  }

  return {
    ok: issues.length === 0,
    sentenceCount: sentences.length,
    questionCount,
    recommendationCount,
    issues,
  };
};
