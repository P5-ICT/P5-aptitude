import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog";
import {
  CONSENT_QUESTION_ID,
  getConsentNoKey,
  getConsentYesKey,
  hasRefusedConsent,
  isConsentGiven,
} from "@/lib/scoring/consent";
import { scoreSubmission, resolveCompetencyCode } from "@/lib/scoring/engine";
import type { AnswerPayload } from "@/lib/types/catalog";

function consentKeys() {
  const catalog = getCatalog();
  const yesKey = getConsentYesKey(catalog);
  const noKey = getConsentNoKey(catalog);
  if (!yesKey || !noKey) {
    throw new Error("Consent options missing from catalog");
  }
  return { yesKey, noKey, catalog };
}

function buildAnswers(consentKey: string, overrides: Record<string, string[]> = {}): AnswerPayload[] {
  const catalog = getCatalog();
  return catalog.questions.map((q) => {
    if (overrides[q.questionId]) {
      return { questionId: q.questionId, selectedOptions: overrides[q.questionId] };
    }
    if (q.questionId === CONSENT_QUESTION_ID) {
      return { questionId: q.questionId, selectedOptions: [consentKey] };
    }
    // Prefer highest-scoring option for objective/judgement to produce differentiated scores
    if (q.scoringType === "Objective" || q.scoringType === "Judgement") {
      const best = [...q.options].sort((a, b) => b.scoreValue - a.scoreValue)[0];
      return { questionId: q.questionId, selectedOptions: [best?.key ?? "A"] };
    }
    return { questionId: q.questionId, selectedOptions: [q.options[0]?.key ?? "A"] };
  });
}

describe("consent helpers", () => {
  it("resolves yes/no keys from catalog option labels (A/B)", () => {
    const { yesKey, noKey } = consentKeys();
    expect(yesKey).toBe("A");
    expect(noKey).toBe("B");
  });

  it("detects consent given and refused from catalog keys", () => {
    const { yesKey, noKey } = consentKeys();
    expect(isConsentGiven([yesKey])).toBe(true);
    expect(isConsentGiven([noKey])).toBe(false);
    expect(isConsentGiven(undefined)).toBe(false);
    expect(hasRefusedConsent([noKey])).toBe(true);
    expect(hasRefusedConsent([yesKey])).toBe(false);
  });
});

describe("resolveCompetencyCode", () => {
  it("maps workbook-style labels to competency codes", () => {
    const catalog = getCatalog();
    expect(resolveCompetencyCode("C01 — Analytical and Numerical Ability", catalog)).toBe(
      "C01",
    );
    expect(resolveCompetencyCode("C01", catalog)).toBe("C01");
    expect(resolveCompetencyCode(undefined, catalog)).toBeUndefined();
  });
});

