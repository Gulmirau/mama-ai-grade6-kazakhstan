const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scriptText = fs.readFileSync(path.join(root, "script.js"), "utf8");
const officialText = fs.readFileSync(path.join(root, "official_textbooks.js"), "utf8");

function extractConst(name) {
  const marker = `const ${name} = `;
  const start = scriptText.indexOf(marker);
  if (start === -1) throw new Error(`Cannot find ${name}`);
  let index = start + marker.length;
  const open = scriptText[index];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (; index < scriptText.length; index += 1) {
    const char = scriptText[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
    } else if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return scriptText.slice(start + marker.length, index + 1);
      }
    }
  }
  throw new Error(`Cannot parse ${name}`);
}

function loadOfficialCatalog() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(officialText, context);
  return context.window.OFFICIAL_TEXTBOOK_CATALOG || [];
}

function loadScriptData() {
  return {
    gradeSubjectGroups: vm.runInNewContext(`(${extractConst("gradeSubjectGroups")})`),
    userTextbookCatalog: vm.runInNewContext(`(${extractConst("userTextbookCatalog")})`)
  };
}

function subjectToKey(title) {
  const known = {
    "Обучение грамоте": "literacy",
    "Математика": "math",
    "Русский язык": "russian",
    "Казахский язык": "kazakh",
    "Казахская литература": "kazakh_literature",
    "Английский язык": "english",
    "Познание мира": "world_knowledge",
    "Литературное чтение": "reading",
    "Русская литература": "russian_literature",
    "Естествознание": "science",
    "История Казахстана": "history_kz",
    "География": "geography",
    "Информатика": "informatics",
    "Цифровая грамотность": "digital_literacy",
    "Алгебра": "algebra",
    "Геометрия": "geometry",
    "Физика": "physics",
    "Химия": "chemistry",
    "Биология": "biology",
    "Всемирная история": "world_history",
    "Музыка": "music",
    "Художественный труд": "art_labor",
    "Физическая культура": "physical_education",
    "Основы права": "law",
    "Глобальные компетенции": "global_competencies",
    "Начальная военная и технологическая подготовка": "nvtp",
    "Основы предпринимательства и бизнеса": "business",
    "Графика и проектирование": "graphics_design",
    "Алгебра и начала анализа": "calculus",
    "Подготовка к ЕНТ": "ent"
  };
  return known[title] || title.toLowerCase().replace(/\s+/g, "_");
}

function aliasesFor(title) {
  const key = subjectToKey(title);
  const aliases = {
    art_labor: ["art_labor", "labor_training", "visual_art"],
    reading: ["reading", "russian_literature"],
    kazakh: ["kazakh", "kazakh_literature"]
  };
  return aliases[key] || [key];
}

function inferMaterialType(record) {
  if (record.materialType) return record.materialType;
  const title = (record.title || "").toLowerCase();
  if (title.includes("workbook") || title.includes("grammar book") || title.includes("рабочая тетрад")) return "workbook";
  if (title.includes("хрестомат")) return "reader";
  if (title.includes("атлас")) return "atlas";
  if (title.includes("контур") && title.includes("карт")) return "contour_maps";
  if (title.includes("тренаж")) return "trainer";
  return "main_textbook";
}

function recordsFor(catalog, grade, subject) {
  const aliases = aliasesFor(subject);
  return catalog.filter((record) => record.grade === grade && (record.subject === subject || aliases.includes(record.subjectKey)));
}

function buildCoverage() {
  const { gradeSubjectGroups, userTextbookCatalog } = loadScriptData();
  const officialCatalog = loadOfficialCatalog();
  const catalog = [...officialCatalog, ...userTextbookCatalog];
  const rows = [];

  for (let grade = 1; grade <= 11; grade += 1) {
    const subjects = gradeSubjectGroups[grade] || [];
    let withMain = 0;
    let partial = 0;
    let noSource = 0;
    const subjectRows = [];

    for (const subject of subjects) {
      const records = recordsFor(catalog, grade, subject);
      const hasMain = records.some((record) => inferMaterialType(record) === "main_textbook");
      const hasAdditional = records.some((record) => inferMaterialType(record) !== "main_textbook");
      if (hasMain) withMain += 1;
      else if (hasAdditional) partial += 1;
      else noSource += 1;
      subjectRows.push({ subject, records: records.length, hasMain, hasAdditional });
    }

    rows.push({
      grade,
      subjects: subjects.length,
      withMain,
      partial,
      noSource,
      percent: subjects.length ? Math.round(((withMain + partial) / subjects.length) * 100) : 0,
      subjectRows
    });
  }

  return { rows, officialCatalog, userTextbookCatalog, gradeSubjectGroups, catalog };
}

