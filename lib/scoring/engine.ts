import { getCatalog } from "@/lib/catalog";
import type {
  AnswerPayload,
  ScoringResult,
  TopRoleRecommendation,
} from "@/lib/types/catalog";
import { CONSENT_QUESTION_ID, isConsentGiven } from "./consent";
import {
  getExposureBonus,
  getInterestMappings,
  INTEREST_BONUS_PER_HIT,
  SECONDARY_COMPETENCY_WEIGHT,
} from "./exposure-maps";

/** Workbook imports use "C01 — Name"; weights and competencies use "C01". */
export function resolveCompetencyCode(
  ref: string | undefined,
  catalog: ReturnType<typeof getCatalog>,
): string | undefined {
  if (!ref) return undefined;

  const trimmed = ref.trim();
  const byCode = catalog.competencies.find((c) => c.code === trimmed);
  if (byCode) return byCode.code;

  const prefix = trimmed.match(/^(C\d+)/)?.[1];
  if (prefix && catalog.competencies.some((c) => c.code === prefix)) {
    return prefix;
  }

  const byName = catalog.competencies.find(
    (c) => trimmed === c.name || trimmed.endsWith(c.name),
  );
  return byName?.code;
}

export function scoreSubmission(answers: AnswerPayload[]): ScoringResult {
  const catalog = getCatalog();
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptions]));

  if (!isConsentGiven(answerMap.get(CONSENT_QUESTION_ID), catalog)) {
    return {
      status: "rejected",
      competencyScores: {},
      roleScores: {},
      topRoles: [],
    };
  }

  const competencyRaw: Record<string, number> = {};
  const competencyMax: Record<string, number> = {};
  const interestBonuses: Record<string, number> = {};
  const exposureBonuses: Record<string, number> = {};

  for (const role of catalog.roleFamilies) {
    interestBonuses[role.roleCode] = 0;
    exposureBonuses[role.roleCode] = 0;
  }

  for (const question of catalog.questions) {
    const selected = answerMap.get(question.questionId) ?? [];

    if (
      question.scoringType === "Objective" ||
      question.scoringType === "Judgement"
    ) {
      const primaryCode = resolveCompetencyCode(
        question.primaryCompetency,
        catalog,
      );
      const secondaryCode = resolveCompetencyCode(
        question.secondaryCompetency,
        catalog,
      );

      // maxPossible is the sum of each question's best option (not a single global max).
      const questionPrimaryMax = Math.max(
        0,
        ...question.options.map((o) => o.scoreValue),
      );
      if (primaryCode) {
        competencyMax[primaryCode] =
          (competencyMax[primaryCode] ?? 0) + questionPrimaryMax;
      }
      if (secondaryCode) {
        competencyMax[secondaryCode] =
          (competencyMax[secondaryCode] ?? 0) +
          questionPrimaryMax * SECONDARY_COMPETENCY_WEIGHT;
      }

      for (const key of selected) {
        const option = question.options.find((o) => o.key === key);
        if (!option) continue;
        if (primaryCode) {
          competencyRaw[primaryCode] =
            (competencyRaw[primaryCode] ?? 0) + option.scoreValue;
        }
        if (secondaryCode) {
          competencyRaw[secondaryCode] =
            (competencyRaw[secondaryCode] ?? 0) +
            option.scoreValue * SECONDARY_COMPETENCY_WEIGHT;
        }
      }
    }

    if (question.scoringType === "Interest") {
      const mappings = getInterestMappings(question.questionId, selected);
      for (const roleCode of mappings) {
        interestBonuses[roleCode] =
          (interestBonuses[roleCode] ?? 0) + INTEREST_BONUS_PER_HIT;
      }
    }

    if (question.scoringType === "Exposure") {
      const bonus = getExposureBonus(question.questionId, selected);
      for (const role of catalog.roleFamilies) {
        exposureBonuses[role.roleCode] =
          (exposureBonuses[role.roleCode] ?? 0) + bonus / catalog.roleFamilies.length;
      }
    }
  }

  const competencyScores: Record<string, number> = {};
  for (const comp of catalog.competencies) {
    const raw = competencyRaw[comp.code] ?? 0;
    const max = competencyMax[comp.code] ?? 0;
    competencyScores[comp.code] = max > 0 ? (raw / max) * 100 : 0;
  }

  const roleScores: Record<string, number> = {};
  for (const role of catalog.roleFamilies) {
    const weights = catalog.roleCompetencyWeights.filter(
      (w) => w.roleCode === role.roleCode,
    );
    let baseFit = 0;
    for (const w of weights) {
      baseFit += (competencyScores[w.competencyCode] ?? 0) * w.weight;
    }
    roleScores[role.roleCode] =
      baseFit +
      (interestBonuses[role.roleCode] ?? 0) +
      (exposureBonuses[role.roleCode] ?? 0);
  }

  const ranked = catalog.roleFamilies
    .map((role) => ({
      role,
      fitScore: roleScores[role.roleCode] ?? 0,
    }))
    .sort((a, b) => b.fitScore - a.fitScore);

  const topRoles: TopRoleRecommendation[] = ranked.slice(0, 3).map((entry, index) => ({
    rank: index + 1,
    roleCode: entry.role.roleCode,
    name: entry.role.name,
    fitScore: Math.round(entry.fitScore * 10) / 10,
    reasons: buildReasons(entry.role.roleCode, competencyScores, catalog),
    gaps: buildGaps(entry.role.roleCode, competencyScores, catalog),
    nextSteps: buildNextSteps(entry.role),
  }));

  return {
    status: "completed",
    competencyScores,
    roleScores,
    topRoles,
  };
}

function buildReasons(
  roleCode: string,
  competencyScores: Record<string, number>,
  catalog: ReturnType<typeof getCatalog>,
): string[] {
  const weights = catalog.roleCompetencyWeights
    .filter((w) => w.roleCode === roleCode)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  return weights.map((w) => {
    const comp = catalog.competencies.find((c) => c.code === w.competencyCode);
    const score = Math.round(competencyScores[w.competencyCode] ?? 0);
    return `Strong alignment with ${comp?.name ?? w.competencyCode} (${score}%)`;
  });
}

function buildGaps(
  roleCode: string,
  competencyScores: Record<string, number>,
  catalog: ReturnType<typeof getCatalog>,
): string[] {
  const weights = catalog.roleCompetencyWeights.filter(
    (w) => w.roleCode === roleCode && w.weight >= 0.08,
  );
  const gaps = weights
    .filter((w) => (competencyScores[w.competencyCode] ?? 0) < 50)
    .slice(0, 2)
    .map((w) => {
      const comp = catalog.competencies.find((c) => c.code === w.competencyCode);
      return `Develop ${comp?.name ?? w.competencyCode} further`;
    });
  return gaps.length > 0 ? gaps : ["Continue building breadth across competencies"];
}

function buildNextSteps(role: { exampleRoles: string; outputTemplate: string }): string[] {
  return [
    `Explore pathways such as ${role.exampleRoles}`,
    role.outputTemplate || "Discuss development options with your line manager",
  ];
}
