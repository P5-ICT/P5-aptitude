export type RoleFamily = {
  roleCode: string;
  name: string;
  description: string;
  exampleRoles: string;
  outputTemplate: string;
};

export type Competency = {
  code: string;
  name: string;
  definition: string;
};

export type RoleCompetencyWeight = {
  roleCode: string;
  competencyCode: string;
  weight: number;
};

export type ScoringType =
  | "Consent"
  | "Context"
  | "Exposure"
  | "Objective"
  | "Judgement"
  | "Self-report"
  | "Interest";

export type QuestionOption = {
  key: string;
  label: string;
  scoreValue: number;
  mapsTo?: string[];
};

export type Question = {
  questionId: string;
  order: number;
  section: string;
  sectionSlug: string;
  text: string;
  responseType: "single" | "multi" | "text";
  scoringType: ScoringType;
  primaryCompetency?: string;
  secondaryCompetency?: string;
  required: boolean;
  notes?: string;
  options: QuestionOption[];
};

export type TestCatalog = {
  roleFamilies: RoleFamily[];
  competencies: Competency[];
  roleCompetencyWeights: RoleCompetencyWeight[];
  questions: Question[];
  sections: { slug: string; title: string; order: number }[];
};

export type AnswerPayload = {
  questionId: string;
  selectedOptions: string[];
};

export type ParticipantPayload = {
  fullName: string;
  email: string;
  phone?: string;
};

export type SubmitPayload = {
  participant: ParticipantPayload;
  submissionId: string;
  startedAt: string;
  answers: AnswerPayload[];
};

export type TopRoleRecommendation = {
  rank: number;
  roleCode: string;
  name: string;
  fitScore: number;
  reasons: string[];
  gaps: string[];
  nextSteps: string[];
};

export type ScoringResult = {
  status: "completed" | "rejected";
  competencyScores: Record<string, number>;
  roleScores: Record<string, number>;
  topRoles: TopRoleRecommendation[];
};
