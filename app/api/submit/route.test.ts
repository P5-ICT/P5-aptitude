import { describe, expect, it, vi, beforeEach } from "vitest";
import { getCatalog } from "@/lib/catalog";
import {
  CONSENT_QUESTION_ID,
  getConsentNoKey,
  getConsentYesKey,
} from "@/lib/scoring/consent";

const mockCreateRecords = vi.fn().mockResolvedValue([{ id: "recResult1", createdTime: "", fields: {} }]);

vi.mock("@/lib/airtable/client", () => ({
  createRecords: (...args: unknown[]) => mockCreateRecords(...args),
  findRecordsByFormula: vi.fn().mockResolvedValue([]),
  updateRecords: vi.fn().mockResolvedValue([]),
}));

import { POST } from "@/app/api/submit/route";

function buildPayload(consentKey: string) {
  const catalog = getCatalog();
  return {
    participant: { fullName: "Test User", email: "test@example.com" },
    submissionId: "sub-test-001",
    startedAt: new Date().toISOString(),
    answers: catalog.questions.map((q) => ({
      questionId: q.questionId,
      selectedOptions: [
        q.questionId === CONSENT_QUESTION_ID ? consentKey : (q.options[0]?.key ?? "A"),
      ],
    })),
  };
}

describe("POST /api/submit", () => {
  beforeEach(() => {
    mockCreateRecords.mockClear();
    process.env.AIRTABLE_API_KEY = "test-key";
    process.env.AIRTABLE_BASE_ID = "test-base";
  });

  it("writes TopRoles with 3 ranked entries to Submission Results when consent given", async () => {
    const yesKey = getConsentYesKey();
    expect(yesKey).toBeTruthy();

    const request = new Request("http://localhost/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(yesKey!)),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("completed");
    expect(body.topRoles).toHaveLength(3);
    expect(body.topRoles[0].rank).toBe(1);
    expect(body.topRoles[1].rank).toBe(2);
    expect(body.topRoles[2].rank).toBe(3);
    expect(body.topRoles[0].name).toBeTruthy();
    expect(body.topRoles[0].fitScore).toBeGreaterThanOrEqual(body.topRoles[1].fitScore);
    expect(body.topRoles[1].fitScore).toBeGreaterThanOrEqual(body.topRoles[2].fitScore);

    const rankedAll = Object.entries(body.roleScores as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .map(([roleCode]) => roleCode);
    expect(body.topRoles.map((r: { roleCode: string }) => r.roleCode)).toEqual(
      rankedAll.slice(0, 3),
    );

    const resultCalls = mockCreateRecords.mock.calls.filter(
      (call) => call[0] === "Submission Results",
    );
    expect(resultCalls.length).toBeGreaterThan(0);

    const fields = resultCalls[0][1][0];
    expect(fields.TopRoles).toBeDefined();
    const topRoles = JSON.parse(fields.TopRoles as string);
    expect(topRoles).toHaveLength(3);
    expect(topRoles[0].rank).toBe(1);
    expect(topRoles[1].rank).toBe(2);
    expect(topRoles[2].rank).toBe(3);
    expect(topRoles).toEqual(body.topRoles);

    const submissionCalls = mockCreateRecords.mock.calls.filter(
      (call) => call[0] === "Submissions",
    );
    expect(submissionCalls[0][1][0].ConsentGiven).toBe(true);
    expect(submissionCalls[0][1][0].Status).toBe("completed");
  });

  it("rejects without consent: no Submission Results row, empty topRoles", async () => {
    const noKey = getConsentNoKey();
    expect(noKey).toBeTruthy();

    const request = new Request("http://localhost/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(noKey!)),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("rejected");
    expect(body.topRoles).toEqual([]);

    const resultCalls = mockCreateRecords.mock.calls.filter(
      (call) => call[0] === "Submission Results",
    );
    expect(resultCalls).toHaveLength(0);

    const submissionCalls = mockCreateRecords.mock.calls.filter(
      (call) => call[0] === "Submissions",
    );
    expect(submissionCalls.length).toBeGreaterThan(0);
    expect(submissionCalls[0][1][0].ConsentGiven).toBe(false);
    expect(submissionCalls[0][1][0].Status).toBe("rejected");
  });
});
