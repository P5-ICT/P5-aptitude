/**
 * Airtable table and field identifiers for the Pillar 5 aptitude app.
 */

export const AIRTABLE_TABLES = {
  ROLE_FAMILIES: "Role Families",
  COMPETENCIES: "Competencies",
  ROLE_COMPETENCY_WEIGHTS: "Role Competency Weights",
  QUESTIONS: "Questions",
  QUESTION_OPTIONS: "Question Options",
  PARTICIPANTS: "Participants",
  SUBMISSIONS: "Submissions",
  ANSWERS: "Answers",
  SUBMISSION_RESULTS: "Submission Results",
} as const;

export type AirtableTableName =
  (typeof AIRTABLE_TABLES)[keyof typeof AIRTABLE_TABLES];

export const ROLE_FAMILIES_FIELDS = {
  ROLE_CODE: "RoleCode",
  NAME: "Name",
  DESCRIPTION: "Description",
  EXAMPLE_ROLES: "ExampleRoles",
  OUTPUT_TEMPLATE: "OutputTemplate",
} as const;

export const COMPETENCIES_FIELDS = {
  CODE: "Code",
  NAME: "Name",
  DEFINITION: "Definition",
} as const;

export const ROLE_COMPETENCY_WEIGHTS_FIELDS = {
  ROLE_CODE: "RoleCode",
  COMPETENCY_CODE: "CompetencyCode",
  WEIGHT: "Weight",
} as const;

export const QUESTIONS_FIELDS = {
  QUESTION_ID: "QuestionID",
  ORDER: "Order",
  SECTION: "Section",
  TEXT: "Text",
  RESPONSE_TYPE: "ResponseType",
  SCORING_TYPE: "ScoringType",
  PRIMARY_COMPETENCY: "PrimaryCompetency",
  SECONDARY_COMPETENCY: "SecondaryCompetency",
  REQUIRED: "Required",
  NOTES: "Notes",
} as const;

export const QUESTION_OPTIONS_FIELDS = {
  QUESTION_ID: "QuestionID",
  KEY: "Key",
  LABEL: "Label",
  SCORE_VALUE: "ScoreValue",
  MAPS_TO: "MapsTo",
} as const;

export const PARTICIPANTS_FIELDS = {
  PARTICIPANT_ID: "ParticipantID",
  FULL_NAME: "FullName",
  EMAIL: "Email",
  PHONE: "Phone",
  CREATED_AT: "CreatedAt",
} as const;

export const SUBMISSIONS_FIELDS = {
  SUBMISSION_ID: "SubmissionID",
  PARTICIPANT_ID: "ParticipantID",
  STATUS: "Status",
  CONSENT_GIVEN: "ConsentGiven",
  STARTED_AT: "StartedAt",
  COMPLETED_AT: "CompletedAt",
} as const;

export const ANSWERS_FIELDS = {
  SUBMISSION_ID: "SubmissionID",
  QUESTION_ID: "QuestionID",
  SELECTED_OPTIONS: "SelectedOptions",
  CREATED_AT: "CreatedAt",
} as const;

export const SUBMISSION_RESULTS_FIELDS = {
  SUBMISSION_ID: "SubmissionID",
  COMPETENCY_SCORES: "CompetencyScores",
  ROLE_SCORES: "RoleScores",
  TOP_ROLES: "TopRoles",
  GENERATED_AT: "GeneratedAt",
} as const;
