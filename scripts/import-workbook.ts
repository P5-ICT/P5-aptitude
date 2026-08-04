import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import XLSX from "xlsx";
import { createRecords } from "../lib/airtable/client";
import {
  AIRTABLE_TABLES,
  COMPETENCIES_FIELDS,
  QUESTION_OPTIONS_FIELDS,
  QUESTIONS_FIELDS,
  ROLE_COMPETENCY_WEIGHTS_FIELDS,
  ROLE_FAMILIES_FIELDS,
} from "../lib/airtable/tables";
import type {
  Competency,
  Question,
  QuestionOption,
  RoleCompetencyWeight,
  RoleFamily,
  ScoringType,
} from "../lib/types/catalog";
import { writeSeedFiles } from "./generate-seed-data";

const WORKBOOK_NAME = "Pillar5_Aptitude_Test_Core_Design.xlsx";

/** Load .env then .env.local (later wins). Does not override shell-exported vars. */
function loadEnvFiles() {
  const preexisting = new Set(Object.keys(process.env));
  for (const name of [".env", ".env.local"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!preexisting.has(key)) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

/** Turn workbook section titles into URL-safe slugs (e.g. "Profile & Exposure" → "profile-exposure"). */
function slugifySection(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveSections(questions: Question[]) {
  const seen = new Map<string, { slug: string; title: string; order: number }>();
  for (const question of questions) {
    if (seen.has(question.sectionSlug)) continue;
    seen.set(question.sectionSlug, {
      slug: question.sectionSlug,
      title: question.section,
      order: seen.size + 1,
    });
  }
  return [...seen.values()];
}

function mapResponseType(raw: string): Question["responseType"] {
  const normalized = raw.toLowerCase();
  if (normalized.includes("multi")) return "multi";
  return "single";
}

function mapScoringType(raw: string): ScoringType {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "self-report" || normalized === "selfreport") return "Self-report";
  if (normalized === "context" || normalized === "profile") return "Context";
  if (normalized === "consent") return "Consent";
  if (normalized === "exposure") return "Exposure";
  if (normalized === "judgement") return "Judgement";
  if (normalized === "interest") return "Interest";
  return "Objective";
}

/** Airtable ScoringType select uses SelfReport / Profile instead of workbook labels. */
function toAirtableScoringType(scoringType: ScoringType): string {
  if (scoringType === "Self-report") return "SelfReport";
  if (scoringType === "Context") return "Profile";
  return scoringType;
}

function parseScoreMap(scoringKey: string): Map<string, number> {
  const scores = new Map<string, number>();
  for (const match of scoringKey.matchAll(/([A-Z])\s*=\s*(-?\d+(?:\.\d+)?)/g)) {
    scores.set(match[1], Number(match[2]));
  }
  return scores;
}

function parseOptions(answerOptions: string, scoringKey: string): QuestionOption[] {
  const scores = parseScoreMap(scoringKey);
  const options: QuestionOption[] = [];
  for (const line of answerOptions.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z])\.\s*(.+)$/);
    if (!match) continue;
    const key = match[1];
    options.push({
      key,
      label: match[2].trim(),
      scoreValue: scores.get(key) ?? 0,
    });
  }
  return options;
}

