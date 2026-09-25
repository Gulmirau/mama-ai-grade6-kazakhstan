const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const officialPath = path.join(root, "knowledge_base", "gov_kz_textbooks_1_11_official.json");
const userPaths = [
  path.join(root, "knowledge_base", "grade6_textbooks_from_photos.json"),
  path.join(root, "knowledge_base", "grade3_5_textbooks_from_scans.json")
];

function readRecords(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return payload.records || [];
}

function materialType(record) {
  if (record.materialType) return record.materialType;
  if (record.entityType === "workbook") return "workbook";
  const title = String(record.title || "").toLowerCase();
  if (title.includes("рабочая тетрад") || title.includes("workbook") || title.includes("activity book")) return "workbook";
  if (title.includes("атлас")) return "atlas";
  if (title.includes("контур") && title.includes("карт")) return "contour_maps";
  return "main_textbook";
}

function hasDirectLink(record) {
  return Boolean(record.electronicUrl || record.links?.some((link) => link.url) || /^https:\/\//.test(record.downloadableResource || ""));
}

function instructionLanguage(record) {
  return record.instructionLanguage || (record.language === "kk" ? "kk" : "ru");
}

const official = readRecords(officialPath);
const user = userPaths.flatMap(readRecords);
const records = [...official, ...user];
const primary = records.filter((record) => materialType(record) === "main_textbook");
const additional = records.filter((record) => materialType(record) !== "main_textbook");
const review = records.filter((record) => !["official_verified_metadata", "verified_reference", "publisher_verified"].includes(record.verificationStatus || record.status));
const withoutDirectLink = records.filter((record) => !hasDirectLink(record));
const subjectKeys = new Set(records.map((record) => record.subject || record.subjectKey).filter(Boolean));
const gradeRows = Array.from({ length: 11 }, (_, index) => {
  const grade = index + 1;
  const gradeRecords = records.filter((record) => Number(record.grade) === grade);
  return {
    grade,
    records: gradeRecords.length,
    ru: gradeRecords.filter((record) => instructionLanguage(record) === "ru").length,
    kk: gradeRecords.filter((record) => instructionLanguage(record) === "kk").length,
    subjects: new Set(gradeRecords.map((record) => record.subject || record.subjectKey).filter(Boolean)).size,
    needsReview: gradeRecords.filter((record) => review.includes(record)).length
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  targetAcademicYear: "2026-2027",
  sources: [
    "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=ru",
    "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=kk"
  ],
  officialSourceCheckedAt: official[0]?.checkedAt || null,
  classes: new Set(records.map((record) => record.grade)).size,
  subjects: subjectKeys.size,
  textbooks: primary.length,
  workbooksAndAdditionalMaterials: additional.length,
  recordsWithoutDirectElectronicLink: withoutDirectLink.length,
  recordsRequiringManualReview: review.length,
  officialRecords: official.length,
  userProvidedRecords: user.length,
  focusGrades: {
    grade3: gradeRows[2],
    grade7: gradeRows[6]
  },
  byGrade: gradeRows
};

const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, "textbook-catalog-summary.json"), JSON.stringify(summary, null, 2), "utf8");

const lines = [
  "# Textbook Catalog Summary",
  "",
  `Generated: ${summary.generatedAt}`,
  `Target academic year: ${summary.targetAcademicYear}`,
  `Official source checked: ${summary.officialSourceCheckedAt}`,
  `Official catalogs: ${summary.sources.join(", ")}`,
  "",
  `- Classes: ${summary.classes}`,
  `- Subjects: ${summary.subjects}`,
  `- Main textbooks: ${summary.textbooks}`,
  `- Workbooks and additional materials: ${summary.workbooksAndAdditionalMaterials}`,
  `- Records without a direct electronic link: ${summary.recordsWithoutDirectElectronicLink}`,
  `- Records requiring manual review: ${summary.recordsRequiringManualReview}`,
  "",
  "| Grade | Records | Russian instruction | Kazakh instruction | Subjects | Needs review |",
  "| ---: | ---: | ---: | ---: | ---: | ---: |",
  ...gradeRows.map((row) => `| ${row.grade} | ${row.records} | ${row.ru} | ${row.kk} | ${row.subjects} | ${row.needsReview} |`),
  "",
  "Official metadata and links do not grant permission to index full textbook content. Full text remains excluded until lawful use is confirmed."
];
fs.writeFileSync(path.join(reportsDir, "textbook-catalog-summary.md"), lines.join("\n"), "utf8");

console.log(JSON.stringify(summary, null, 2));
