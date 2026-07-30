import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { createRecords } from "../lib/airtable/client";
import { AIRTABLE_TABLES } from "../lib/airtable/tables";
import { writeSeedFiles } from "./generate-seed-data";

const WORKBOOK_NAME = "Pillar5_Aptitude_Test_Core_Design.xlsx";

async function parseWorkbook(workbookPath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const rolesSheet = workbook.getWorksheet("Role Families");
  const weightsSheet = workbook.getWorksheet("Weighting Matrix");
  const questionsSheet = workbook.getWorksheet("Questions");

  if (!rolesSheet || !weightsSheet || !questionsSheet) {
    throw new Error("Workbook must contain Role Families, Weighting Matrix, and Questions sheets");
  }

  const roleFamilies: object[] = [];
  rolesSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const code = String(row.getCell(1).value ?? "").trim();
    if (!code) return;
    roleFamilies.push({
      roleCode: code,
      name: String(row.getCell(2).value ?? code),
      description: String(row.getCell(3).value ?? ""),
      exampleRoles: String(row.getCell(4).value ?? ""),
      outputTemplate: String(row.getCell(5).value ?? ""),
    });
  });

  const competencies = [
    "C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10",
  ].map((code) => ({
    code,
    name: code,
    definition: `${code} competency`,
  }));

  const roleCompetencyWeights: object[] = [];
  const headerRow = weightsSheet.getRow(1);
  const compCols: { code: string; col: number }[] = [];
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber === 1) return;
    const code = String(cell.value ?? "").trim();
    if (code.startsWith("C")) compCols.push({ code, col: colNumber });
  });

  weightsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const roleCode = String(row.getCell(1).value ?? "").trim();
    if (!roleCode) return;
    for (const { code, col } of compCols) {
      const raw = Number(row.getCell(col).value ?? 0);
      roleCompetencyWeights.push({
        roleCode,
        competencyCode: code,
        weight: raw > 1 ? raw / 100 : raw,
      });
    }
  });

  const questions: object[] = [];
  questionsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const questionId = String(row.getCell(1).value ?? "").trim();
    if (!questionId) return;
    const section = String(row.getCell(3).value ?? "General");
    questions.push({
      questionId,
      order: Number(row.getCell(2).value ?? rowNumber - 1),
      section,
      sectionSlug: section.toLowerCase().replace(/\s+/g, "-"),
      text: String(row.getCell(4).value ?? ""),
      responseType: "single",
      scoringType: String(row.getCell(6).value ?? "Objective"),
      primaryCompetency: String(row.getCell(7).value ?? "") || undefined,
      secondaryCompetency: String(row.getCell(8).value ?? "") || undefined,
      required: true,
      options: [
        { key: "A", label: "Option A", scoreValue: 4 },
        { key: "B", label: "Option B", scoreValue: 3 },
        { key: "C", label: "Option C", scoreValue: 2 },
        { key: "D", label: "Option D", scoreValue: 1 },
      ],
    });
  });

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
