import { listAllRecords } from "@/lib/airtable/client";
import {
  AIRTABLE_TABLES,
  PARTICIPANTS_FIELDS,
  SUBMISSION_RESULTS_FIELDS,
  SUBMISSIONS_FIELDS,
} from "@/lib/airtable/tables";
import type { TopRoleRecommendation } from "@/lib/types/catalog";

export type SubmissionListItem = {
  id: string;
  submissionId: string;
  participantName: string;
  email: string;
  status: string;
  completedAt: string;
  topRole: string;
};

export type SubmissionDetail = SubmissionListItem & {
  competencyScores: Record<string, number>;
  roleScores: Record<string, number>;
  topRoles: TopRoleRecommendation[];
  consentGiven: boolean;
};

function isConfigured() {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

export async function getSubmissions(): Promise<SubmissionListItem[]> {
  if (!isConfigured()) return [];

  const [submissions, participants, results] = await Promise.all([
    listAllRecords<Record<string, unknown>>(AIRTABLE_TABLES.SUBMISSIONS),
    listAllRecords<Record<string, string>>(AIRTABLE_TABLES.PARTICIPANTS),
    listAllRecords<Record<string, string>>(AIRTABLE_TABLES.SUBMISSION_RESULTS),
  ]);

  const participantMap = new Map(participants.map((p) => [p.id, p.fields]));
  const resultsBySubmission = new Map<string, Record<string, string>>();

  for (const result of results) {
    const submissionLink = result.fields[SUBMISSION_RESULTS_FIELDS.SUBMISSION_ID];
    const submissionId = Array.isArray(submissionLink) ? submissionLink[0] : submissionLink;
    if (submissionId) resultsBySubmission.set(submissionId, result.fields);
  }

  return submissions.map((sub) => {
    const participantLink = sub.fields[SUBMISSIONS_FIELDS.PARTICIPANT_ID];
    const participantRecordId = Array.isArray(participantLink)
      ? participantLink[0]
      : (participantLink as string);
    const participant = participantMap.get(participantRecordId as string);
    const resultFields = resultsBySubmission.get(sub.id);
    let topRole = "—";
    if (resultFields?.[SUBMISSION_RESULTS_FIELDS.TOP_ROLES]) {
      try {
        const topRoles = JSON.parse(
          resultFields[SUBMISSION_RESULTS_FIELDS.TOP_ROLES],
        ) as TopRoleRecommendation[];
        topRole = topRoles[0]?.name ?? "—";
      } catch {
        topRole = "—";
      }
    }

    return {
      id: sub.id,
      submissionId: String(sub.fields[SUBMISSIONS_FIELDS.SUBMISSION_ID] ?? sub.id),
      participantName: String(participant?.[PARTICIPANTS_FIELDS.FULL_NAME] ?? "Unknown"),
      email: String(participant?.[PARTICIPANTS_FIELDS.EMAIL] ?? ""),
      status: String(sub.fields[SUBMISSIONS_FIELDS.STATUS] ?? "unknown"),
      completedAt: String(sub.fields[SUBMISSIONS_FIELDS.COMPLETED_AT] ?? ""),
      topRole,
    };
  });
}

export async function getSubmissionDetail(
  recordId: string,
): Promise<SubmissionDetail | null> {
  if (!isConfigured()) return null;

  const submissions = await listAllRecords<Record<string, unknown>>(
    AIRTABLE_TABLES.SUBMISSIONS,
  );
  const submission = submissions.find(
    (s) => s.id === recordId || s.fields[SUBMISSIONS_FIELDS.SUBMISSION_ID] === recordId,
  );
  if (!submission) return null;

  const [participants, results] = await Promise.all([
    listAllRecords<Record<string, string>>(AIRTABLE_TABLES.PARTICIPANTS),
    listAllRecords<Record<string, string>>(AIRTABLE_TABLES.SUBMISSION_RESULTS),
  ]);

  const participantLink = submission.fields[SUBMISSIONS_FIELDS.PARTICIPANT_ID];
  const participantRecordId = Array.isArray(participantLink)
    ? participantLink[0]
    : (participantLink as string);
  const participant = participants.find((p) => p.id === participantRecordId);

  const result = results.find((r) => {
    const link = r.fields[SUBMISSION_RESULTS_FIELDS.SUBMISSION_ID];
    const linkedId = Array.isArray(link) ? link[0] : link;
    return linkedId === submission.id;
  });

  let topRoles: TopRoleRecommendation[] = [];
  let competencyScores: Record<string, number> = {};
  let roleScores: Record<string, number> = {};

  if (result) {
    try {
      topRoles = JSON.parse(result.fields[SUBMISSION_RESULTS_FIELDS.TOP_ROLES] ?? "[]");
      competencyScores = JSON.parse(
        result.fields[SUBMISSION_RESULTS_FIELDS.COMPETENCY_SCORES] ?? "{}",
      );
      roleScores = JSON.parse(result.fields[SUBMISSION_RESULTS_FIELDS.ROLE_SCORES] ?? "{}");
    } catch {
      // keep defaults
    }
  }

  return {
    id: submission.id,
    submissionId: String(submission.fields[SUBMISSIONS_FIELDS.SUBMISSION_ID] ?? submission.id),
    participantName: String(participant?.fields[PARTICIPANTS_FIELDS.FULL_NAME] ?? "Unknown"),
    email: String(participant?.fields[PARTICIPANTS_FIELDS.EMAIL] ?? ""),
    status: String(submission.fields[SUBMISSIONS_FIELDS.STATUS] ?? "unknown"),
    completedAt: String(submission.fields[SUBMISSIONS_FIELDS.COMPLETED_AT] ?? ""),
    topRole: topRoles[0]?.name ?? "—",
    consentGiven: Boolean(submission.fields[SUBMISSIONS_FIELDS.CONSENT_GIVEN]),
    competencyScores,
    roleScores,
    topRoles,
  };
}
