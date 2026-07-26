import {
  defaultResponseContract,
  validatePlainLanguageResponse,
} from "@/lib/revenue-engine/response-contract";

export type ResponseContractFixture = {
  name: string;
  response: string;
  shouldPass: boolean;
};

export const responseContractFixtures: ResponseContractFixture[] = [
  {
    name: "short recommendation passes",
    response: "Yes. This is the best fit for daily use. It is stronger and still simple. Want the cheaper option too?",
    shouldPass: true,
  },
  {
    name: "comparison format passes",
    response: "Choose A for price. Choose B for daily use. My pick is B.",
    shouldPass: true,
  },
  {
    name: "generic AI phrase fails",
    response: "As an AI, I would be delighted to help you evaluate the many factors involved in this purchase.",
    shouldPass: false,
  },
  {
    name: "too many questions fails",
    response: "What is your budget? What size do you need? When do you need it?",
    shouldPass: false,
  },
  {
    name: "internal framework name fails",
    response: "Using SPIN Selling, I should ask one question before recommending.",
    shouldPass: false,
  },
];

export const runResponseContractFixtures = () =>
  responseContractFixtures.map((fixture) => {
    const result = validatePlainLanguageResponse(
      fixture.response,
      defaultResponseContract,
    );

    return {
      name: fixture.name,
      shouldPass: fixture.shouldPass,
      actualPass: result.ok,
      passed: fixture.shouldPass === result.ok,
      result,
    };
  });
