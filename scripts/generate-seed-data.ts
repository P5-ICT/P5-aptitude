import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROLE_CODES = ["AO", "FA", "DA", "IT", "MC", "SC", "PC", "HR", "BD", "EN", "LS", "PT"] as const;

const ROLE_NAMES: Record<string, string> = {
  AO: "Administration & Operations",
  FA: "Finance & Accounting",
  DA: "Data & Analytics",
  IT: "Information Technology",
  MC: "Marketing & Communications",
  SC: "Supply Chain & Logistics",
  PC: "Project Coordination",
  HR: "Human Resources",
  BD: "Business Development",
  EN: "Engineering",
  LS: "Legal & Compliance",
  PT: "People & Talent",
};

const COMPETENCY_NAMES: Record<string, string> = {
  C01: "Analytical Thinking",
  C02: "Communication",
  C03: "Collaboration",
  C04: "Customer Focus",
  C05: "Execution",
  C06: "Innovation",
  C07: "Leadership",
  C08: "Technical Proficiency",
  C09: "Risk & Compliance",
  C10: "Commercial Acumen",
};

const SECTIONS = [
  { slug: "consent-profile", title: "Consent & Profile", order: 1 },
  { slug: "exposure", title: "Experience & Exposure", order: 2 },
  { slug: "objective-1", title: "Knowledge Check I", order: 3 },
  { slug: "objective-2", title: "Knowledge Check II", order: 4 },
  { slug: "judgement-1", title: "Situational Judgement I", order: 5 },
  { slug: "judgement-2", title: "Situational Judgement II", order: 6 },
  { slug: "judgement-3", title: "Situational Judgement III", order: 7 },
  { slug: "self-report", title: "Work Style", order: 8 },
  { slug: "interest", title: "Career Interests", order: 9 },
];

function generateRoleFamilies() {
  return ROLE_CODES.map((code) => ({
    roleCode: code,
    name: ROLE_NAMES[code],
    description: `Pathway for ${ROLE_NAMES[code]} roles at Pillar 5.`,
    exampleRoles: `${ROLE_NAMES[code]} Specialist, ${ROLE_NAMES[code]} Lead`,
    outputTemplate: `Consider a development conversation focused on ${ROLE_NAMES[code]} competencies.`,
  }));
}

function generateCompetencies() {
  return Object.entries(COMPETENCY_NAMES).map(([code, name]) => ({
    code,
    name,
    definition: `Demonstrates ${name.toLowerCase()} in work contexts.`,
  }));
}

function generateWeights() {
  const weights: { roleCode: string; competencyCode: string; weight: number }[] = [];
  const codes = Object.keys(COMPETENCY_NAMES);
  for (let r = 0; r < ROLE_CODES.length; r++) {
    const roleCode = ROLE_CODES[r];
    const raw = codes.map((_, i) => ((r + 1) * (i + 1)) % 7 + 3);
    const sum = raw.reduce((a, b) => a + b, 0);
    codes.forEach((competencyCode, i) => {
      weights.push({
        roleCode,
        competencyCode,
        weight: Math.round((raw[i] / sum) * 1000) / 1000,
      });
    });
  }
  return weights;
}

function optionKeys(count: number) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

