const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const distServer = path.join(root, "dist", "server");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const files = {
  "/": read("index.html"),
  "/index.html": read("index.html"),
  "/style.css": read("style.css"),
  "/script.js": read("script.js"),
  "/i18n.js": read("i18n.js")
};

const worker = `const files = ${JSON.stringify(files, null, 2)};

const knowledgeBase = {
  meta: {
    version: 1,
    academicYear: "awaiting_import",
    officialSourceStatus: "awaiting_import",
    policy: "No fictional official curriculum, textbook, SOR, SOCH, or ENT content is generated. Records are created only from imported official materials."
  },
  languages: [
    { id: "lang_ru", code: "ru", title: "Russian" },
    { id: "lang_kk", code: "kk", title: "Kazakh" },
    { id: "lang_en", code: "en", title: "English" }
  ],
  grades: Array.from({ length: 11 }, (_, index) => ({
    id: \`grade_\${index + 1}\`,
    number: index + 1,
    title: \`Grade \${index + 1}\`
  })),
  subjects: [],
  curriculum: [],
  lessons: [],
  topics: [],
  textbooks: [],
  workbooks: [],
  teacherMaterials: [],
  sor: [],
  soch: [],
  unt: [],
  questionBank: [],
  files: [],
  imports: [],
  importPipelines: [
    { fileType: "pdf", status: "ready_for_upload", parser: "planned_text_extraction" },
    { fileType: "docx", status: "ready_for_upload", parser: "planned_document_extraction" },
    { fileType: "xlsx", status: "ready_for_upload", parser: "planned_spreadsheet_mapping" },
    { fileType: "csv", status: "ready_for_upload", parser: "structured_rows" },
    { fileType: "pptx", status: "ready_for_upload", parser: "planned_slide_extraction" },
    { fileType: "json", status: "ready_for_upload", parser: "validated_json_import" },
    { fileType: "image", status: "ready_for_upload", parser: "photo_ocr_needs_review" }
  ],
  awaitingImport: [
    {
      id: "awaiting_curriculum_kz_1_11",
      entityType: "curriculum",
      scope: "Kazakhstan official curriculum grades 1-11",
      status: "awaiting_import"
    },
    {
      id: "awaiting_textbooks_kz_1_11",
      entityType: "textbooks",
      scope: "Official or licensed textbooks and workbooks",
      status: "awaiting_import"
    },
    {
      id: "awaiting_sor_soch_ent",
      entityType: "assessment",
      scope: "SOR, SOCH, ENT question banks and criteria",
      status: "awaiting_import"
    }
  ]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function counts() {
  const keys = ["subjects", "curriculum", "lessons", "topics", "textbooks", "workbooks", "teacherMaterials", "sor", "soch", "unt", "questionBank", "files", "imports"];
  return Object.fromEntries(keys.map((key) => [key, Array.isArray(knowledgeBase[key]) ? knowledgeBase[key].length : 0]));
}

function makeStudent(body = {}) {
  return {
    id: "public-demo-student",
    name: body.name || body.studentName || "Ученик",
    grade: Number(body.grade || 6),
    points: 120,
    streak: 5,
    grades: []
  };
}

function tutorFallback(body = {}) {
  const language = body.language || "ru";
  const grade = body.grade || 6;
  const subject = body.subjectTitle || "Математика";
  const topic = body.topic || "общая тема";
  const question = body.question || body.text || "";

  if (language === "en") {
    return \`Diagnosis: grade \${grade}, subject: \${subject}, topic: \${topic}.

Short explanation: first we understand the question, then solve step by step.
Hint: write what is known and what you need to find.
Steps:
1. Read the task carefully. What is already clear?
2. Choose the rule or method. What should we do next?
3. Make one small step and check it.
Answer: the final answer comes after the reasoning.
Similar task: create one easier example on the same topic.
Great job for trying.\`;
  }

  if (language === "kk") {
    return \`\${grade}-сынып, пән: \${subject}, тақырып: \${topic}.

Қысқаша түсіндіру: алдымен шартты түсінеміз, содан кейін қадаммен шығарамыз.
Көмек: не берілгенін және нені табу керек екенін бөлек жаз.
Қадамдар:
1. Тапсырманы мұқият оқы. Қай жері түсінікті?
2. Қандай ереже керек екенін ойлан.
3. Бір кішкентай қадам жасап, тексер.
Жауап: соңғы жауап түсіну қадамдарынан кейін беріледі.
Ұқсас тапсырма: осы тақырыпқа жеңілірек бір мысал құрастыр.
Жарайсың!\`;
  }

  return \`Диагностика: \${grade} класс, предмет: \${subject}, тема: \${topic}.

Короткое объяснение условия: сначала понимаем вопрос, потом решаем по шагам.
Подсказка: выпиши, что дано и что нужно найти.
Пошаговое решение:
1. Прочитай условие внимательно. Что уже понятно?
2. Выбери правило или способ решения. Как думаешь, что делаем дальше?
3. Сделай один маленький шаг и проверь его.
Ответ: итоговый ответ даём после понятного хода решения.
Проверка: сравни ответ с вопросом.
Похожее задание: придумай один более простой пример по теме “\${topic}”.
Молодец, что стараешься разобраться!\`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "GET" && pathname === "/api/health") {
      return json({ ok: true, aiConfigured: false, storage: "public-demo" });
    }

    if (request.method === "POST" && pathname === "/api/session") {
      const body = await request.json().catch(() => ({}));
      return json({ token: "public-demo-token", student: makeStudent(body), role: body.role || "student" });
    }

    if (request.method === "GET" && pathname === "/api/state") {
      return json({
        student: makeStudent(),
        students: [makeStudent()],
        analytics: { visits: 0, users: 1, questions: 0, correct: 0, wrong: 0, helpful: 0, photos: 0 },
        events: [],
        aiConfigured: false
      });
    }

    if (request.method === "GET" && pathname === "/api/kb/status") {
      return json({
        status: "ready_for_import",
        officialDataPolicy: "No fictional official curriculum records. Missing materials are marked awaiting_import.",
        counts: counts(),
        supportedLanguages: knowledgeBase.languages.map((item) => item.code),
        supportedImportTypes: knowledgeBase.importPipelines.map((item) => item.fileType)
      });
    }

    if (request.method === "GET" && pathname === "/api/kb/search") {
      return json({
        query: Object.fromEntries(url.searchParams.entries()),
        priority: ["official_curriculum", "textbooks", "sor_soch", "teacher_materials", "ai_explanation"],
        results: [],
        awaitingImport: knowledgeBase.awaitingImport,
        canUseAiFallback: true
      });
    }

    if (request.method === "POST" && pathname === "/api/ask") {
      const body = await request.json().catch(() => ({}));
      return json({ answer: tutorFallback(body), aiUsed: false, student: makeStudent(body) });
    }

    if (request.method === "POST" && pathname === "/api/photo") {
      return json({
        answer: "Фото принято. В публичной демо-версии фото не сохраняется постоянно. Для полноценного OCR нужно подключить облачное хранилище и OpenAI API.",
        aiUsed: false
      });
    }

    if (request.method === "POST" && pathname === "/api/kb/photo-import") {
      return json({
        ok: true,
        status: "uploaded_awaiting_ocr",
        message: "Public demo accepted the photo metadata. Persistent OCR import requires cloud storage.",
        extracted: null
      });
    }

    if (request.method === "POST" && pathname === "/api/quiz") {
      const body = await request.json().catch(() => ({}));
      return json({ student: makeStudent(body), analytics: { visits: 0, users: 1, questions: 0, correct: body.correct ? 1 : 0, wrong: body.correct ? 0 : 1, helpful: 0 } });
    }

    if (request.method === "POST" && (pathname === "/api/feedback" || pathname === "/api/grades/import")) {
      const body = await request.json().catch(() => ({}));
      return json({ student: makeStudent(body), analytics: { visits: 0, users: 1, questions: 0, correct: 0, wrong: 0, helpful: 0 }, events: [] });
    }

    const content = files[pathname] || files["/"];
    const type = pathname.endsWith(".css")
      ? "text/css; charset=utf-8"
      : pathname.endsWith(".js")
        ? "text/javascript; charset=utf-8"
        : "text/html; charset=utf-8";

    return new Response(content, {
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=60"
      }
    });
  }
};
`;

fs.mkdirSync(distServer, { recursive: true });
fs.writeFileSync(path.join(distServer, "index.js"), worker, "utf8");
