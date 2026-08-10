const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const workspaceRoot = path.resolve(__dirname, "..", "..");
const publicDir = path.join(workspaceRoot, "mama_ai_public_static");

function fail(message) {
  throw new Error(message);
}

for (const fileName of ["index.html", "style.css", "config.js", "supabase-client.js", "i18n.js", "script.js", "official_textbooks.js"]) {
  const filePath = path.join(publicDir, fileName);
  if (!fs.existsSync(filePath)) fail(`Missing public file: ${fileName}`);
}

const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
if (!html.includes("official_textbooks.js")) fail("index.html does not load official_textbooks.js");
if (!html.includes("config.js")) fail("index.html does not load config.js");
if (!html.includes("supabase-client.js")) fail("index.html does not load supabase-client.js");
if (html.includes("10 июля 2026")) fail("index.html still contains hard-coded old date");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(publicDir, "official_textbooks.js"), "utf8"), context);
const officialCatalog = context.window.OFFICIAL_TEXTBOOK_CATALOG || [];
if (officialCatalog.length < 250) fail(`Official catalog too small: ${officialCatalog.length}`);

function extractUserCatalog() {
  const script = fs.readFileSync(path.join(publicDir, "script.js"), "utf8");
  const marker = "const userTextbookCatalog = ";
  const start = script.indexOf(marker);
  if (start === -1) fail("Cannot find userTextbookCatalog in public script.js");
  let index = start + marker.length;
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (; index < script.length; index += 1) {
    const char = script[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) inString = false;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) return vm.runInNewContext(`(${script.slice(start + marker.length, index + 1)})`);
    }
  }
  fail("Cannot parse userTextbookCatalog");
}

const userCatalog = extractUserCatalog();
const catalog = [...officialCatalog, ...userCatalog];

function hasRecord(grade, subjectKey, keyword = "") {
  const needle = keyword.toLowerCase();
  return catalog.some((record) => (
    record.grade === grade
    && record.subjectKey === subjectKey
    && (!needle || JSON.stringify(record).toLowerCase().includes(needle))
  ));
}

const checks = [
  [3, "world_knowledge"],
  [5, "math"],
  [5, "english", "Excel"],
  [5, "history_kz"],
  [5, "world_history"],
  [5, "science"],
  [6, "informatics"],
  [6, "russian"],
  [6, "world_history"],
  [10, "calculus"],
  [11, "physics"]
];

for (const [grade, subject, keyword] of checks) {
  if (!hasRecord(grade, subject, keyword)) {
    fail(`No official public record for grade=${grade}, subject=${subject}, keyword=${keyword}`);
  }
}

console.log(`static public check passed; official=${officialCatalog.length}; user=${userCatalog.length}`);
