const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "202609250001_textbook_catalog.sql"), "utf8");
const official = JSON.parse(fs.readFileSync(path.join(root, "knowledge_base", "gov_kz_textbooks_1_11_official.json"), "utf8")).records || [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const id of [
  "textbookCatalog", "catalogGrade", "catalogLanguage", "catalogPathway", "catalogSubject",
  "catalogSearch", "textbookCardList", "selectedTextbook", "subjectActionPanel", "myTextbookList",
  "textbookPageForm", "homeworkTracker", "homeworkList"
]) {
  assert(html.includes(`id="${id}"`), `Missing textbook module element: ${id}`);
}

for (const phrase of ["Это мой учебник", "О книге", "mamaAiTextbookSelections", "selectedTextbook", "saveTextbookSelection"]) {
  assert(script.includes(phrase), `Missing textbook behavior: ${phrase}`);
}

assert(server.includes("selectedTextbook"), "Server does not pass selected textbook to AI");
assert(migration.includes("textbook_catalog"), "Missing cloud textbook catalog table");
assert(migration.includes("user_textbook_selections"), "Missing cloud textbook selection table");
assert(official.length >= 250, `Official catalog too small: ${official.length}`);
assert(official.some((record) => record.instructionLanguage === "ru"), "Russian-medium official catalog is missing");
assert(official.some((record) => record.instructionLanguage === "kk"), "Kazakh-medium official catalog is missing");

for (let grade = 1; grade <= 11; grade += 1) {
  assert(official.some((record) => record.grade === grade && record.instructionLanguage === "ru"), `Missing Russian-medium records for Grade ${grade}`);
  assert(official.some((record) => record.grade === grade && record.instructionLanguage === "kk"), `Missing Kazakh-medium records for Grade ${grade}`);
}

for (const record of official) {
  assert(record.grade >= 1 && record.grade <= 11, `Invalid grade for ${record.id}`);
  assert(["ru", "kk"].includes(record.instructionLanguage), `Missing instruction language for ${record.id}`);
  assert(["general", "emn", "ogn"].includes(record.pathway), `Invalid pathway for ${record.id}`);
  assert(["free", "view", "registration_required", "paid", "requires_review"].includes(record.accessStatus), `Invalid access status for ${record.id}`);
  assert(["current", "review", "archived"].includes(record.actualityStatus), `Invalid actuality status for ${record.id}`);
  assert(record.academicYear === "2026-2027", `Wrong academic year for ${record.id}`);
}

console.log(`textbook module check passed; official=${official.length}`);