async function parseWorkbook(workbookPath: string) {
  const workbook = XLSX.readFile(workbookPath);
  const rolesSheet = workbook.Sheets["Role Families"];
  const weightsSheet = workbook.Sheets["Weighting Matrix"];
  const questionsSheet = workbook.Sheets["Questions"];

  if (!rolesSheet || !weightsSheet || !questionsSheet) {
    throw new Error("Workbook must contain Role Families, Weighting Matrix, and Questions sheets");
  }

  const toRows = (sheet: XLSX.WorkSheet) =>
    XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

  const findHeaderRow = (rows: (string | number)[][], firstHeader: string) => {
    const index = rows.findIndex((row) => String(row[0] ?? "").trim() === firstHeader);
    if (index === -1) {
      throw new Error(`Could not find header row starting with "${firstHeader}"`);
    }
    return index;
  };

  const getString = (row: (string | number)[], index: number) =>
    String(row[index] ?? "").trim();

  const getNumber = (row: (string | number)[], index: number) => {
    const raw = row[index];
    if (typeof raw === "number") return raw;
    const normalized = String(raw ?? "").trim();
    const parsed = normalized.endsWith("%")
      ? Number(normalized.slice(0, -1)) / 100
      : Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const roleRows = toRows(rolesSheet);
  const roleHeaderIndex = findHeaderRow(roleRows, "Role ID");

  const roleFamilies: RoleFamily[] = [];
  for (const row of roleRows.slice(roleHeaderIndex + 1)) {
    const code = getString(row, 0);
    if (!code || !/^[A-Z]{2}$/.test(code)) continue;
    roleFamilies.push({
      roleCode: code,
      name: getString(row, 1) || code,
      description: getString(row, 2),
      exampleRoles: getString(row, 3),
      outputTemplate: getString(row, 5),
    });
  }

  const weightRows = toRows(weightsSheet);
  const weightHeaderIndex = findHeaderRow(weightRows, "Role ID");
  const roleCompetencyWeights: RoleCompetencyWeight[] = [];
  const compCols: { code: string; col: number }[] = [];
  for (const [index, value] of weightRows[weightHeaderIndex].entries()) {
    if (index === 0) continue;
    const code = String(value ?? "").trim();
    if (/^C\d{2}$/.test(code)) compCols.push({ code, col: index });
  }

  for (const row of weightRows.slice(weightHeaderIndex + 1)) {
    const roleCode = getString(row, 0);
    if (!roleCode || !/^[A-Z]{2}$/.test(roleCode)) continue;
    for (const { code, col } of compCols) {
      const raw = getNumber(row, col);
      roleCompetencyWeights.push({
        roleCode,
        competencyCode: code,
        weight: raw > 1 ? raw / 100 : raw,
      });
    }
  }

  const competenciesByCode = new Map<string, Competency>(
    compCols.map(({ code }) => [
      code,
      { code, name: code, definition: `${code} competency` },
    ]),
  );
  const legendHeaderIndex = weightRows.findIndex(
    (row) => getString(row, 0) === "Code" && getString(row, 1) === "Competency",
  );
  if (legendHeaderIndex >= 0) {
    for (const row of weightRows.slice(legendHeaderIndex + 1)) {
      const code = getString(row, 0);
      if (!/^C\d{2}$/.test(code)) continue;
      competenciesByCode.set(code, {
        code,
        name: getString(row, 1) || code,
        definition: getString(row, 4) || `${code} competency`,
      });
    }
  }
  const competencies = [...competenciesByCode.values()];

  const questionRows = toRows(questionsSheet);
  const questionHeaderIndex = findHeaderRow(questionRows, "Question ID");
  const questions: Question[] = [];
  for (const [offset, row] of questionRows.slice(questionHeaderIndex + 1).entries()) {
    const questionId = getString(row, 0);
    if (!questionId) continue;
    const section = getString(row, 2) || "General";
    const scoringKey = getString(row, 9);
    const notes = getString(row, 12) || undefined;
    questions.push({
      questionId,
      order: getNumber(row, 1) || offset + 1,
      section,
      sectionSlug: slugifySection(section),
      text: getString(row, 3),
      responseType: mapResponseType(getString(row, 4)),
      scoringType: mapScoringType(getString(row, 5) || "Objective"),
      primaryCompetency: getString(row, 6) || undefined,
      secondaryCompetency: getString(row, 7) || undefined,
      required: /^y(es)?$/i.test(getString(row, 11) || "Yes"),
      notes,
      options: parseOptions(getString(row, 8), scoringKey),
    });
  }

  return { roleFamilies, competencies, roleCompetencyWeights, questions };
}

function validate(data: {
  roleFamilies: RoleFamily[];
  questions: Question[];
  roleCompetencyWeights: RoleCompetencyWeight[];
}) {
  if (data.roleFamilies.length !== 12) {
    throw new Error(`Expected 12 role families, got ${data.roleFamilies.length}`);
  }
  if (data.questions.length !== 84) {
    throw new Error(`Expected 84 questions, got ${data.questions.length}`);
  }

  const sums = new Map<string, number>();
  for (const w of data.roleCompetencyWeights) {
    sums.set(w.roleCode, (sums.get(w.roleCode) ?? 0) + w.weight);
  }
  for (const [role, sum] of sums) {
    if (Math.abs(sum - 1) > 0.05) {
      console.warn(`Warning: weights for ${role} sum to ${sum.toFixed(3)} (expected ~1.0)`);
    }
  }
}

type CatalogSyncData = {
  roleFamilies: RoleFamily[];
  competencies: Competency[];
  roleCompetencyWeights: RoleCompetencyWeight[];
  questions: Question[];
};

type CatalogData = CatalogSyncData & {
  sections: { slug: string; title: string; order: number }[];
};

async function syncToAirtable(data: CatalogSyncData) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.log("Skipping Airtable sync — credentials not set");
    return;
  }

  const roleRecords = await createRecords(
    AIRTABLE_TABLES.ROLE_FAMILIES,
    data.roleFamilies.map((role) => ({
      [ROLE_FAMILIES_FIELDS.ROLE_CODE]: role.roleCode,
      [ROLE_FAMILIES_FIELDS.NAME]: role.name,
      [ROLE_FAMILIES_FIELDS.DESCRIPTION]: role.description,
      [ROLE_FAMILIES_FIELDS.EXAMPLE_ROLES]: role.exampleRoles,
      [ROLE_FAMILIES_FIELDS.OUTPUT_TEMPLATE]: role.outputTemplate,
    })),
  );
  const roleIds = new Map(
    roleRecords.map((record) => [
      String(record.fields[ROLE_FAMILIES_FIELDS.ROLE_CODE] ?? ""),
      record.id,
    ]),
  );

  const competencyRecords = await createRecords(
    AIRTABLE_TABLES.COMPETENCIES,
    data.competencies.map((competency) => ({
      [COMPETENCIES_FIELDS.CODE]: competency.code,
      [COMPETENCIES_FIELDS.NAME]: competency.name,
      [COMPETENCIES_FIELDS.DEFINITION]: competency.definition,
    })),
  );
  const competencyIds = new Map(
    competencyRecords.map((record) => [
      String(record.fields[COMPETENCIES_FIELDS.CODE] ?? ""),
      record.id,
    ]),
  );

  await createRecords(
    AIRTABLE_TABLES.ROLE_COMPETENCY_WEIGHTS,
    data.roleCompetencyWeights.flatMap((weight) => {
      const roleId = roleIds.get(weight.roleCode);
      const competencyId = competencyIds.get(weight.competencyCode);
      if (!roleId || !competencyId) return [];
      return [
        {
          [ROLE_COMPETENCY_WEIGHTS_FIELDS.ROLE_CODE]: [roleId],
          [ROLE_COMPETENCY_WEIGHTS_FIELDS.COMPETENCY_CODE]: [competencyId],
          [ROLE_COMPETENCY_WEIGHTS_FIELDS.WEIGHT]: weight.weight,
        },
      ];
    }),
  );

  const questionRecords = await createRecords(
    AIRTABLE_TABLES.QUESTIONS,
    data.questions.map((question) => {
      const fields: Record<string, unknown> = {
        [QUESTIONS_FIELDS.QUESTION_ID]: question.questionId,
        [QUESTIONS_FIELDS.ORDER]: question.order,
        [QUESTIONS_FIELDS.SECTION]: question.section,
        [QUESTIONS_FIELDS.TEXT]: question.text,
        [QUESTIONS_FIELDS.RESPONSE_TYPE]: question.responseType,
        [QUESTIONS_FIELDS.SCORING_TYPE]: toAirtableScoringType(question.scoringType),
        [QUESTIONS_FIELDS.REQUIRED]: question.required,
      };
      if (question.primaryCompetency) {
        fields[QUESTIONS_FIELDS.PRIMARY_COMPETENCY] = question.primaryCompetency;
      }
      if (question.secondaryCompetency) {
        fields[QUESTIONS_FIELDS.SECONDARY_COMPETENCY] = question.secondaryCompetency;
      }
      if (question.notes) {
        fields[QUESTIONS_FIELDS.NOTES] = question.notes;
      }
      return fields;
    }),
  );
  const questionIds = new Map(
    questionRecords.map((record) => [
      String(record.fields[QUESTIONS_FIELDS.QUESTION_ID] ?? ""),
      record.id,
    ]),
  );

  const optionFields = data.questions.flatMap((question) => {
    const questionId = questionIds.get(question.questionId);
    if (!questionId) return [];
    return question.options.map((option) => ({
      [QUESTION_OPTIONS_FIELDS.QUESTION_ID]: [questionId],
      [QUESTION_OPTIONS_FIELDS.KEY]: option.key,
      [QUESTION_OPTIONS_FIELDS.LABEL]: option.label,
      [QUESTION_OPTIONS_FIELDS.SCORE_VALUE]: option.scoreValue,
      ...(option.mapsTo?.length
        ? { [QUESTION_OPTIONS_FIELDS.MAPS_TO]: option.mapsTo.join(", ") }
        : {}),
    }));
  });
  if (optionFields.length > 0) {
    await createRecords(AIRTABLE_TABLES.QUESTION_OPTIONS, optionFields);
  }

  console.log(
    `Synced catalog to Airtable: ${data.roleFamilies.length} roles, ${data.competencies.length} competencies, ${data.roleCompetencyWeights.length} weights, ${data.questions.length} questions, ${optionFields.length} options`,
  );
}

