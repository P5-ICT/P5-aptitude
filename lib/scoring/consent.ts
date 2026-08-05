import { getCatalog } from "@/lib/catalog";
import type { Question, TestCatalog } from "@/lib/types/catalog";

export const CONSENT_QUESTION_ID = "P001";

export function getConsentQuestion(
  catalog: TestCatalog = getCatalog(),
): Question | undefined {
  return (
    catalog.questions.find((q) => q.questionId === CONSENT_QUESTION_ID) ??
    catalog.questions.find((q) => q.scoringType === "Consent")
  );
}

/** Affirmative consent option key from catalog (supports `yes` or label-based `A`). */
export function getConsentYesKey(
  catalog: TestCatalog = getCatalog(),
): string | undefined {
  const question = getConsentQuestion(catalog);
  if (!question) return undefined;

  const byKey = question.options.find((o) => o.key.toLowerCase() === "yes");
  if (byKey) return byKey.key;

  return question.options.find((o) => /^\s*yes\b/i.test(o.label))?.key;
}

/** Refusal option key from catalog (supports `no` or label-based `B`). */
export function getConsentNoKey(
  catalog: TestCatalog = getCatalog(),
): string | undefined {
  const question = getConsentQuestion(catalog);
  if (!question) return undefined;

  const byKey = question.options.find((o) => o.key.toLowerCase() === "no");
  if (byKey) return byKey.key;

  return question.options.find((o) => /^\s*no\b/i.test(o.label))?.key;
}

export function isConsentGiven(
  selectedOptions: string[] | undefined,
  catalog: TestCatalog = getCatalog(),
): boolean {
  const yesKey = getConsentYesKey(catalog);
  if (!yesKey || !selectedOptions?.length) return false;
  return selectedOptions[0] === yesKey;
}

export function hasRefusedConsent(
  selectedOptions: string[] | undefined,
  catalog: TestCatalog = getCatalog(),
): boolean {
  const noKey = getConsentNoKey(catalog);
  if (!noKey || !selectedOptions?.length) return false;
  return selectedOptions[0] === noKey;
}
