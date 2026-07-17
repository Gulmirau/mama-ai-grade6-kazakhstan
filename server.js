const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

loadEnv();

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dbPath = path.join(dataDir, "db.json");
const kbPath = path.join(dataDir, "knowledge_base.json");
const importsDir = path.join(dataDir, "imports");
const port = Number(process.env.PORT || 3000);
const sessions = new Map();
const inactivityWarningDays = Number(process.env.INACTIVITY_WARNING_DAYS || 30);
const inactivityGraceDays = Number(process.env.INACTIVITY_GRACE_DAYS || 3);
const dayMs = 24 * 60 * 60 * 1000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

ensureDb();
ensureKnowledgeBase();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await routeApi(req, res, url);
      return;
    }

    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: "server_error", message: error.message });
  }
});

server.listen(port, () => {
  console.log(`Mama AI server: http://localhost:${port}`);
});

async function routeApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      storage: "json"
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/session") {
    const body = await readJson(req);
    const db = readDb();
    runAccountLifecycle(db);
    const role = body.role || "student";
    const name = cleanText(body.name || "Аружан");
    const city = normalizeCity(body.city || "Алматы");
    const grade = clampGrade(body.grade || 6);
    let student = db.students.find((item) => item.name.toLowerCase() === name.toLowerCase());

    if (!student) {
      student = createStudent(name, grade, city);
      db.students.push(student);
    }

    student.grade = grade;
    student.city = city;
    markStudentActive(student);
    cancelInactiveWarnings(db, student);
    addEvent(db, "Вход", `${name}, ${grade} класс, роль: ${role}, город: ${city}`);
    const cloudSync = await syncStudentToSupabase(student, role);
    if (cloudSync.status !== "skipped") db.cloudSync.unshift(cloudSync);
    db.cloudSync = db.cloudSync.slice(0, 200);
    writeDb(db);

    const token = crypto.randomUUID();
    sessions.set(token, { studentId: student.id, role, createdAt: Date.now() });
    sendJson(res, 200, { token, student, role });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    const db = readDb();
    if (runAccountLifecycle(db).changed) writeDb(db);
    const session = getSession(req);
    const student = session ? db.students.find((item) => item.id === session.studentId) : db.students[0];
    sendJson(res, 200, {
      student,
      students: db.students,
      analytics: makeAnalytics(db),
      events: db.events.slice(0, 30),
      aiConfigured: Boolean(process.env.OPENAI_API_KEY)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/cloud/status") {
    sendJson(res, 200, makeCloudStatus());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/account/lifecycle") {
    const db = readDb();
    if (runAccountLifecycle(db).changed) writeDb(db);
    sendJson(res, 200, makeAccountLifecycleReport(db));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/account/lifecycle/run") {
    const db = readDb();
    const result = runAccountLifecycle(db, { force: true });
    writeDb(db);
    sendJson(res, 200, { ...makeAccountLifecycleReport(db), result });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/account/upsert") {
    const body = await readJson(req);
    const db = readDb();
    const student = getOrCreateStudent(db, getSession(req), body);
    const account = upsertAccount(db, student, body);
    writeDb(db);
    sendJson(res, 200, { account, student, parentSummary: makeParentSummary(db, student) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/parent/summary") {
    const db = readDb();
    const session = getSession(req);
    const student = session ? db.students.find((item) => item.id === session.studentId) : db.students[0];
    sendJson(res, 200, makeParentSummary(db, student));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/learning-plan") {
    const db = readDb();
    const session = getSession(req);
    const student = session ? db.students.find((item) => item.id === session.studentId) : db.students[0];
    sendJson(res, 200, getOrCreateLearningPlan(db, student, { grade: student?.grade || 6 }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/learning-plan/generate") {
    const body = await readJson(req);
    const db = readDb();
    const student = getOrCreateStudent(db, getSession(req), body);
    const plan = generateLearningPlan(db, student, body);
    writeDb(db);
    sendJson(res, 200, { plan, parentSummary: makeParentSummary(db, student) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/trainer/attempt") {
    const body = await readJson(req);
    const db = readDb();
    const student = getOrCreateStudent(db, getSession(req), body);
    const attempt = saveTrainerAttempt(db, student, body);
    writeDb(db);
    sendJson(res, 200, { attempt, parentSummary: makeParentSummary(db, student), student });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/kb/status") {
    const kb = readKnowledgeBase();
    sendJson(res, 200, {
      status: "ready_for_import",
      officialDataPolicy: "No fictional official curriculum records. Missing materials are marked awaiting_import.",
      counts: makeKnowledgeBaseCounts(kb),
      supportedLanguages: kb.languages.map((item) => item.code),
      supportedImportTypes: kb.importPipelines.map((item) => item.fileType)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/kb/schema") {
    sendJson(res, 200, getKnowledgeBaseSchema());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/kb/search") {
    const kb = readKnowledgeBase();
    const query = {
      keyword: url.searchParams.get("keyword") || "",
      topic: url.searchParams.get("topic") || "",
      lesson: url.searchParams.get("lesson") || "",
      textbook: url.searchParams.get("textbook") || "",
      page: url.searchParams.get("page") || "",
      grade: url.searchParams.get("grade") || "",
      subject: url.searchParams.get("subject") || "",
      quarter: url.searchParams.get("quarter") || "",
      language: url.searchParams.get("language") || "ru"
    };
    sendJson(res, 200, searchKnowledgeBase(kb, query));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/kb/import") {
    const body = await readJson(req, 12_000_000);
    const kb = readKnowledgeBase();
    const result = importKnowledgeBaseFile(kb, body);
    writeKnowledgeBase(kb);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/kb/lesson/generate") {
    const body = await readJson(req);
    const kb = readKnowledgeBase();
    const result = generateLessonPackage(kb, body);
    writeKnowledgeBase(kb);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/kb/photo-import") {
    const body = await readJson(req, 12_000_000);
    const kb = readKnowledgeBase();
    const result = await importPhotoToKnowledgeBase(kb, body);
    writeKnowledgeBase(kb);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/ask") {
    const body = await readJson(req);
    const db = readDb();
    const session = getSession(req);
    const student = getOrCreateStudent(db, session, body);
    const promptData = normalizeTutorRequest(body, student);
    const kb = readKnowledgeBase();
    promptData.knowledgeContext = searchKnowledgeBase(kb, {
      keyword: promptData.question,
      topic: promptData.topic,
      grade: promptData.grade,
      subject: promptData.subjectTitle,
      language: promptData.language
    });
    addPoints(student, 2, "попытку");
    db.questions.push({
      id: crypto.randomUUID(),
      studentId: student.id,
      ...promptData,
      createdAt: new Date().toISOString()
    });

    let answer = makeTutorFallback(promptData);
    let aiUsed = false;

    if (process.env.OPENAI_API_KEY) {
      try {
        answer = await askOpenAI(promptData);
        aiUsed = true;
      } catch (error) {
        addEvent(db, "AI fallback", error.message.slice(0, 160));
      }
    }

    addEvent(db, "Вопрос", `${student.name}: ${promptData.subjectTitle}, ${promptData.topic}`);
    writeDb(db);
    sendJson(res, 200, { answer, aiUsed, student });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/photo") {
    const body = await readJson(req, 8_000_000);
    const db = readDb();
    const session = getSession(req);
    const student = getOrCreateStudent(db, session, body);
    const fileName = cleanText(body.fileName || "photo");
    const promptData = normalizeTutorRequest({
      ...body,
      question: `Разбери фото задания: ${fileName}`
    }, student);

    let answer = "Фото принято. Я помогу разобрать его как репетитор: сначала прочитаем условие, потом найдем тему, выпишем данные, решим по шагам и проверим ответ.";
    let aiUsed = false;

    if (process.env.OPENAI_API_KEY && body.imageData) {
      try {
        answer = await askOpenAI(promptData, body.imageData);
        aiUsed = true;
      } catch (error) {
        addEvent(db, "Фото fallback", error.message.slice(0, 160));
      }
    }

    db.photos.push({
      id: crypto.randomUUID(),
      studentId: student.id,
      fileName,
      aiUsed,
      createdAt: new Date().toISOString()
    });
    addEvent(db, "Фото задания", `${student.name}: ${fileName}`);
    writeDb(db);
    sendJson(res, 200, { answer, aiUsed });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/quiz") {
    const body = await readJson(req);
    const db = readDb();
    const session = getSession(req);
    const student = getOrCreateStudent(db, session, body);
    const correct = Boolean(body.correct);
    addPoints(student, correct ? 10 : 1, correct ? "правильный ответ" : "попытку");
    db.quizAttempts.push({
      id: crypto.randomUUID(),
      studentId: student.id,
      subject: body.subject || "unknown",
      correct,
      createdAt: new Date().toISOString()
    });
    addEvent(db, correct ? "Правильный ответ" : "Неправильный ответ", `${student.name}: ${body.subject || "предмет"}`);
    writeDb(db);
    sendJson(res, 200, { student, analytics: makeAnalytics(db) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/feedback") {
    const body = await readJson(req);
    const db = readDb();
    const session = getSession(req);
    const student = getOrCreateStudent(db, session, body);
    db.feedback.unshift({
      id: crypto.randomUUID(),
      studentId: student.id,
      text: cleanText(body.text || ""),
      helpful: Boolean(body.helpful),
      createdAt: new Date().toISOString()
    });
    addEvent(db, "Отзыв", `${student.name}: ${body.helpful ? "полезно" : "нужно улучшить"}`);
    writeDb(db);
    sendJson(res, 200, { analytics: makeAnalytics(db), events: db.events.slice(0, 30) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/grades/import") {
    const body = await readJson(req, 2_000_000);
    const db = readDb();
    const student = getOrCreateStudent(db, getSession(req), body);
    const grades = Array.isArray(body.grades) ? body.grades : [];
    student.grades = grades
      .filter((item) => item && item.subject)
      .map((item) => ({
        subject: cleanText(item.subject),
        value: Number(item.value || 0),
        date: cleanText(item.date || new Date().toISOString().slice(0, 10)),
        type: cleanText(item.type || "оценка")
      }));
    addEvent(db, "Импорт оценок", `${student.name}: ${student.grades.length} записей`);
    writeDb(db);
    sendJson(res, 200, { student });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/analytics") {
    const db = readDb();
    sendJson(res, 200, { analytics: makeAnalytics(db), events: db.events.slice(0, 50) });
    return;
  }

  sendJson(res, 404, { error: "not_found" });
}

function serveStatic(res, requestedPath) {
  const normalized = requestedPath === "/" ? "/index.html" : requestedPath;
  const decoded = decodeURIComponent(normalized).replace(/^[/\\]+/, "");
  const filePath = path.resolve(rootDir, decoded);

  if (!filePath.startsWith(rootDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function ensureDb() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dbPath)) return;
  const student = createStudent("Аружан", 6, "Алматы");
  const db = {
    students: [student],
    accounts: [],
    parentLinks: [],
    learningPlans: [],
    trainerAttempts: [],
    cloudSync: [],
    notifications: [],
    accountLifecycle: [],
    questions: [],
    quizAttempts: [],
    feedback: [],
    photos: [],
    events: []
  };
  addEvent(db, "Система", "Создана локальная JSON-база");
  writeDb(db);
}

function ensureKnowledgeBase() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(importsDir, { recursive: true });
  if (fs.existsSync(kbPath)) return;
  writeKnowledgeBase(createEmptyKnowledgeBase());
}

function createEmptyKnowledgeBase() {
  const now = new Date().toISOString();
  const languages = [
    { id: "lang_ru", code: "ru", title: "Russian" },
    { id: "lang_kk", code: "kk", title: "Kazakh" },
    { id: "lang_en", code: "en", title: "English" }
  ];
  const grades = Array.from({ length: 11 }, (_, index) => ({
    id: `grade_${index + 1}`,
    number: index + 1,
    title: `Grade ${index + 1}`
  }));

  return {
    meta: {
      version: 1,
      academicYear: "awaiting_import",
      officialSourceStatus: "awaiting_import",
      policy: "No fictional official curriculum, textbook, SOR, SOCH, or ENT content is generated. Records are created only from imported official materials.",
      createdAt: now,
      updatedAt: now
    },
    languages,
    grades,
    subjects: [],
    curriculum: [],
    quarters: [],
    sections: [],
    topics: [],
    lessons: [],
    competencies: [],
    learningObjectives: [],
    textbooks: [],
    textbookChapters: [],
    textbookPages: [],
    workbooks: [],
    workbookExercises: [],
    teacherMaterials: [],
    sor: [],
    soch: [],
    unt: [],
    questionBank: [],
    practiceExams: [],
    illustrations: [],
    videos: [],
    files: [],
    studentProgress: [],
    achievements: [],
    chatHistory: [],
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
        status: "awaiting_import",
        requiredFields: ["grade", "subject", "quarter", "section", "topic", "lesson", "learning_objectives", "competencies"]
      },
      {
        id: "awaiting_textbooks_kz_1_11",
        entityType: "textbooks",
        scope: "Official or licensed textbooks and workbooks",
        status: "awaiting_import",
        requiredFields: ["title", "publisher", "grade", "language", "subject", "edition", "chapters", "pages", "resource"]
      },
      {
        id: "awaiting_sor_soch_ent",
        entityType: "assessment",
        scope: "SOR, SOCH, ENT question banks and criteria",
        status: "awaiting_import",
        requiredFields: ["grade", "subject", "quarter", "topic", "task", "answer", "explanation", "criteria", "difficulty"]
      }
    ]
  };
}

function readKnowledgeBase() {
  if (!fs.existsSync(kbPath)) {
    ensureKnowledgeBase();
  }
  return JSON.parse(fs.readFileSync(kbPath, "utf8"));
}

function writeKnowledgeBase(kb) {
  kb.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(kbPath, JSON.stringify(kb, null, 2), "utf8");
}

function makeKnowledgeBaseCounts(kb) {
  const keys = ["subjects", "curriculum", "lessons", "topics", "textbooks", "workbooks", "teacherMaterials", "sor", "soch", "unt", "questionBank", "files", "imports"];
  return Object.fromEntries(keys.map((key) => [key, Array.isArray(kb[key]) ? kb[key].length : 0]));
}

function getKnowledgeBaseSchema() {
  return {
    database: "Mama AI Knowledge Base",
    normalizedTables: {
      Grades: ["id", "number", "title"],
      Languages: ["id", "code", "title"],
      Subjects: ["id", "code", "title", "language", "gradeRange", "status"],
      Curriculum: ["id", "gradeId", "subjectId", "academicYear", "sourceFileId", "status"],
      Quarters: ["id", "curriculumId", "number", "title"],
      Sections: ["id", "quarterId", "title", "order"],
      Topics: ["id", "sectionId", "title", "keywords", "status"],
      Lessons: ["id", "topicId", "title", "objectives", "competencies", "summary", "status"],
      LearningObjectives: ["id", "lessonId", "code", "description", "language"],
      Competencies: ["id", "lessonId", "description", "language"],
      Textbooks: ["id", "title", "publisher", "gradeId", "languageId", "subjectId", "edition", "resourceFileId", "status"],
      TextbookChapters: ["id", "textbookId", "title", "order"],
      TextbookPages: ["id", "textbookId", "chapterId", "pageNumber", "text", "status"],
      Workbooks: ["id", "title", "type", "gradeId", "languageId", "subjectId", "edition", "resourceFileId", "status"],
      WorkbookExercises: ["id", "workbookId", "topicId", "task", "answer", "explanation", "difficulty"],
      TeacherMaterials: ["id", "title", "subjectId", "gradeId", "languageId", "fileId", "status"],
      SOR: ["id", "gradeId", "subjectId", "quarterId", "sectionId", "topicId", "learningObjectiveId", "task", "answer", "explanation", "criteria", "difficulty", "status"],
      SOCH: ["id", "quarterId", "subjectId", "topicsCovered", "questionBankIds", "correctAnswers", "explanations", "criteria", "scoringSystem", "status"],
      UNT: ["id", "subjectId", "topicId", "difficulty", "answers", "correctAnswer", "explanation", "statistics", "tags", "status"],
      QuestionBank: ["id", "sourceType", "sourceId", "question", "answers", "correctAnswer", "explanation", "language", "difficulty", "tags"],
      PracticeExams: ["id", "title", "questionIds", "durationMinutes", "scoringSystem", "status"],
      Illustrations: ["id", "lessonId", "fileId", "altText", "language", "status"],
      Videos: ["id", "lessonId", "url", "title", "language", "status"],
      Files: ["id", "originalName", "fileType", "storagePath", "checksum", "sourceUrl", "license", "status"],
      StudentProgress: ["id", "studentId", "lessonId", "topicId", "score", "attempts", "lastActivityAt"],
      Achievements: ["id", "studentId", "type", "title", "earnedAt"],
      ChatHistory: ["id", "studentId", "lessonId", "message", "language", "createdAt"]
    }
  };
}

function searchKnowledgeBase(kb, query) {
  const normalized = {
    keyword: cleanText(query.keyword || "").toLowerCase(),
    topic: cleanText(query.topic || "").toLowerCase(),
    lesson: cleanText(query.lesson || "").toLowerCase(),
    textbook: cleanText(query.textbook || "").toLowerCase(),
    page: cleanText(query.page || ""),
    grade: cleanText(query.grade || ""),
    subject: cleanText(query.subject || "").toLowerCase(),
    quarter: cleanText(query.quarter || ""),
    language: cleanText(query.language || "ru")
  };

  const collections = [
    ["official_curriculum", kb.curriculum, 1],
    ["textbooks", kb.textbooks, 2],
    ["sor", kb.sor, 3],
    ["soch", kb.soch, 3],
    ["teacher_materials", kb.teacherMaterials, 4],
    ["lessons", kb.lessons, 1],
    ["topics", kb.topics, 1],
    ["unt", kb.unt, 3],
    ["question_bank", kb.questionBank, 3]
  ];

  const results = [];
  for (const [source, records, priority] of collections) {
    for (const record of records) {
      const text = JSON.stringify(record).toLowerCase();
      const matchesKeyword = !normalized.keyword || text.includes(normalized.keyword);
      const matchesTopic = !normalized.topic || text.includes(normalized.topic);
      const matchesLesson = !normalized.lesson || text.includes(normalized.lesson);
      const matchesTextbook = !normalized.textbook || text.includes(normalized.textbook);
      const matchesPage = !normalized.page || text.includes(`"page":${normalized.page}`) || text.includes(`"pageNumber":${normalized.page}`);
      const matchesGrade = !normalized.grade || text.includes(`grade_${normalized.grade}`) || text.includes(`"grade":${normalized.grade}`) || text.includes(`"grade":"${normalized.grade}"`);
      const matchesSubject = !normalized.subject || text.includes(normalized.subject);
      const matchesQuarter = !normalized.quarter || text.includes(`quarter_${normalized.quarter}`) || text.includes(`"quarter":${normalized.quarter}`);
      const matchesLanguage = !record.language || record.language === normalized.language || text.includes(`"language":"${normalized.language}"`);

      if (matchesKeyword && matchesTopic && matchesLesson && matchesTextbook && matchesPage && matchesGrade && matchesSubject && matchesQuarter && matchesLanguage) {
        results.push({ source, priority, record });
      }
    }
  }

  results.sort((a, b) => a.priority - b.priority);
  return {
    query: normalized,
    priority: ["official_curriculum", "textbooks", "sor_soch", "teacher_materials", "ai_explanation"],
    results,
    awaitingImport: results.length ? [] : kb.awaitingImport,
    canUseAiFallback: results.length === 0
  };
}

function importKnowledgeBaseFile(kb, body) {
  const fileType = cleanText(body.fileType || "").toLowerCase();
  const originalName = cleanText(body.originalName || `import.${fileType || "json"}`);
  const sourceType = cleanText(body.sourceType || "unknown");
  const language = cleanText(body.language || "ru");
  const academicYear = cleanText(body.academicYear || "awaiting_review");
  const content = body.content || body.records || null;
  const supported = kb.importPipelines.some((item) => item.fileType === fileType);

  if (!supported) {
    return { ok: false, status: "unsupported_file_type", supported: kb.importPipelines.map((item) => item.fileType) };
  }

  const fileRecord = {
    id: crypto.randomUUID(),
    originalName,
    fileType,
    storagePath: null,
    checksum: crypto.createHash("sha256").update(JSON.stringify(content || "")).digest("hex"),
    sourceUrl: cleanText(body.sourceUrl || ""),
    license: cleanText(body.license || "awaiting_review"),
    status: "uploaded_awaiting_mapping",
    importedAt: new Date().toISOString()
  };
  kb.files.push(fileRecord);

  const importRecord = {
    id: crypto.randomUUID(),
    fileId: fileRecord.id,
    sourceType,
    language,
    academicYear,
    status: "awaiting_mapping",
    notes: "File registered. Official content must be mapped to normalized KB tables before use.",
    createdAt: new Date().toISOString()
  };
  kb.imports.unshift(importRecord);

  if (fileType === "json" && Array.isArray(body.records)) {
    const mapped = mapJsonRecordsToKnowledgeBase(kb, body.records, { sourceType, language, academicYear, fileId: fileRecord.id });
    importRecord.status = mapped.importedCount ? "imported_needs_review" : "awaiting_mapping";
    importRecord.importedCount = mapped.importedCount;
    importRecord.warnings = mapped.warnings;
  }

  return { ok: true, file: fileRecord, import: importRecord };
}

function mapJsonRecordsToKnowledgeBase(kb, records, context) {
  let importedCount = 0;
  const warnings = [];

  for (const record of records) {
    if (!record || !record.entityType) {
      warnings.push("Skipped record without entityType");
      continue;
    }

    const base = {
      id: record.id || crypto.randomUUID(),
      language: record.language || context.language,
      academicYear: record.academicYear || context.academicYear,
      sourceFileId: context.fileId,
      status: record.status || "imported_needs_review"
    };

    if (record.entityType === "subject") {
      kb.subjects.push({ ...base, code: cleanText(record.code || ""), title: cleanText(record.title || ""), gradeRange: record.gradeRange || [] });
      importedCount += 1;
    } else if (record.entityType === "textbook") {
      kb.textbooks.push({ ...base, title: cleanText(record.title || ""), publisher: cleanText(record.publisher || ""), grade: record.grade || null, subject: cleanText(record.subject || ""), edition: cleanText(record.edition || ""), chapters: record.chapters || [], pages: record.pages || [], resource: cleanText(record.resource || "") });
      importedCount += 1;
    } else if (record.entityType === "sor") {
      kb.sor.push({ ...base, ...record });
      importedCount += 1;
    } else if (record.entityType === "soch") {
      kb.soch.push({ ...base, ...record });
      importedCount += 1;
    } else if (record.entityType === "unt") {
      kb.unt.push({ ...base, ...record });
      importedCount += 1;
    } else if (record.entityType === "lesson") {
      kb.lessons.push({ ...base, ...record });
      importedCount += 1;
    } else {
      warnings.push(`Unsupported entityType: ${record.entityType}`);
    }
  }

  return { importedCount, warnings };
}

function generateLessonPackage(kb, body) {
  const search = searchKnowledgeBase(kb, {
    keyword: body.keyword || body.topic || "",
    topic: body.topic || "",
    lesson: body.lesson || "",
    grade: body.grade || "",
    subject: body.subject || "",
    quarter: body.quarter || "",
    language: body.language || "ru"
  });

  if (!search.results.length) {
    return {
      status: "awaiting_import",
      message: "Official lesson material is not imported yet. Lesson generation is blocked to avoid fictional school facts.",
      requiredImports: search.awaitingImport,
      generated: null
    };
  }

  const lessonPackage = {
    id: crypto.randomUUID(),
    status: "generated_from_verified_material_needs_review",
    sources: search.results.slice(0, 5),
    simpleExplanation: "pending_ai_generation_from_verified_sources",
    detailedExplanation: "pending_ai_generation_from_verified_sources",
    illustrations: [],
    examples: [],
    realLifeExamples: [],
    miniQuiz: [],
    practiceExercises: [],
    homework: []
  };

  return { status: lessonPackage.status, generated: lessonPackage };
}

function makeCloudStatus() {
  const provider = cleanText(process.env.CLOUD_BACKEND_PROVIDER || "supabase");
  const supabaseReady = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const firebaseReady = Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  const emailProvider = cleanText(process.env.EMAIL_PROVIDER || "disabled");
  const emailReady = emailProvider !== "disabled" && Boolean(process.env.EMAIL_FROM);
  const ready = provider === "supabase" ? supabaseReady : provider === "firebase" ? firebaseReady : false;
  return {
    provider,
    ready,
    supabaseReady,
    emailProvider,
    emailReady,
    mode: ready ? "cloud_ready" : "local_json_active",
    message: ready
      ? "Cloud backend variables are configured. Adapter can be connected for production persistence."
      : "Local JSON backend is active. Add cloud provider credentials for shared production data.",
    requiredForProduction: ["authentication", "shared_database", "file_storage", "OCR_queue", "analytics", "email_provider"]
  };
}

async function syncStudentToSupabase(student, role = "student") {
  const status = makeCloudStatus();
  if (status.provider !== "supabase" || !status.supabaseReady) {
    return { status: "skipped", provider: status.provider, reason: "supabase_not_configured" };
  }

  const payload = {
    id: student.id,
    name: student.name,
    grade: student.grade,
    city: normalizeCity(student.city || ""),
    role,
    status: student.status || "active",
    points: Number(student.points || 0),
    streak: Number(student.streak || 0),
    last_seen_at: student.lastSeenAt,
    created_at: student.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/students?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        id: crypto.randomUUID(),
        provider: "supabase",
        status: "error",
        entity: "students",
        message: text.slice(0, 220),
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: crypto.randomUUID(),
      provider: "supabase",
      status: "synced",
      entity: "students",
      studentId: student.id,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      id: crypto.randomUUID(),
      provider: "supabase",
      status: "error",
      entity: "students",
      message: error.message,
      createdAt: new Date().toISOString()
    };
  }
}

function makeAccountLifecycleReport(db) {
  const now = Date.now();
  return {
    policy: {
      inactivityWarningDays,
      inactivityGraceDays,
      warningChannel: "email_queue",
      emailProvider: cleanText(process.env.EMAIL_PROVIDER || "disabled"),
      emailReady: Boolean(process.env.EMAIL_FROM && process.env.EMAIL_PROVIDER && process.env.EMAIL_PROVIDER !== "disabled")
    },
    students: db.students.map((student) => {
      const lastSeen = Date.parse(student.lastSeenAt || student.createdAt || new Date().toISOString());
      const daysInactive = Math.max(0, Math.floor((now - lastSeen) / dayMs));
      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        status: student.status || "active",
        lastSeenAt: student.lastSeenAt,
        daysInactive,
        warningSentAt: student.inactivityWarningSentAt || null,
        scheduledDeletionAt: student.scheduledDeletionAt || null
      };
    }),
    notifications: db.notifications.slice(0, 50),
    accountLifecycle: db.accountLifecycle.slice(0, 50)
  };
}

function runAccountLifecycle(db) {
  const now = new Date();
  let changed = false;
  const deleted = [];
  const warned = [];

  for (const student of [...db.students]) {
    const lastSeenAt = Date.parse(student.lastSeenAt || student.createdAt || now.toISOString());
    const warningCutoff = now.getTime() - inactivityWarningDays * dayMs;
    const scheduledDeletionAt = student.scheduledDeletionAt ? Date.parse(student.scheduledDeletionAt) : null;

    if (student.scheduledDeletionAt && lastSeenAt > Date.parse(student.inactivityWarningSentAt || student.scheduledDeletionAt)) {
      delete student.scheduledDeletionAt;
      delete student.inactivityWarningSentAt;
      student.status = "active";
      addAccountLifecycleEvent(db, student, "reactivated", "Student logged in after inactivity warning.");
      changed = true;
      continue;
    }

    if (scheduledDeletionAt && scheduledDeletionAt <= now.getTime()) {
      deleteStudentData(db, student, "inactive_after_warning");
      deleted.push(student.id);
      changed = true;
      continue;
    }

    if (lastSeenAt <= warningCutoff && !student.inactivityWarningSentAt) {
      const deletionDate = new Date(now.getTime() + inactivityGraceDays * dayMs).toISOString();
      student.inactivityWarningSentAt = now.toISOString();
      student.scheduledDeletionAt = deletionDate;
      student.status = "warning_sent";
      queueInactiveWarning(db, student, deletionDate);
      addAccountLifecycleEvent(db, student, "warning_queued", `Inactive for ${inactivityWarningDays} days; deletion scheduled after ${inactivityGraceDays} days.`);
      warned.push(student.id);
      changed = true;
    }
  }

  return { changed, warned, deleted };
}

function markStudentActive(student) {
  student.lastSeenAt = new Date().toISOString();
  student.status = "active";
  delete student.scheduledDeletionAt;
  delete student.inactivityWarningSentAt;
}

function cancelInactiveWarnings(db, student) {
  let cancelled = false;
  for (const notification of db.notifications) {
    if (notification.studentId === student.id && notification.type === "inactive_account_warning" && String(notification.status || "").startsWith("queued")) {
      notification.status = "cancelled_student_logged_in";
      notification.cancelledAt = new Date().toISOString();
      cancelled = true;
    }
  }
  if (cancelled) {
    addAccountLifecycleEvent(db, student, "warning_cancelled", "Student logged in before scheduled deletion.");
  }
}

function queueInactiveWarning(db, student, deletionDate) {
  const existing = db.notifications.find((item) => (
    item.studentId === student.id
    && item.type === "inactive_account_warning"
    && ["queued", "sent"].includes(item.status)
  ));
  if (existing) return existing;

  const account = db.accounts.find((item) => item.studentId === student.id && item.email);
  const email = student.email || account?.email || "";
  const notification = {
    id: crypto.randomUUID(),
    type: "inactive_account_warning",
    channel: "email",
    status: cleanText(process.env.EMAIL_PROVIDER || "disabled") === "disabled" ? "queued_email_provider_required" : "queued",
    studentId: student.id,
    studentName: student.name,
    email,
    subject: "Mama AI: account inactivity warning",
    body: `Your Mama AI student account has been inactive for ${inactivityWarningDays} days. Please log in within ${inactivityGraceDays} days to keep it active. Scheduled deletion: ${deletionDate}.`,
    deleteAfter: deletionDate,
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(notification);
  db.notifications = db.notifications.slice(0, 200);
  return notification;
}

function deleteStudentData(db, student, reason) {
  const studentId = student.id;
  db.students = db.students.filter((item) => item.id !== studentId);
  db.accounts = db.accounts.filter((item) => item.studentId !== studentId);
  db.parentLinks = db.parentLinks.filter((item) => item.studentId !== studentId);
  db.learningPlans = db.learningPlans.filter((item) => item.studentId !== studentId);
  db.trainerAttempts = db.trainerAttempts.filter((item) => item.studentId !== studentId);
  db.questions = db.questions.filter((item) => item.studentId !== studentId);
  db.quizAttempts = db.quizAttempts.filter((item) => item.studentId !== studentId);
  db.feedback = db.feedback.filter((item) => item.studentId !== studentId);
  db.photos = db.photos.filter((item) => item.studentId !== studentId);
  addAccountLifecycleEvent(db, student, "deleted", reason);
  addEvent(db, "Account lifecycle", `${student.name}: deleted after inactivity`);
}

function addAccountLifecycleEvent(db, student, action, detail) {
  db.accountLifecycle.unshift({
    id: crypto.randomUUID(),
    studentId: student.id,
    studentName: student.name,
    action,
    detail,
    createdAt: new Date().toISOString()
  });
  db.accountLifecycle = db.accountLifecycle.slice(0, 200);
}

function upsertAccount(db, student, body) {
  const role = cleanText(body.role || "student");
  const parentName = cleanText(body.parentName || "Родитель");
  let account = db.accounts.find((item) => item.studentId === student.id && item.role === role);
  if (!account) {
    account = {
      id: crypto.randomUUID(),
      studentId: student.id,
      role,
      createdAt: new Date().toISOString()
    };
    db.accounts.push(account);
  }
  account.name = role === "parent" ? parentName : student.name;
  account.grade = student.grade;
  account.city = normalizeCity(body.city || student.city || account.city || "");
  if (account.city) student.city = account.city;
  account.email = cleanText(body.email || account.email || student.email || "");
  if (role === "student" && account.email) student.email = account.email;
  account.learningLanguage = cleanText(body.language || "ru");
  account.updatedAt = new Date().toISOString();

  if (role === "parent" && !db.parentLinks.some((item) => item.studentId === student.id && item.accountId === account.id)) {
    db.parentLinks.push({ id: crypto.randomUUID(), studentId: student.id, accountId: account.id, relation: "parent", createdAt: new Date().toISOString() });
  }

  addEvent(db, "Кабинет", `${account.name}: ${role}, ${student.grade} класс`);
  return account;
}

function getOrCreateLearningPlan(db, student, body = {}) {
  const existing = db.learningPlans.find((item) => item.studentId === student?.id && item.status === "active");
  if (existing) return existing;
  return generateLearningPlan(db, student, body);
}

function generateLearningPlan(db, student, body = {}) {
  const subject = cleanText(body.subjectTitle || body.subject || "Математика");
  const topic = cleanText(body.topic || "повторение темы");
  const weak = makeWeakTopics(db, student);
  const focus = weak[0]?.topic || topic;
  const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];
  const tasks = days.map((day, index) => ({
    id: crypto.randomUUID(),
    day,
    title: index === 0 ? `Диагностика: ${focus}` : index === 4 ? "Мини-проверка и похвала" : `${subject}: практика по теме`,
    minutes: index === 4 ? 15 : 25,
    steps: [
      "Коротко повторить правило",
      "Решить 3-5 заданий",
      "Отметить, что было сложно"
    ],
    status: "planned"
  }));

  const plan = {
    id: crypto.randomUUID(),
    studentId: student.id,
    grade: student.grade,
    subject,
    focusTopic: focus,
    status: "active",
    tasks,
    createdAt: new Date().toISOString()
  };
  db.learningPlans = db.learningPlans.filter((item) => item.studentId !== student.id || item.status !== "active");
  db.learningPlans.push(plan);
  addEvent(db, "План занятий", `${student.name}: ${subject}, фокус: ${focus}`);
  return plan;
}

function saveTrainerAttempt(db, student, body) {
  const attempt = {
    id: crypto.randomUUID(),
    studentId: student.id,
    grade: student.grade,
    mode: cleanText(body.mode || "gia"),
    subject: cleanText(body.subject || body.subjectTitle || "unknown"),
    topic: cleanText(body.topic || "diagnostic"),
    question: cleanText(body.question || ""),
    selected: cleanText(body.selected || ""),
    correct: Boolean(body.correct),
    sourceStatus: cleanText(body.sourceStatus || "demo_not_official"),
    createdAt: new Date().toISOString()
  };
  db.trainerAttempts.unshift(attempt);
  db.trainerAttempts = db.trainerAttempts.slice(0, 500);
  addPoints(student, attempt.correct ? 8 : 2, attempt.correct ? "тренажёр" : "попытку в тренажёре");
  addEvent(db, attempt.correct ? "Тренажёр: верно" : "Тренажёр: ошибка", `${student.name}: ${attempt.topic}`);
  return attempt;
}

function makeWeakTopics(db, student) {
  if (!student) return [];
  const attempts = [
    ...db.quizAttempts.filter((item) => item.studentId === student.id).map((item) => ({ topic: item.subject || "мини-тест", correct: item.correct })),
    ...db.trainerAttempts.filter((item) => item.studentId === student.id).map((item) => ({ topic: item.topic || item.subject || "тренажёр", correct: item.correct }))
  ];
  const byTopic = new Map();
  for (const attempt of attempts) {
    const topic = attempt.topic || "общая тема";
    const stat = byTopic.get(topic) || { topic, total: 0, wrong: 0 };
    stat.total += 1;
    if (!attempt.correct) stat.wrong += 1;
    byTopic.set(topic, stat);
  }
  return Array.from(byTopic.values())
    .filter((item) => item.wrong > 0)
    .sort((a, b) => (b.wrong / b.total) - (a.wrong / a.total))
    .slice(0, 5);
}

function makeParentSummary(db, student) {
  if (!student) {
    return { weakTopics: [], recommendations: [], currentTopic: "Нет активного ученика" };
  }
  const lastQuestion = db.questions.find((item) => item.studentId === student.id);
  const weakTopics = makeWeakTopics(db, student);
  const plan = db.learningPlans.find((item) => item.studentId === student.id && item.status === "active");
  const recommendations = [
    weakTopics[0] ? `Повторить тему: ${weakTopics[0].topic}` : "Продолжать короткую ежедневную практику",
    "Заниматься 15-25 минут без перегруза",
    "После ошибки просить ребёнка объяснить ход решения своими словами",
    plan ? `Следовать плану: ${plan.focusTopic}` : "Составить недельный план занятий"
  ];
  return {
    student: { id: student.id, name: student.name, grade: student.grade, points: student.points },
    currentTopic: lastQuestion?.topic || plan?.focusTopic || "Тема ещё не выбрана",
    weakTopics,
    recommendations,
    plan,
    cloud: makeCloudStatus()
  };
}

async function importPhotoToKnowledgeBase(kb, body) {
  const imageData = String(body.imageData || "");
  const fileName = cleanText(body.fileName || "textbook-photo.png");
  const grade = clampGrade(body.grade || 1);
  const subject = cleanText(body.subjectKey || body.subjectTitle || "");
  const subjectTitle = cleanText(body.subjectTitle || subject || "subject");
  const topic = cleanText(body.topic || "awaiting_review");
  const pageNumber = body.pageNumber ? Number(body.pageNumber) : null;
  const language = cleanText(body.language || "ru");
  const now = new Date().toISOString();

  if (!imageData.startsWith("data:image/")) {
    return { ok: false, status: "invalid_image", message: "Expected imageData as a data:image/* URL." };
  }

  fs.mkdirSync(importsDir, { recursive: true });
  const extensionMatch = imageData.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
  const extension = extensionMatch ? extensionMatch[1].replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") : "png";
  const base64 = imageData.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const fileId = crypto.randomUUID();
  const storageName = `${fileId}.${extension || "png"}`;
  const storagePath = path.join(importsDir, storageName);
  fs.writeFileSync(storagePath, buffer);

  const fileRecord = {
    id: fileId,
    originalName: fileName,
    fileType: "image",
    storagePath,
    checksum: crypto.createHash("sha256").update(buffer).digest("hex"),
    sourceUrl: cleanText(body.sourceUrl || ""),
    license: cleanText(body.license || "user_uploaded_needs_review"),
    status: process.env.OPENAI_API_KEY ? "uploaded_awaiting_review" : "uploaded_awaiting_ocr",
    importedAt: now,
    grade,
    subject,
    language
  };
  kb.files.push(fileRecord);

  const importRecord = {
    id: crypto.randomUUID(),
    fileId,
    sourceType: "textbook_photo",
    language,
    academicYear: cleanText(body.academicYear || "awaiting_review"),
    status: process.env.OPENAI_API_KEY ? "ocr_needs_review" : "uploaded_awaiting_ocr",
    notes: "Photo imported from the app. OCR text must be reviewed before becoming trusted Knowledge Base content.",
    createdAt: now
  };
  kb.imports.unshift(importRecord);

  let extracted = null;
  if (process.env.OPENAI_API_KEY) {
    try {
      extracted = await extractEducationalPhotoText({ imageData, grade, subjectTitle, topic, pageNumber, language });
    } catch (error) {
      importRecord.status = "ocr_failed";
      importRecord.notes = `OCR failed: ${error.message.slice(0, 180)}`;
      return { ok: true, status: "ocr_failed", file: fileRecord, import: importRecord, extracted: null };
    }
  }

  if (!extracted) {
    return {
      ok: true,
      status: "uploaded_awaiting_ocr",
      message: "Photo saved. Add OPENAI_API_KEY to enable OCR extraction, then review before trusting.",
      file: fileRecord,
      import: importRecord,
      extracted: null
    };
  }

  const pageRecord = {
    id: crypto.randomUUID(),
    textbookId: null,
    chapterId: null,
    pageNumber,
    grade,
    subject,
    subjectTitle,
    topic,
    language,
    text: extracted.text,
    tasks: extracted.tasks,
    learningObjectives: extracted.learningObjectives,
    status: "imported_needs_review",
    sourceFileId: fileId,
    createdAt: now
  };
  kb.textbookPages.push(pageRecord);

  return {
    ok: true,
    status: "imported_needs_review",
    message: "Photo text was extracted and saved for review. It is not trusted until approved.",
    file: fileRecord,
    import: importRecord,
    page: pageRecord,
    extracted
  };
}

async function extractEducationalPhotoText({ imageData, grade, subjectTitle, topic, pageNumber, language }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "Extract educational content from a textbook or workbook photo for review.",
                "Do not solve tasks unless an answer is printed on the page.",
                "Do not invent missing text.",
                "Return strict JSON with keys: text, tasks, learningObjectives, warnings.",
                "If unreadable, put an empty text and explain in warnings.",
                "The extracted content is not trusted until human review."
              ].join(" ")
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({ grade, subjectTitle, topic, pageNumber, language }, null, 2)
            },
            {
              type: "input_image",
              image_url: imageData
            }
          ]
        }
      ],
      temperature: 0,
      max_output_tokens: 1400
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI OCR error: ${response.status} ${text.slice(0, 160)}`);
  }

  const data = await response.json();
  const content = data.output_text || "";
  try {
    const parsed = JSON.parse(content);
    return {
      text: cleanText(parsed.text || ""),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 20) : [],
      learningObjectives: Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives.slice(0, 20) : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice(0, 20) : []
    };
  } catch {
    return {
      text: cleanText(content),
      tasks: [],
      learningObjectives: [],
      warnings: ["Model returned non-JSON OCR text; saved as raw text for review."]
    };
  }
}

function readDb() {
  return normalizeDb(JSON.parse(fs.readFileSync(dbPath, "utf8").replace(/^\uFEFF/, "")));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
}

function normalizeDb(db) {
  const defaults = {
    students: [],
    accounts: [],
    parentLinks: [],
    learningPlans: [],
    trainerAttempts: [],
    cloudSync: [],
    notifications: [],
    accountLifecycle: [],
    questions: [],
    quizAttempts: [],
    feedback: [],
    photos: [],
    events: []
  };
  const normalized = { ...defaults, ...db };
  return normalized;
}

function createStudent(name, grade, city = "") {
  return {
    id: crypto.randomUUID(),
    name,
    grade,
    city: normalizeCity(city),
    role: "student",
    status: "active",
    points: 120,
    streak: 5,
    grades: [
      { subject: "Математика", value: 4, date: "2026-07-01", type: "СОР" },
      { subject: "Английский язык", value: 5, date: "2026-07-02", type: "Домашняя работа" },
      { subject: "Естествознание", value: 4, date: "2026-07-03", type: "СОЧ" }
    ],
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };
}

function getSession(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return sessions.get(token);
}

function getOrCreateStudent(db, session, body) {
  if (session) {
    const existing = db.students.find((item) => item.id === session.studentId);
    if (existing) return existing;
  }

  const name = cleanText(body.studentName || body.name || "Аружан");
  const grade = clampGrade(body.grade || 6);
  const city = normalizeCity(body.city || "");
  let student = db.students.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!student) {
    student = createStudent(name, grade, city);
    db.students.push(student);
  }
  student.grade = grade;
  if (city) student.city = city;
  markStudentActive(student);
  cancelInactiveWarnings(db, student);
  return student;
}

function normalizeTutorRequest(body, student) {
  return {
    studentName: student.name,
    grade: clampGrade(body.grade || student.grade),
    subjectTitle: cleanText(body.subjectTitle || "Математика"),
    subjectKey: cleanText(body.subjectKey || "math"),
    topic: cleanText(body.topic || "общая тема"),
    mode: cleanText(body.mode || "school"),
    language: cleanText(body.language || "ru"),
    difficulty: cleanText(body.difficulty || "средний"),
    question: cleanText(body.question || body.text || "")
  };
}

async function askOpenAI(promptData, imageData) {
  const input = [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: [
            "Ты iMama, терпеливый школьный репетитор для Казахстана.",
            "Нельзя сразу выдавать готовый ответ.",
            "Обязательный формат: Короткое объяснение условия, Подсказка, Пошаговое решение, Ответ, Проверка, Похожее задание, Похвала.",
            "После важных шагов задавай короткий вопрос ребенку.",
            "Если ученик ошибся, объясняй мягко.",
            "Always answer in the selected learning language. Do not mix languages unless the student asks for translation.",
            "If language is ru: answer in грамотный русский язык, use simple explanations and correct school terminology.",
            "If language is kk: answer in грамотный литературный қазақ тілі, use correct school terms, do not mix Russian and Kazakh, avoid Russified or distorted words.",
            "If language is en: answer in clear school English, correct grammar, no slang unless requested, adapt explanations to the student's grade.",
            "Before generating an answer, use knowledgeContext. Priority: official curriculum, textbooks, SOR/SOCH, teacher materials, then AI explanation.",
            "Never invent school facts when verified educational material exists.",
            "If knowledgeContext has no results and says awaitingImport, clearly say that official materials are awaiting import and provide only a general learning strategy, not fictional curriculum facts."
          ].join(" ")
        }
      ]
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify(promptData, null, 2)
        }
      ]
    }
  ];

  if (imageData) {
    input[1].content.push({
      type: "input_image",
      image_url: imageData
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input,
      temperature: 0.4,
      max_output_tokens: 1600
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  if (data.output_text) return data.output_text;

  const message = data.output?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text" || item.text);
  return message?.text || makeTutorFallback(promptData);
}

function makeTutorFallback(data) {
  const modeNames = {
    school: "школьная программа",
    sor: "подготовка к СОР",
    soch: "подготовка к СОЧ",
    unt: "подготовка к ЕНТ"
  };

  if (data.language === "kk") {
    return [
      `Диагностика: ${data.grade}-сынып, пән: ${data.subjectTitle}, тақырып: ${data.topic}, деңгей: ${data.difficulty}.`,
      `Шартты қысқаша түсіндіру: "${data.question}" тапсырмасын бірден дайын жауапқа көшпей, алдымен не берілгенін және не сұралғанын анықтаймыз.`,
      "Сұрақ: саған қай жері түсінікті, ал қай жері қиын болды?",
      `Кеңес: "берілгені" және "табу керек" бөліктерін бөлек жаз. Содан кейін оны "${data.topic}" тақырыбымен байланыстыр.`,
      [
        "Қадамдық шешу:",
        "1. Шартты мұқият оқып, негізгі сөздерді белгіле. Неге алдымен осылай істейтініміз түсінікті ме?",
        "2. Қажетті ережені немесе тәсілді таңда. Қалай ойлайсың, қай тәсіл сәйкес келеді?",
        "3. Бірінші шағын қадамды орында және оны өз сөзіңмен түсіндір.",
        "4. Аралық нәтижені тексер: ол сұраққа жауап беруге көмектесе ме?",
        "5. Тек содан кейін қорытынды жауапты жаз."
      ].join("\n"),
      "Жауап: қорытынды жауап қадамдар түсінікті болғаннан кейін жазылады.",
      "Тексеру: сұрақты қайта оқып, жауабың дәл соған жауап бере ме, тексер.",
      `Ұқсас тапсырма: "${data.topic}" тақырыбы бойынша жеңілірек бір мысал құрастыр және дәл осы тәсілмен шығар.`,
      "Жарайсың! Ең маңыздысы — дайын жауапты көшіру емес, түсініп үйрену."
    ].join("\n\n");
  }

  if (data.language === "en") {
    return [
      `Diagnosis: grade ${data.grade}, subject: ${data.subjectTitle}, topic: ${data.topic}, level: ${data.difficulty}.`,
      `Short explanation: for "${data.question}", we will not jump to the final answer. First, we identify what is given, what is asked, and which rule fits.`,
      "Question for you: what part is clear, and where did it become difficult?",
      `Hint: write two short lines: "given" and "need to find". Then connect them with the topic "${data.topic}".`,
      [
        "Step-by-step solution:",
        "1. Read the task and mark the key words. Does it make sense why we start there?",
        "2. Choose the rule or method. What do you think fits here?",
        "3. Make the first small step and explain it in your own words.",
        "4. Check the intermediate result: does it help answer the question?",
        "5. Only then write the final answer."
      ].join("\n"),
      "Answer: the final answer should come after the reasoning is clear.",
      "Check: reread the question and make sure the answer responds to it directly.",
      `Similar task: create one easier example on "${data.topic}" and solve it the same way.`,
      "Great job. Understanding the method matters more than copying the answer."
    ].join("\n\n");
  }

  return [
    `Диагностика: ${data.grade} класс, предмет: ${data.subjectTitle}, тема: ${data.topic}, формат: ${modeNames[data.mode] || "учеба"}, сложность: ${data.difficulty}.`,
    `Короткое объяснение условия: задание "${data.question}" сначала нужно понять простыми словами. Не спешим к ответу: найдем, что дано, что спрашивают и какое правило подходит.`,
    "Вопрос к тебе: что уже понятно, а где стало трудно: в условии, выборе правила или вычислениях?",
    `Подсказка: выпиши "дано" и "нужно найти". Затем свяжи это с темой "${data.topic}".`,
    [
      "Пошаговое решение:",
      "1. Прочитай условие и подчеркни важные слова. Понятно, почему начинаем с этого?",
      "2. Выбери правило или способ решения. Как думаешь, что подойдет?",
      "3. Сделай первый маленький шаг и объясни его своими словами.",
      "4. Проверь промежуточный результат: он помогает ответить на вопрос?",
      "5. Только после этого записывай итог."
    ].join("\n"),
    "Ответ: итоговый ответ появится после шагов. Когда подключен ключ OpenAI, iMama сможет разобрать конкретные числа и текст задания точнее.",
    "Проверка: перечитай вопрос и сравни с ответом. Ответили именно на то, что спрашивали?",
    `Похожее задание: составь один более простой пример по теме "${data.topic}" и реши его тем же способом.`,
    "Похвала: молодец, что пробуешь разобраться. За попытку начислены баллы, а понимание важнее списывания."
  ].join("\n\n");
}

function makeAnalytics(db) {
  const uniqueStudents = new Set(db.students.map((item) => item.id));
  const cities = {};
  for (const student of db.students) {
    const city = normalizeCity(student.city || "Не указан");
    cities[city] = (cities[city] || 0) + 1;
  }
  const correct = db.quizAttempts.filter((item) => item.correct).length;
  const wrong = db.quizAttempts.filter((item) => !item.correct).length;
  const helpful = db.feedback.filter((item) => item.helpful).length;
  return {
    visits: db.events.filter((item) => item.type === "Вход").length,
    users: uniqueStudents.size,
    cities,
    questions: db.questions.length,
    correct,
    wrong,
    helpful,
    feedback: db.feedback.length,
    photos: db.photos.length
  };
}

function addPoints(student, amount, reason) {
  student.points = Number(student.points || 0) + amount;
  student.lastReward = `+${amount} за ${reason}`;
}

function addEvent(db, type, detail) {
  db.events.unshift({
    id: crypto.randomUUID(),
    type,
    detail,
    createdAt: new Date().toISOString()
  });
  db.events = db.events.slice(0, 200);
}

function clampGrade(value) {
  const grade = Number(value);
  if (!Number.isFinite(grade)) return 6;
  return Math.min(11, Math.max(1, Math.round(grade)));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 4000);
}

function normalizeCity(value) {
  const city = cleanText(value || "");
  if (!city) return "";
  return city
    .split(/([\s-]+)/)
    .map((part) => /^[\p{L}]+$/u.test(part) ? part.charAt(0).toLocaleUpperCase("ru-RU") + part.slice(1).toLocaleLowerCase("ru-RU") : part)
    .join("")
    .slice(0, 80);
}

function readJson(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