function generateQuestions() {
  const questions: object[] = [];
  let order = 1;

  questions.push({
    questionId: "P001",
    order: order++,
    section: SECTIONS[0].title,
    sectionSlug: SECTIONS[0].slug,
    text: "Do you consent to participate in this aptitude assessment?",
    responseType: "single",
    scoringType: "Consent",
    required: true,
    options: [
      { key: "yes", label: "Yes, I consent", scoreValue: 0 },
      { key: "no", label: "No, I do not consent", scoreValue: 0 },
    ],
  });

  questions.push({
    questionId: "P002",
    order: order++,
    section: SECTIONS[0].title,
    sectionSlug: SECTIONS[0].slug,
    text: "How many years have you worked in your current field?",
    responseType: "single",
    scoringType: "Context",
    required: true,
    options: ["0-2", "3-5", "6-10", "10+"].map((label, i) => ({
      key: optionKeys(4)[i],
      label,
      scoreValue: 0,
    })),
  });

  const exposureQs = [
    { id: "P003", text: "Depth of experience in operations roles?", type: "depth" },
    { id: "P004", text: "Years of cross-functional project exposure?", type: "experience" },
    { id: "P005", text: "Depth of experience in technical roles?", type: "depth" },
    { id: "P006", text: "Years of client-facing experience?", type: "experience" },
  ];

  for (const eq of exposureQs) {
    const opts =
      eq.type === "depth"
        ? ["none", "basic", "moderate", "advanced"]
        : ["0", "1-2", "3-5", "6+"];
    questions.push({
      questionId: eq.id,
      order: order++,
      section: SECTIONS[1].title,
      sectionSlug: SECTIONS[1].slug,
      text: eq.text,
      responseType: "single",
      scoringType: "Exposure",
      required: true,
      options: opts.map((label) => ({ key: label, label, scoreValue: 0 })),
    });
  }

  const compCodes = Object.keys(COMPETENCY_NAMES);
  let objCount = 0;
  let judgeCount = 0;
  let selfCount = 0;
  let interestCount = 0;

  while (
    objCount < 22 ||
    judgeCount < 32 ||
    selfCount < 12 ||
    interestCount < 12
  ) {
    if (objCount < 22) {
      const id = `O${String(objCount + 1).padStart(3, "0")}`;
      const section = objCount < 11 ? SECTIONS[2] : SECTIONS[3];
      const primary = compCodes[objCount % compCodes.length];
      const secondary = compCodes[(objCount + 3) % compCodes.length];
      questions.push({
        questionId: id,
        order: order++,
        section: section.title,
        sectionSlug: section.slug,
        text: `Objective question ${objCount + 1}: Select the best response.`,
        responseType: "single",
        scoringType: "Objective",
        primaryCompetency: primary,
        secondaryCompetency: secondary,
        required: true,
        options: optionKeys(4).map((key, i) => ({
          key,
          label: `Option ${key}`,
          scoreValue: 4 - i,
        })),
      });
      objCount++;
    }

    if (judgeCount < 32) {
      const id = `J${String(judgeCount + 1).padStart(3, "0")}`;
      const section =
        judgeCount < 11
          ? SECTIONS[4]
          : judgeCount < 22
            ? SECTIONS[5]
            : SECTIONS[6];
      const primary = compCodes[judgeCount % compCodes.length];
      questions.push({
        questionId: id,
        order: order++,
        section: section.title,
        sectionSlug: section.slug,
        text: `Judgement scenario ${judgeCount + 1}: What would you do?`,
        responseType: "single",
        scoringType: "Judgement",
        primaryCompetency: primary,
        secondaryCompetency: compCodes[(judgeCount + 5) % compCodes.length],
        required: true,
        options: optionKeys(4).map((key, i) => ({
          key,
          label: `Response ${key}`,
          scoreValue: 3 - i,
        })),
      });
      judgeCount++;
    }

    if (selfCount < 12) {
      const id = `S${String(selfCount + 1).padStart(3, "0")}`;
      questions.push({
        questionId: id,
        order: order++,
        section: SECTIONS[7].title,
        sectionSlug: SECTIONS[7].slug,
        text: `Self-report ${selfCount + 1}: How do you prefer to work?`,
        responseType: "single",
        scoringType: "Self-report",
        required: true,
        options: optionKeys(4).map((key) => ({
          key,
          label: `Style ${key}`,
          scoreValue: 0,
        })),
      });
      selfCount++;
    }

    if (interestCount < 12) {
      const id = `I${String(interestCount + 1).padStart(3, "0")}`;
      questions.push({
        questionId: id,
        order: order++,
        section: SECTIONS[8].title,
        sectionSlug: SECTIONS[8].slug,
        text: `Interest ${interestCount + 1}: Which activities appeal to you most?`,
        responseType: "single",
        scoringType: "Interest",
        required: true,
        options: optionKeys(4).map((key) => ({
          key,
          label: `Activity ${key}`,
          scoreValue: 0,
        })),
      });
      interestCount++;
    }
  }

  return questions;
}

export function generateSeedData() {
  return {
    roleFamilies: generateRoleFamilies(),
    competencies: generateCompetencies(),
    roleCompetencyWeights: generateWeights(),
    questions: generateQuestions(),
    sections: SECTIONS,
  };
}

export function writeSeedFiles(outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const data = generateSeedData();
  writeFileSync(join(outDir, "role-families.json"), JSON.stringify(data.roleFamilies, null, 2));
  writeFileSync(join(outDir, "competencies.json"), JSON.stringify(data.competencies, null, 2));
  writeFileSync(
    join(outDir, "role-competency-weights.json"),
    JSON.stringify(data.roleCompetencyWeights, null, 2),
  );
  writeFileSync(join(outDir, "questions.json"), JSON.stringify(data.questions, null, 2));
  writeFileSync(join(outDir, "sections.json"), JSON.stringify(data.sections, null, 2));
  return data;
}

if (require.main === module) {
  const out = join(process.cwd(), "lib", "data");
  const data = writeSeedFiles(out);
  console.log(`Generated seed data: ${data.questions.length} questions, ${data.roleFamilies.length} roles`);
}
