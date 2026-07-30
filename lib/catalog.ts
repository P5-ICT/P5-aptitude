import type { TestCatalog } from "@/lib/types/catalog";
import roleFamilies from "@/lib/data/role-families.json";
import competencies from "@/lib/data/competencies.json";
import roleCompetencyWeights from "@/lib/data/role-competency-weights.json";
import questions from "@/lib/data/questions.json";
import sections from "@/lib/data/sections.json";

export function getCatalog(): TestCatalog {
  return {
    roleFamilies: roleFamilies as TestCatalog["roleFamilies"],
    competencies: competencies as TestCatalog["competencies"],
    roleCompetencyWeights:
      roleCompetencyWeights as TestCatalog["roleCompetencyWeights"],
    questions: questions as TestCatalog["questions"],
    sections: sections as TestCatalog["sections"],
  };
}

export function getQuestionById(questionId: string) {
  return getCatalog().questions.find((q) => q.questionId === questionId);
}

export function getSectionQuestions(sectionSlug: string) {
  return getCatalog().questions.filter((q) => q.sectionSlug === sectionSlug);
}
