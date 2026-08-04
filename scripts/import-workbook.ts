import { existsSync } from "node:fs";
import { join } from "node:path";
import XLSX from "xlsx";
import { createRecords } from "../lib/airtable/client";
import { AIRTABLE_TABLES } from "../lib/airtable/tables";
import { writeSeedFiles } from "./generate-seed-data";

const WORKBOOK_NAME = "Pillar5_Aptitude_Test_Core_Design.xlsx";

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

  const roleFamilies: object[] = [];
  for (const row of roleRows.slice(roleHeaderIndex + 1)) {
    const code = getString(row, 0);
    if (!code) continue;
    roleFamilies.push({
      roleCode: code,
      name: getString(row, 1) || code,
      description: getString(row, 2),
      exampleRoles: getString(row, 3),
      outputTemplate: getString(row, 5),
    });
  }

  const competencies = [
    "C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10",
  ].map((code) => ({
    code,
    name: code,
    definition: `${code} competency`,
  }));

  const weightRows = toRows(weightsSheet);
  const weightHeaderIndex = findHeaderRow(weightRows, "Role ID");
  const roleCompetencyWeights: object[] = [];
  const compCols: { code: string; col: number }[] = [];
  for (const [index, value] of weightRows[weightHeaderIndex].entries()) {
    if (index === 0) continue;
    const code = String(value ?? "").trim();
    if (code.startsWith("C")) compCols.push({ code, col: index });
  }

  for (const row of weightRows.slice(weightHeaderIndex + 1)) {
    const roleCode = getString(row, 0);
    if (!roleCode) continue;
    if (!/^[A-Z]{2}$/.test(roleCode)) continue;
    for (const { code, col } of compCols) {
      const raw = getNumber(row, col);
      roleCompetencyWeights.push({
        roleCode,
        competencyCode: code,
        weight: raw > 1 ? raw / 100 : raw,
      });
    }
  }

  const questionRows = toRows(questionsSheet);
  const questionHeaderIndex = findHeaderRow(questionRows, "Question ID");
  const questions: object[] = [];
  for (const [offset, row] of questionRows.slice(questionHeaderIndex + 1).entries()) {
    const questionId = getString(row, 0);
    if (!questionId) continue;
    const section = getString(row, 2) || "General";
    questions.push({
      questionId,
      order: getNumber(row, 1) || offset + 1,
      section,
      sectionSlug: section.toLowerCase().replace(/\s+/g, "-"),
      text: getString(row, 3),
      responseType: getString(row, 4) || "single",
      scoringType: getString(row, 5) || "Objective",
      primaryCompetency: getString(row, 6) || undefined,
      secondaryCompetency: getString(row, 7) || undefined,
      required: /^y(es)?$/i.test(getString(row, 11) || "Yes"),
      options: [
        { key: "A", label: "Option A", scoreValue: 4 },
        { key: "B", label: "Option B", scoreValue: 3 },
        { key: "C", label: "Option C", scoreValue: 2 },
        { key: "D", label: "Option D", scoreValue: 1 },
      ],
    });
  }

  return { roleFamilies, competencies, roleCompetencyWeights, questions };
}

function validate(data: {
  roleFamilies: object[];
  questions: object[];
  roleCompetencyWeights: { roleCode: string; weight: number }[];
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

async function syncToAirtable(data: ReturnType<typeof writeSeedFiles>) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.log("Skipping Airtable sync — credentials not set");
    return;
  }

  await createRecords(AIRTABLE_TABLES.ROLE_FAMILIES, data.roleFamilies as never);
  await createRecords(AIRTABLE_TABLES.COMPETENCIES, data.competencies as never);
  await createRecords(
    AIRTABLE_TABLES.ROLE_COMPETENCY_WEIGHTS,
    data.roleCompetencyWeights as never,
  );
  await createRecords(AIRTABLE_TABLES.QUESTIONS, data.questions as never);
  console.log("Synced catalog to Airtable");
}

async function main() {
  const workbookPath = join(process.cwd(), WORKBOOK_NAME);
  const outDir = join(process.cwd(), "lib", "data");
  const syncAirtable = process.argv.includes("--sync-airtable");

  let data;
  if (existsSync(workbookPath)) {
    console.log(`Parsing workbook: ${workbookPath}`);
    const parsed = await parseWorkbook(workbookPath);
    const { writeFileSync, mkdirSync, readFileSync: readFs } = await import("node:fs");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "role-families.json"), JSON.stringify(parsed.roleFamilies, null, 2));
    writeFileSync(join(outDir, "competencies.json"), JSON.stringify(parsed.competencies, null, 2));
    writeFileSync(join(outDir, "role-competency-weights.json"), JSON.stringify(parsed.roleCompetencyWeights, null, 2));
    writeFileSync(join(outDir, "questions.json"), JSON.stringify(parsed.questions, null, 2));
    const sectionsPath = join(outDir, "sections.json");
    const sections = existsSync(sectionsPath)
      ? JSON.parse(readFs(sectionsPath, "utf8"))
      : [];
    data = { ...parsed, sections };
    validate(parsed as never);
  } else {
    console.log(`Workbook not found — generating seed data`);
    data = writeSeedFiles(outDir);
    validate(data as never);
  }

  console.log(
    `Import complete: ${data.roleFamilies.length} roles, ${data.questions.length} questions`,
  );

  if (syncAirtable) {
    await syncToAirtable(data as never);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
