import { z } from "zod";
import { createRecords, findRecordsByFormula, updateRecords } from "@/lib/airtable/client";
import {
  AIRTABLE_TABLES,
  ANSWERS_FIELDS,
  PARTICIPANTS_FIELDS,
  SUBMISSION_RESULTS_FIELDS,
  SUBMISSIONS_FIELDS,
} from "@/lib/airtable/tables";
import { scoreSubmission } from "@/lib/scoring/engine";
import type { SubmitPayload } from "@/lib/types/catalog";

const submitSchema = z.object({
  participant: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  submissionId: z.string().min(1),
  startedAt: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptions: z.array(z.string()),
    }),
  ),
});

function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

async function persistToAirtable(payload: SubmitPayload, scoring: ReturnType<typeof scoreSubmission>) {
  const participantId = payload.submissionId;
  const now = new Date().toISOString();
  const consentAnswer = payload.answers.find((a) => a.questionId === "P001")?.selectedOptions[0];
  const consentGiven = consentAnswer === "yes";

  const existingParticipants = await findRecordsByFormula<Record<string, string>>(
    AIRTABLE_TABLES.PARTICIPANTS,
    `{${PARTICIPANTS_FIELDS.EMAIL}} = '${payload.participant.email.replace(/'/g, "\\'")}'`,
  );

  let participantRecordId: string;
  if (existingParticipants.length > 0) {
    participantRecordId = existingParticipants[0].id;
    await updateRecords(AIRTABLE_TABLES.PARTICIPANTS, [
      {
        id: participantRecordId,
        fields: {
          [PARTICIPANTS_FIELDS.FULL_NAME]: payload.participant.fullName,
          [PARTICIPANTS_FIELDS.PHONE]: payload.participant.phone ?? "",
        },
      },
    ]);
  } else {
    const [created] = await createRecords(AIRTABLE_TABLES.PARTICIPANTS, [
      {
        [PARTICIPANTS_FIELDS.PARTICIPANT_ID]: participantId,
        [PARTICIPANTS_FIELDS.FULL_NAME]: payload.participant.fullName,
        [PARTICIPANTS_FIELDS.EMAIL]: payload.participant.email,
        [PARTICIPANTS_FIELDS.PHONE]: payload.participant.phone ?? "",
        [PARTICIPANTS_FIELDS.CREATED_AT]: now,
      },
    ]);
    participantRecordId = created.id;
  }

  const [submission] = await createRecords(AIRTABLE_TABLES.SUBMISSIONS, [
    {
      [SUBMISSIONS_FIELDS.SUBMISSION_ID]: payload.submissionId,
      [SUBMISSIONS_FIELDS.PARTICIPANT_ID]: [participantRecordId],
      [SUBMISSIONS_FIELDS.STATUS]: scoring.status === "rejected" ? "rejected" : "completed",
      [SUBMISSIONS_FIELDS.CONSENT_GIVEN]: consentGiven,
      [SUBMISSIONS_FIELDS.STARTED_AT]: payload.startedAt,
      [SUBMISSIONS_FIELDS.COMPLETED_AT]: now,
    },
  ]);

  const answerFields = payload.answers.map((answer) => ({
    [ANSWERS_FIELDS.SUBMISSION_ID]: [submission.id],
    [ANSWERS_FIELDS.QUESTION_ID]: answer.questionId,
    [ANSWERS_FIELDS.SELECTED_OPTIONS]: JSON.stringify(answer.selectedOptions),
    [ANSWERS_FIELDS.CREATED_AT]: now,
  }));
  await createRecords(AIRTABLE_TABLES.ANSWERS, answerFields);

  if (scoring.status === "completed") {
    await createRecords(AIRTABLE_TABLES.SUBMISSION_RESULTS, [
      {
        [SUBMISSION_RESULTS_FIELDS.SUBMISSION_ID]: [submission.id],
        [SUBMISSION_RESULTS_FIELDS.COMPETENCY_SCORES]: JSON.stringify(scoring.competencyScores),
        [SUBMISSION_RESULTS_FIELDS.ROLE_SCORES]: JSON.stringify(scoring.roleScores),
        [SUBMISSION_RESULTS_FIELDS.TOP_ROLES]: JSON.stringify(scoring.topRoles),
        [SUBMISSION_RESULTS_FIELDS.GENERATED_AT]: now,
      },
    ]);
  }

  return submission.id;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = submitSchema.parse(body) as SubmitPayload;
    const scoring = scoreSubmission(payload.answers);

    if (isAirtableConfigured()) {
      await persistToAirtable(payload, scoring);
    }

    return Response.json({
      submissionId: payload.submissionId,
      status: scoring.status,
      topRoles: scoring.topRoles,
      competencyScores: scoring.competencyScores,
      roleScores: scoring.roleScores,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submit failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