async function main() {
  const workbookPath = join(process.cwd(), WORKBOOK_NAME);
  const outDir = join(process.cwd(), "lib", "data");
  const syncAirtable = process.argv.includes("--sync-airtable");

  let data: CatalogData;
  if (existsSync(workbookPath)) {
    console.log(`Parsing workbook: ${workbookPath}`);
    const parsed = await parseWorkbook(workbookPath);
    const { writeFileSync, mkdirSync } = await import("node:fs");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "role-families.json"), JSON.stringify(parsed.roleFamilies, null, 2));
    writeFileSync(join(outDir, "competencies.json"), JSON.stringify(parsed.competencies, null, 2));
    writeFileSync(join(outDir, "role-competency-weights.json"), JSON.stringify(parsed.roleCompetencyWeights, null, 2));
    writeFileSync(join(outDir, "questions.json"), JSON.stringify(parsed.questions, null, 2));
    const sections = deriveSections(parsed.questions);
    writeFileSync(join(outDir, "sections.json"), JSON.stringify(sections, null, 2));
    data = { ...parsed, sections };
    validate(parsed);
  } else {
    console.log(`Workbook not found — generating seed data`);
    data = writeSeedFiles(outDir);
    validate(data);
  }

  console.log(
    `Import complete: ${data.roleFamilies.length} roles, ${data.questions.length} questions`,
  );

  if (syncAirtable) {
    await syncToAirtable(data);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