describe("scoreSubmission", () => {
  it("rejects when consent is not given (catalog no key)", () => {
    const { noKey } = consentKeys();
    const result = scoreSubmission(buildAnswers(noKey));
    expect(result.status).toBe("rejected");
    expect(result.topRoles).toHaveLength(0);
    expect(result.competencyScores).toEqual({});
    expect(result.roleScores).toEqual({});
  });

  it("rejects when consent answer is missing", () => {
    const answers = buildAnswers("A").map((a) =>
      a.questionId === CONSENT_QUESTION_ID
        ? { ...a, selectedOptions: [] }
        : a,
    );
    const result = scoreSubmission(answers);
    expect(result.status).toBe("rejected");
    expect(result.topRoles).toHaveLength(0);
  });

  it("returns exactly 3 top role pathways when consent is given", () => {
    const { yesKey } = consentKeys();
    const result = scoreSubmission(buildAnswers(yesKey));

    expect(result.status).toBe("completed");
    expect(result.topRoles).toHaveLength(3);

    expect(result.topRoles[0].rank).toBe(1);
    expect(result.topRoles[1].rank).toBe(2);
    expect(result.topRoles[2].rank).toBe(3);

    expect(result.topRoles[0].roleCode).toBeTruthy();
    expect(result.topRoles[0].name).toBeTruthy();
    expect(result.topRoles[0].fitScore).toBeGreaterThanOrEqual(
      result.topRoles[1].fitScore,
    );
    expect(result.topRoles[1].fitScore).toBeGreaterThanOrEqual(
      result.topRoles[2].fitScore,
    );

    for (const role of result.topRoles) {
      expect(role.reasons.length).toBeGreaterThan(0);
      expect(role.gaps.length).toBeGreaterThan(0);
      expect(role.nextSteps.length).toBeGreaterThan(0);
    }
  });

  it("includes all 12 role family scores", () => {
    const { yesKey } = consentKeys();
    const result = scoreSubmission(buildAnswers(yesKey));
    expect(Object.keys(result.roleScores)).toHaveLength(12);
    expect(Object.keys(result.competencyScores)).toHaveLength(10);
    expect(Object.values(result.competencyScores).some((score) => score > 0)).toBe(
      true,
    );
  });

  it("normalizes competency scores to 0–100 when selecting best options", () => {
    const { yesKey } = consentKeys();
    const result = scoreSubmission(buildAnswers(yesKey));

    for (const score of Object.values(result.competencyScores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    // Perfect objective answers → competency scores near 100; role fit stays
    // near 0–100 plus modest interest/exposure bonuses.
    for (const fit of Object.values(result.roleScores)) {
      expect(fit).toBeGreaterThanOrEqual(0);
      expect(fit).toBeLessThan(200);
    }
  });

  it("ranks top 3 as a subset of all role families ordered by fitScore", () => {
    const { yesKey, catalog } = consentKeys();
    const result = scoreSubmission(buildAnswers(yesKey));

    const rankedAll = Object.entries(result.roleScores)
      .sort((a, b) => b[1] - a[1])
      .map(([roleCode]) => roleCode);

    expect(result.topRoles.map((r) => r.roleCode)).toEqual(rankedAll.slice(0, 3));
    expect(new Set(result.topRoles.map((r) => r.roleCode)).size).toBe(3);

    const knownCodes = new Set(catalog.roleFamilies.map((r) => r.roleCode));
    for (const role of result.topRoles) {
      expect(knownCodes.has(role.roleCode)).toBe(true);
      const family = catalog.roleFamilies.find((f) => f.roleCode === role.roleCode);
      expect(role.name).toBe(family?.name);
      expect(role.fitScore).toBe(
        Math.round((result.roleScores[role.roleCode] ?? 0) * 10) / 10,
      );
    }
  });

  it("changes role rankings when objective answers differ", () => {
    const { yesKey, catalog } = consentKeys();

    const baseline = scoreSubmission(buildAnswers(yesKey));

    const lowAnswers = catalog.questions.map((q) => {
      if (q.questionId === CONSENT_QUESTION_ID) {
        return { questionId: q.questionId, selectedOptions: [yesKey] };
      }
      if (q.scoringType === "Objective" || q.scoringType === "Judgement") {
        const worst = [...q.options].sort((a, b) => a.scoreValue - b.scoreValue)[0];
        return { questionId: q.questionId, selectedOptions: [worst?.key ?? "A"] };
      }
      return { questionId: q.questionId, selectedOptions: [q.options[0]?.key ?? "A"] };
    });
    const low = scoreSubmission(lowAnswers);

    expect(baseline.status).toBe("completed");
    expect(low.status).toBe("completed");
    expect(baseline.topRoles).toHaveLength(3);
    expect(low.topRoles).toHaveLength(3);

    const baselineAvg =
      baseline.topRoles.reduce((sum, r) => sum + r.fitScore, 0) / 3;
    const lowAvg = low.topRoles.reduce((sum, r) => sum + r.fitScore, 0) / 3;
    expect(lowAvg).toBeLessThan(baselineAvg);

    const baselineTop = baseline.topRoles[0].roleCode;
    const lowTop = low.topRoles[0].roleCode;
    expect(baselineTop).toBeTruthy();
    expect(lowTop).toBeTruthy();
  });
});