function writeCoverageReport() {
  const { rows, officialCatalog, userTextbookCatalog } = buildCoverage();
  const reportsDir = path.join(root, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const now = new Date().toISOString();
  const lines = [
    "# Mama AI Content Coverage",
    "",
    `Generated: ${now}`,
    "",
    `Official catalog records: ${officialCatalog.length}`,
    `User-provided records: ${userTextbookCatalog.length}`,
    "",
    "| Класс | Предметов | С учебником | Частично | Нет источника | Наполнение |",
    "| ----- | --------: | ----------: | -------: | ------------: | ---------: |",
    ...rows.map((row) => `| ${row.grade} | ${row.subjects} | ${row.withMain} | ${row.partial} | ${row.noSource} | ${row.percent}% |`),
    "",
    "## Detail By Grade",
    ""
  ];

  for (const row of rows) {
    lines.push(`### ${row.grade} класс`, "");
    lines.push("| Предмет | Материалов | Статус |");
    lines.push("| ------- | ---------: | ------ |");
    for (const subject of row.subjectRows) {
      const status = subject.hasMain ? "main textbook found" : subject.hasAdditional ? "additional only" : "no verified source";
      lines.push(`| ${subject.subject} | ${subject.records} | ${status} |`);
    }
    lines.push("");
  }

  fs.writeFileSync(path.join(reportsDir, "content-coverage.md"), lines.join("\n"), "utf8");
  return { rows, officialCatalog, userTextbookCatalog };
}

function assertContent() {
  const { catalog, gradeSubjectGroups, userTextbookCatalog } = buildCoverage();
  const errors = [];
  const mustHave = {
    3: ["Познание мира"],
    5: ["Математика", "Английский язык", "История Казахстана", "Всемирная история", "Естествознание"],
    6: ["Информатика", "Всемирная история", "Естествознание", "Русский язык", "Русская литература", "Английский язык", "Художественный труд"]
  };

  for (let grade = 1; grade <= 11; grade += 1) {
    const subjects = gradeSubjectGroups[grade];
    if (!Array.isArray(subjects) || subjects.length === 0) {
      errors.push(`${grade} класс: нет списка предметов`);
      continue;
    }
    for (const subject of subjects) {
      for (let otherGrade = 1; otherGrade <= 11; otherGrade += 1) {
        if (otherGrade === grade) continue;
        const wrong = recordsFor(catalog, grade, subject).some((record) => record.grade !== grade);
        if (wrong) errors.push(`${grade} класс/${subject}: найден материал другого класса`);
      }
    }
  }

  for (const [gradeText, subjects] of Object.entries(mustHave)) {
    const grade = Number(gradeText);
    for (const subject of subjects) {
      if (!gradeSubjectGroups[grade].includes(subject)) {
        errors.push(`${grade} класс: нет предмета ${subject}`);
      }
      if (!recordsFor(catalog, grade, subject).length) {
        errors.push(`${grade} класс/${subject}: нет материалов`);
      }
    }
  }

  const grade6Titles = userTextbookCatalog.filter((record) => record.grade === 6).map((record) => record.title).join("\n");
  for (const required of ["Информатика", "Всемирная история", "Естествознание", "Русский язык", "Русская литература", "Excel for Kazakhstan", "Художественный труд"]) {
    if (!grade6Titles.toLowerCase().includes(required.toLowerCase())) {
      errors.push(`6 класс: пользовательский учебник не сохранён: ${required}`);
    }
  }

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
}

if (require.main === module) {
  const command = process.argv[2] || "report";
  if (command === "test") {
    assertContent();
    console.log("content tests passed");
  } else {
    const result = writeCoverageReport();
    console.log(`coverage report written; official=${result.officialCatalog.length}; user=${result.userTextbookCatalog.length}`);
  }
}

module.exports = { buildCoverage, writeCoverageReport, assertContent };
