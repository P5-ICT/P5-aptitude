import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCreateRecords = vi.fn().mockResolvedValue([{ id: "recResult1", createdTime: "", fields: {} }]);

vi.mock("@/lib/airtable/client", () => ({
  createRecords: (...args: unknown[]) => mockCreateRecords(...args),
  findRecordsByFormula: vi.fn().mockResolvedValue([]),
  updateRecords: vi.fn().mockResolvedValue([]),
}));

import { POST } from "@/app/api/submit/route";

describe("POST /api/submit", () => {
  beforeEach(() => {
    mockCreateRecords.mockClear();
    process.env.AIRTABLE_API_KEY = "test-key";
    process.env.AIRTABLE_BASE_ID = "test-base";
  });

  it("writes TopRoles with 3 ranked entries to Submission Results", async () => {
    const catalog = (await import("@/lib/catalog")).getCatalog();
    const answers = catalog.questions.map((q) => ({
      questionId: q.questionId,
      selectedOptions: [q.questionId === "P001" ? "yes" : (q.options[0]?.key ?? "A")],
    }));

    const request = new Request("http://localhost/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant: { fullName: "Test User", email: "test@example.com" },
        submissionId: "sub-test-001",
        startedAt: new Date().toISOString(),
        answers,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

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
  });
});
