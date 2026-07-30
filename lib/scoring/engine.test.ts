import { describe, expect, it } from "vitest";
import { scoreSubmission } from "@/lib/scoring/engine";
import { getCatalog } from "@/lib/catalog";

function buildConsentAnswers(consent: "yes" | "no") {
  const catalog = getCatalog();
  return catalog.questions.map((q) => {
    if (q.questionId === "P001") {
      return { questionId: q.questionId, selectedOptions: [consent] };
    }
    if (q.scoringType === "Exposure") {
      return { questionId: q.questionId, selectedOptions: [q.options[0]?.key ?? "A"] };
    }
    return { questionId: q.questionId, selectedOptions: [q.options[0]?.key ?? "A"] };
  });
}

describe("scoreSubmission", () => {
  it("rejects when consent is not given", () => {
    const result = scoreSubmission(buildConsentAnswers("no"));
    expect(result.status).toBe("rejected");
    expect(result.topRoles).toHaveLength(0);
  });

  it("returns exactly 3 top roles when consent is given", () => {
    const result = scoreSubmission(buildConsentAnswers("yes"));
    expect(result.status).toBe("completed");
    expect(result.topRoles).toHaveLength(3);
    expect(result.topRoles[0].rank).toBe(1);
    expect(result.topRoles[1].rank).toBe(2);
    expect(result.topRoles[2].rank).toBe(3);
    expect(result.topRoles[0].roleCode).toBeTruthy();
    expect(result.topRoles[0].fitScore).toBeGreaterThanOrEqual(result.topRoles[1].fitScore);
  });

  it("includes all 12 role scores", () => {
    const result = scoreSubmission(buildConsentAnswers("yes"));
    expect(Object.keys(result.roleScores)).toHaveLength(12);
  });
});
