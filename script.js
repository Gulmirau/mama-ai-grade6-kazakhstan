const subjectMeta = {
  "Математика": { icon: "∑", tags: "счет, задачи, величины" },
  "Русский язык": { icon: "Р", tags: "письмо, текст, грамматика" },
  "Казахский язык": { icon: "Қ", tags: "сөз, сөйлем, мәтін" },
  "Английский язык": { icon: "Aa", tags: "words, reading, grammar" },
  "Познание мира": { icon: "◎", tags: "семья, природа, общество" },
  "Литературное чтение": { icon: "К", tags: "чтение, герой, смысл" },
  "Естествознание": { icon: "◎", tags: "природа, вещества, организм" },
  "История Казахстана": { icon: "Т", tags: "даты, личности, события" },
  "География": { icon: "G", tags: "карта, климат, страны" },
  "Информатика": { icon: "{}", tags: "алгоритмы, код, данные" },
  "Алгебра": { icon: "x", tags: "уравнения, функции, графики" },
  "Геометрия": { icon: "△", tags: "фигуры, теоремы, доказательства" },
  "Физика": { icon: "F", tags: "силы, энергия, электричество" },
  "Химия": { icon: "H", tags: "элементы, реакции, вещества" },
  "Биология": { icon: "Б", tags: "клетка, организм, генетика" },
  "Всемирная история": { icon: "W", tags: "эпохи, страны, события" },
  "Алгебра и начала анализа": { icon: "ƒ", tags: "функции, пределы, производная" },
  "Подготовка к ЕНТ": { icon: "✓", tags: "пробники, ошибки, стратегия" }
};

const subjectTopicPresets = {
  "Математика": ["числа и счет", "текстовые задачи", "величины", "геометрические фигуры", "дроби"],
  "Русский язык": ["звуки и буквы", "части речи", "предложение", "текст", "орфография"],
  "Казахский язык": ["сөздік қор", "сөйлем", "септік", "мәтін", "аударма"],
  "Английский язык": ["alphabet and words", "reading", "present simple", "past simple", "speaking"],
  "Познание мира": ["семья и школа", "природа", "город и село", "безопасность", "профессии"],
  "Литературное чтение": ["чтение текста", "герой произведения", "главная мысль", "пересказ", "пословицы"],
  "Естествознание": ["растения", "животные", "вещества", "энергия", "экосистемы"],
  "История Казахстана": ["древний Казахстан", "саки", "тюрки", "Казахское ханство", "независимость"],
  "География": ["карта", "координаты", "климат", "материки", "население"],
  "Информатика": ["информация", "алгоритмы", "таблицы", "код", "интернет-безопасность"],
  "Алгебра": ["уравнения", "неравенства", "функции", "степени", "графики"],
  "Геометрия": ["треугольники", "параллельные прямые", "окружность", "площадь", "доказательство"],
  "Физика": ["скорость", "сила", "энергия", "давление", "электричество"],
  "Химия": ["атом", "элемент", "валентность", "реакции", "растворы"],
  "Биология": ["клетка", "ткани", "растения", "человек", "экология"],
  "Всемирная история": ["древний мир", "средние века", "новое время", "революции", "мировые войны"],
  "Алгебра и начала анализа": ["функции", "тригонометрия", "предел", "производная", "интеграл"],
  "Подготовка к ЕНТ": ["диагностика пробника", "профильные предметы", "работа над ошибками", "тайм-менеджмент", "повторение формул"]
};

const gradeSubjectGroups = {
  primary: ["Математика", "Русский язык", "Казахский язык", "Английский язык", "Познание мира", "Литературное чтение"],
  middle: ["Математика", "Русский язык", "Казахский язык", "Английский язык", "Естествознание", "История Казахстана", "География", "Информатика"],
  juniorHigh: ["Алгебра", "Геометрия", "Физика", "Химия", "Биология", "География", "История Казахстана", "Всемирная история", "Русский язык", "Казахский язык", "Английский язык", "Информатика"],
  senior: ["Алгебра и начала анализа", "Геометрия", "Физика", "Химия", "Биология", "География", "История Казахстана", "Всемирная история", "Русский язык", "Казахский язык", "Английский язык", "Информатика", "Подготовка к ЕНТ"]
};

const curriculumData = Array.from({ length: 11 }, (_, index) => {
  const grade = index + 1;
  const subjects = getSubjectNamesByGrade(grade);
  const topics = {};
  const textbookLinks = {};
  const sorTopics = {};
  const sochTopics = {};

  subjects.forEach((subject) => {
    const preset = subjectTopicPresets[subject] || ["основные понятия", "практика", "повторение"];
    topics[subject] = preset.map((topic) => `${topic} (${grade} класс)`);
    textbookLinks[subject] = {
      textbook: "Учебники будут подключены позже",
      workbook: "Материалы по программе РК будут добавлены в базу знаний"
    };
    sorTopics[subject] = [
      `СОР: ${preset[0]} (${grade} класс)`,
      `СОР: ${preset[1] || "практика"} (${grade} класс)`
    ];
    sochTopics[subject] = [
      `СОЧ: повторение четверти (${grade} класс)`,
      "Материалы по программе РК будут добавлены в базу знаний"
    ];
  });

  return { grade, subjects, topics, textbookLinks, sorTopics, sochTopics };
});

function getSubjectNamesByGrade(grade) {
  if (grade <= 4) return gradeSubjectGroups.primary;
  if (grade <= 6) return gradeSubjectGroups.middle;
  if (grade <= 9) return gradeSubjectGroups.juniorHigh;
  return gradeSubjectGroups.senior;
}

function getCurriculum() {
  return curriculumData.find((item) => item.grade === currentGrade) || curriculumData[5];
}

function subjectToKey(title) {
  const known = {
    "Математика": "math",
    "Русский язык": "russian",
    "Казахский язык": "kazakh",
    "Английский язык": "english",
    "Познание мира": "world_knowledge",
    "Литературное чтение": "reading",
    "Естествознание": "science",
    "История Казахстана": "history_kz",
    "География": "geography",
    "Информатика": "informatics",
    "Алгебра": "algebra",
    "Геометрия": "geometry",
    "Физика": "physics",
    "Химия": "chemistry",
    "Биология": "biology",
    "Всемирная история": "world_history",
    "Алгебра и начала анализа": "calculus",
    "Подготовка к ЕНТ": "ent"
  };
  return known[title] || title.toLowerCase().replace(/\s+/g, "_");
}

function makeSubjectItem(title) {
  const meta = subjectMeta[title] || { icon: "•", tags: "темы и задания" };
  const curriculum = getCurriculum();
  return {
    key: subjectToKey(title),
    title,
    icon: meta.icon,
    tags: meta.tags,
    topics: curriculum.topics[title] || ["основные темы"],
    textbookLinks: curriculum.textbookLinks[title] || {
      textbook: "Учебники будут подключены позже",
      workbook: "Материалы по программе РК будут добавлены в базу знаний"
    },
    sorTopics: curriculum.sorTopics[title] || ["Материалы по программе РК будут добавлены в базу знаний"],
    sochTopics: curriculum.sochTopics[title] || ["Материалы по программе РК будут добавлены в базу знаний"]
  };
}

function t(key) {
  return I18N?.[uiLang]?.[key] || I18N?.ru?.[key] || key;
}

function subjectLabel(title) {
  return SUBJECT_TRANSLATIONS?.[uiLang]?.[title] || title;
}

function applyTranslations() {
  document.documentElement.lang = uiLang === "kk" ? "kk" : uiLang === "en" ? "en" : "ru";
  document.title = t("appTitle");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
  });

  fillGrades();
  updateKazakhstanClock();
  applyExperienceSettings();
  updateProfileNote();
}

const quizBank = {
  default: {
    question: "Как лучше учить сложную тему?",
    answers: [
      ["Сразу искать готовый ответ", false],
      ["Разобрать правило, пример и ошибку", true],
      ["Пропустить тему", false]
    ]
  },
  math: {
    question: "Что такое процент?",
    answers: [["Одна сотая часть числа", true], ["Любое большое число", false], ["Только знак в задаче", false]]
  },
  algebra: {
    question: "Что нужно сделать после решения уравнения?",
    answers: [["Проверить подстановкой", true], ["Стереть условие", false], ["Сразу переходить дальше", false]]
  },
  kazakh: {
    question: "Что помогает понять роль слова в казахском предложении?",
    answers: [["Окончание и падеж", true], ["Только первая буква", false], ["Цвет ручки", false]]
  },
  unt: {
    question: "Что важнее всего в подготовке к ЕНТ?",
    answers: [["Анализ ошибок после пробника", true], ["Решать без проверки", false], ["Учить все без плана", false]]
  },
  ent: {
    question: "Что важнее всего в подготовке к ЕНТ?",
    answers: [["Анализ ошибок после пробника", true], ["Решать без проверки", false], ["Учить все без плана", false]]
  }
};

const trainerBank = [
  {
    mode: "gia",
    subject: "math",
    topic: "логика решения",
    question: "Демо ГИА: с чего лучше начинать задачу, если условие кажется сложным?",
    answers: [
      ["Сразу писать ответ", false],
      ["Выделить, что дано и что нужно найти", true],
      ["Пропустить задачу навсегда", false]
    ]
  },
  {
    mode: "ent",
    subject: "ent",
    topic: "стратегия ЕНТ",
    question: "Демо ЕНТ: что полезнее всего после пробного теста?",
    answers: [
      ["Разобрать ошибки по темам", true],
      ["Не смотреть результаты", false],
      ["Учить всё подряд без плана", false]
    ]
  },
  {
    mode: "weak",
    subject: "school",
    topic: "слабые темы",
    question: "Если тема часто вызывает ошибки, что поможет лучше?",
    answers: [
      ["Короткая ежедневная практика", true],
      ["Ругать себя за ошибку", false],
      ["Сразу переходить к новой теме", false]
    ]
  }
];

let currentTrainerQuestion = trainerBank[0];

const dailyThemes = [
  { name: "birds", particles: "birds", sound: "birds", colors: ["#7cc8ff", "#ffd166"] },
  { name: "flowers", particles: "flowers", sound: null, colors: ["#ff8ab3", "#63d8b5"] },
  { name: "clouds", particles: "clouds", sound: null, colors: ["#d9f1ff", "#ffffff"] },
  { name: "stars", particles: "stars", sound: null, colors: ["#ffd166", "#8d6df0"] },
  { name: "books", particles: "books", sound: null, colors: ["#76c7ff", "#ffb36b"] },
  { name: "pencils", particles: "pencils", sound: null, colors: ["#ffd166", "#ff7aa8"] },
  { name: "balloons", particles: "balloons", sound: null, colors: ["#ff7aa8", "#63d8b5"] },
  { name: "leaves", particles: "leaves", sound: null, colors: ["#79c96d", "#d9a441"] },
  { name: "butterflies", particles: "butterflies", sound: null, colors: ["#c69cff", "#ffb6d2"] },
  { name: "planets", particles: "planets", sound: null, colors: ["#8d6df0", "#76c7ff"] },
  { name: "snowflakes", particles: "snowflakes", sound: null, colors: ["#bfeaff", "#ffffff"] },
  { name: "iceCream", particles: "iceCream", sound: null, colors: ["#ffc3d8", "#ffe08a"] }
];

const analytics = JSON.parse(localStorage.getItem("mamaAiAnalytics") || "null") || {
  visits: 0,
  users: ["Аружан"],
  cities: {},
  questions: 0,
  correct: 0,
  wrong: 0,
  helpful: 0,
  feedback: [],
  events: []
};

let currentGrade = Number(localStorage.getItem("mamaAiGrade") || 6);
let currentSubjectKey = "math";
let uiLang = localStorage.getItem("mamaAiUiLang") || "ru";
let currentLang = localStorage.getItem("mamaAiLearningLang") || "ru";
let points = Number(localStorage.getItem("mamaAiPoints") || 120);
let streak = 5;
let level = 3;
let apiToken = localStorage.getItem("mamaAiApiToken") || "";
let serverOnline = false;
let aiConfigured = false;
let serverStudent = null;
let animationsEnabled = localStorage.getItem("mamaAiAnimations") !== "off";
let soundEnabled = localStorage.getItem("mamaAiSound") !== "off";
let reducedMotionEnabled = localStorage.getItem("mamaAiReducedMotion") === "on" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let dailyThemeEnabled = localStorage.getItem("mamaAiDailyTheme") !== "off";
let lastAnswerText = "";
let recognition = null;
let clockTimer = null;
let birdAudio = null;

const gradeSelect = document.getElementById("gradeSelect");
const modeSelect = document.getElementById("modeSelect");
const roleSelect = document.getElementById("roleSelect");
const interfaceLanguageSelect = document.getElementById("interfaceLanguageSelect");
const learningLanguageSelect = document.getElementById("learningLanguageSelect");
const studentName = document.getElementById("studentName");
const studentCity = document.getElementById("studentCity");
const userEmail = document.getElementById("userEmail");
const authProviderSelect = document.getElementById("authProviderSelect");
const animationToggle = document.getElementById("animationToggle");
const soundToggle = document.getElementById("soundToggle");
const reducedMotionToggle = document.getElementById("reducedMotionToggle");
const dailyThemeToggle = document.getElementById("dailyThemeToggle");
const dailyThemeLayer = document.getElementById("dailyThemeLayer");
const natureSoundBtn = document.getElementById("natureSoundBtn");
const currentDateText = document.getElementById("currentDateText");
const currentTimeText = document.getElementById("currentTimeText");
const speakBtn = document.getElementById("speakBtn");
const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");
const praisePop = document.getElementById("praisePop");
const confettiLayer = document.getElementById("confettiLayer");
const subjectGrid = document.getElementById("learn");
const chat = document.getElementById("chat");
const chatTitle = document.getElementById("chatTitle");
const userInput = document.getElementById("userInput");
const quizQuestion = document.getElementById("quizQuestion");
const answerGrid = document.getElementById("answerGrid");
const quizResult = document.getElementById("quizResult");
const kbStatusPill = document.getElementById("kbStatusPill");
const kbResults = document.getElementById("kbResults");
const kbKeyword = document.getElementById("kbKeyword");
const kbQuarter = document.getElementById("kbQuarter");
const cloudStatusPill = document.getElementById("cloudStatusPill");
const studentCabinetText = document.getElementById("studentCabinetText");
const parentCabinetText = document.getElementById("parentCabinetText");
const cloudBackendText = document.getElementById("cloudBackendText");
const authStatusText = document.getElementById("authStatusText");
const weeklyPlanList = document.getElementById("weeklyPlanList");
const trainerModeSelect = document.getElementById("trainerModeSelect");
const trainerQuestion = document.getElementById("trainerQuestion");
const trainerAnswers = document.getElementById("trainerAnswers");
const trainerResult = document.getElementById("trainerResult");
const weakTopicsList = document.getElementById("weakTopicsList");
const recommendationList = document.getElementById("recommendationList");
const currentTopicInsight = document.getElementById("currentTopicInsight");
const runLifecycleBtn = document.getElementById("runLifecycleBtn");
const lifecyclePolicy = document.getElementById("lifecyclePolicy");
const lifecycleList = document.getElementById("lifecycleList");
const lifecycleEmailStatus = document.getElementById("lifecycleEmailStatus");
const adminAccessText = document.getElementById("adminAccessText");
const adminStudentRows = document.getElementById("adminStudentRows");
const inactiveStudentList = document.getElementById("inactiveStudentList");

init();

async function init() {
  analytics.visits += 1;
  recordEvent("Вход на сайт", `Открыт ${currentGrade} класс`);
  applyExperienceSettings();
  startKazakhstanClock();
  renderDailyTheme();
  interfaceLanguageSelect.value = uiLang;
  learningLanguageSelect.value = currentLang;
  if (studentCity) studentCity.value = localStorage.getItem("mamaAiCity") || studentCity.value || "Алматы";
  if (userEmail) userEmail.value = localStorage.getItem("mamaAiEmail") || userEmail.value || "";
  if (authProviderSelect) authProviderSelect.value = localStorage.getItem("mamaAiAuthProvider") || "email";
  trackLocalCity();
  fillGrades();
  bindEvents();
  applyTranslations();
  await initServerSession();
  renderAll();
  saveAnalytics();
}

function fillGrades() {
  gradeSelect.innerHTML = "";
  for (let grade = 1; grade <= 11; grade += 1) {
    const option = document.createElement("option");
    option.value = grade;
    option.textContent = uiLang === "en" ? `Grade ${grade}` : `${grade} ${t("gradeClass")}`;
    gradeSelect.appendChild(option);
  }
  gradeSelect.value = String(currentGrade);
}

async function initServerSession() {
  try {
    const session = await apiFetch("/api/session", {
      method: "POST",
      body: {
        name: studentName.value.trim() || "Аружан",
        city: studentCity?.value.trim() || "Алматы",
        email: userEmail?.value.trim() || "",
        authProvider: authProviderSelect?.value || "email",
        grade: currentGrade,
        role: roleSelect.value
      }
    }, false);
    apiToken = session.token;
    localStorage.setItem("mamaAiApiToken", apiToken);
    serverStudent = session.student;
    serverOnline = true;
    await syncServerState();
  } catch {
    serverOnline = false;
    aiConfigured = false;
    updateProfileNote();
  }
}

async function syncServerState() {
  try {
    const state = await apiFetch("/api/state");
    serverOnline = true;
    aiConfigured = Boolean(state.aiConfigured);
    serverStudent = state.student || serverStudent;
    if (serverStudent) {
      points = Number(serverStudent.points || points);
      localStorage.setItem("mamaAiPoints", points);
      if (serverStudent.grade) {
        currentGrade = Number(serverStudent.grade);
        gradeSelect.value = String(currentGrade);
      }
    }
    applyServerAnalytics(state.analytics, state.events);
    updateProfileNote();
  } catch {
    serverOnline = false;
    updateProfileNote();
  }
}

async function apiFetch(path, options = {}, requireAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (requireAuth && apiToken) headers.Authorization = `Bearer ${apiToken}`;
  try {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return response.json();
  } catch (error) {
    const fallback = makePublicApiFallback(path, options.body || {});
    if (fallback) return fallback;
    throw error;
  }
}

function makePublicApiFallback(path, body = {}) {
  if (path === "/api/session") {
    return {
      token: "public-demo-token",
      role: body.role || "student",
      student: {
        id: "public-demo-student",
        name: body.name || studentName.value.trim() || "Ученик",
        city: body.city || studentCity?.value.trim() || "Алматы",
        email: body.email || userEmail?.value.trim() || "",
        grade: currentGrade,
        points,
        streak,
        grades: []
      }
    };
  }

  if (path === "/api/state") {
    return {
      student: {
        id: "public-demo-student",
        name: studentName.value.trim() || "Ученик",
        city: studentCity?.value.trim() || "Алматы",
        grade: currentGrade,
        points,
        streak,
        grades: []
      },
      students: [],
      analytics: { ...analytics, studentsByGrade: {}, inactiveStudents: [] },
      events: [],
      aiConfigured: false
    };
  }

  if (path.startsWith("/api/kb/status")) {
    return {
      status: "ready_for_import",
      officialDataPolicy: "No fictional official curriculum records. Missing materials are marked awaiting_import.",
      counts: {
        subjects: 0,
        curriculum: 0,
        lessons: 0,
        topics: 0,
        textbooks: 0,
        workbooks: 0,
        teacherMaterials: 0,
        sor: 0,
        soch: 0,
        unt: 0,
        questionBank: 0,
        files: 0,
        imports: 0
      },
      supportedLanguages: ["ru", "kk", "en"],
      supportedImportTypes: ["pdf", "docx", "xlsx", "csv", "pptx", "json", "image"]
    };
  }

  if (path.startsWith("/api/kb/search")) {
    return {
      query: {},
      priority: ["official_curriculum", "textbooks", "sor_soch", "teacher_materials", "ai_explanation"],
      results: [],
      awaitingImport: [
        { entityType: "curriculum", scope: "Kazakhstan official curriculum grades 1-11", status: "awaiting_import" },
        { entityType: "textbooks", scope: "Official or licensed textbooks and workbooks", status: "awaiting_import" },
        { entityType: "assessment", scope: "SOR, SOCH, ENT question banks and criteria", status: "awaiting_import" }
      ],
      canUseAiFallback: true
    };
  }

  if (path === "/api/ask") {
    return {
      answer: makeAnswer(body.question || body.text || ""),
      aiUsed: false,
      student: {
        id: "public-demo-student",
        name: body.studentName || studentName.value.trim() || "Ученик",
        grade: currentGrade,
        points,
        streak,
        grades: []
      }
    };
  }

  if (path === "/api/photo") {
    return {
      answer: "Фото принято. В публичной версии без облачного backend фото не сохраняется постоянно. Для настоящего OCR нужно подключить серверное хранилище и OpenAI API.",
      aiUsed: false
    };
  }

  if (path === "/api/kb/photo-import") {
    return {
      ok: true,
      status: "uploaded_awaiting_ocr",
      message: "Public demo accepted the photo metadata. Persistent OCR import requires cloud storage.",
      extracted: null
    };
  }

  if (path === "/api/cloud/status") {
    return {
      provider: "public-static",
      ready: false,
      mode: "static_demo",
      message: "Публичная статическая версия активна. Для общей базы нужен облачный backend.",
      requiredForProduction: ["authentication", "shared_database", "file_storage", "OCR_queue", "analytics"]
    };
  }

  if (path === "/api/account/lifecycle" || path === "/api/account/lifecycle/run") {
    return {
      policy: {
        inactivityWarningDays: 30,
        inactivityGraceDays: 3,
        warningChannel: "email_queue",
        emailProvider: "disabled",
        emailReady: false
      },
      students: [
        {
          id: "public-demo-student",
          name: studentName.value.trim() || "Student",
          grade: currentGrade,
          status: "active",
          lastSeenAt: new Date().toISOString(),
          daysInactive: 0,
          warningSentAt: null,
          scheduledDeletionAt: null
        }
      ],
      notifications: [],
      accountLifecycle: []
    };
  }

  if (path === "/api/admin/students") {
    return makeLocalAdminStudents();
  }

  if (path === "/api/parent/summary") {
    return makeLocalParentSummary();
  }

  if (path === "/api/learning-plan" || path === "/api/learning-plan/generate") {
    const plan = makeLocalPlan();
    return { plan, parentSummary: makeLocalParentSummary(), ...plan };
  }

  if (path === "/api/trainer/attempt") {
    return {
      attempt: {
        id: `local-${Date.now()}`,
        mode: body.mode || "gia",
        topic: body.topic || "diagnostic",
        correct: Boolean(body.correct),
        sourceStatus: "demo_not_official"
      },
      parentSummary: makeLocalParentSummary(),
      student: {
        id: "public-demo-student",
        name: studentName.value.trim() || "Ученик",
        grade: currentGrade,
        points,
        streak,
        grades: []
      }
    };
  }

  if (path === "/api/quiz" || path === "/api/feedback" || path === "/api/grades/import") {
    return {
      student: {
        id: "public-demo-student",
        name: studentName.value.trim() || "Ученик",
        grade: currentGrade,
        points,
        streak,
        grades: []
      },
      analytics,
      events: []
    };
  }

  return null;
}

function updateProfileNote() {
  const sourceText = document.getElementById("gradeSource").value;
  const serverText = uiLang === "en"
    ? (serverOnline ? "server connected" : "server is offline, local mode is active")
    : uiLang === "kk"
      ? (serverOnline ? "сервер қосылды" : "сервер іске қосылмаған, жергілікті режим жұмыс істеп тұр")
      : (serverOnline ? "сервер подключен" : "сервер не запущен, работает локальный режим");
  const aiText = uiLang === "en"
    ? (aiConfigured ? "AI API connected" : "AI API is not connected, tutor template is used")
    : uiLang === "kk"
      ? (aiConfigured ? "AI API қосылды" : "AI API қосылмаған, репетиторлық үлгі қолданылады")
      : (aiConfigured ? "AI API подключен" : "AI API не подключен, используется репетиторский шаблон");
  document.getElementById("profileNote").textContent = `${serverText}; ${aiText}. ${t("gradeSource")}: ${sourceText}.`;
}

function bindEvents() {
  interfaceLanguageSelect.addEventListener("change", () => {
    uiLang = interfaceLanguageSelect.value;
    localStorage.setItem("mamaAiUiLang", uiLang);
    applyTranslations();
    renderAll();
  });

  learningLanguageSelect.addEventListener("change", () => {
    currentLang = learningLanguageSelect.value;
    localStorage.setItem("mamaAiLearningLang", currentLang);
    applyTranslations();
    addMessage("bot success", getLanguageMessage());
  });

  animationToggle.addEventListener("change", () => {
    animationsEnabled = animationToggle.checked;
    localStorage.setItem("mamaAiAnimations", animationsEnabled ? "on" : "off");
    applyExperienceSettings();
  });

  soundToggle.addEventListener("change", () => {
    soundEnabled = soundToggle.checked;
    localStorage.setItem("mamaAiSound", soundEnabled ? "on" : "off");
    if (!soundEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
    if (!soundEnabled) stopBirdSound();
    applyExperienceSettings();
  });

  reducedMotionToggle.addEventListener("change", () => {
    reducedMotionEnabled = reducedMotionToggle.checked;
    localStorage.setItem("mamaAiReducedMotion", reducedMotionEnabled ? "on" : "off");
    applyExperienceSettings();
    renderDailyTheme();
  });

  dailyThemeToggle.addEventListener("change", () => {
    dailyThemeEnabled = dailyThemeToggle.checked;
    localStorage.setItem("mamaAiDailyTheme", dailyThemeEnabled ? "on" : "off");
    if (!dailyThemeEnabled) stopBirdSound();
    applyExperienceSettings();
    renderDailyTheme();
  });

  natureSoundBtn.addEventListener("click", toggleNatureSound);

  speakBtn.addEventListener("click", speakLastAnswer);
  voiceBtn.addEventListener("click", startVoiceInput);

  gradeSelect.addEventListener("change", () => {
    currentGrade = Number(gradeSelect.value);
    localStorage.setItem("mamaAiGrade", currentGrade);
    currentSubjectKey = getSubjectsForGrade()[0].key;
    recordEvent("Смена класса", `${currentGrade} класс`);
    initServerSession();
    renderAll();
  });

  modeSelect.addEventListener("change", () => {
    recordEvent("Смена режима", modeSelect.options[modeSelect.selectedIndex].textContent);
    renderPlan();
    renderQuiz();
  });

  studentName.addEventListener("change", () => {
    const name = studentName.value.trim() || "Ученик";
    if (!analytics.users.includes(name)) analytics.users.push(name);
    recordEvent("Профиль", `Выбран ученик: ${name}`);
    initServerSession();
    renderAnalytics();
  });

  if (studentCity) {
    studentCity.addEventListener("change", () => {
      const city = studentCity.value.trim() || "Алматы";
      localStorage.setItem("mamaAiCity", city);
      trackLocalCity();
      recordEvent("Город", `Выбран город: ${city}`);
      initServerSession();
      renderAnalytics();
    });
  }

  if (userEmail) {
    userEmail.addEventListener("change", () => {
      localStorage.setItem("mamaAiEmail", userEmail.value.trim());
      recordEvent("Email", userEmail.value.trim() ? "Email добавлен в профиль" : "Email очищен");
      initServerSession();
    });
  }

  if (authProviderSelect) {
    authProviderSelect.addEventListener("change", () => {
      localStorage.setItem("mamaAiAuthProvider", authProviderSelect.value);
      recordEvent("Авторизация", `Способ входа: ${authProviderSelect.value}`);
      initServerSession();
      renderAccountAndParent();
    });
  }

  roleSelect.addEventListener("change", () => {
    recordEvent("Роль", roleSelect.options[roleSelect.selectedIndex].textContent);
    initServerSession();
  });

  document.getElementById("gradeSource").addEventListener("change", updateProfileNote);

  document.getElementById("chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  document.getElementById("kbSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    renderKnowledgeBaseSearch();
  });

  document.getElementById("hintBtn").addEventListener("click", () => {
    addMessage("bot success", makeHint());
    recordEvent("Подсказка", currentSubject().title);
  });

  document.getElementById("photoInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById("photoStatus").textContent = `Фото "${file.name}" добавлено. В демо-версии включен сценарий разбора, OCR/AI подключается на следующем этапе.`;
    handlePhotoUpload(file);
    recordEvent("Фото задания", file.name);
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => chooseLanguage(button));
  });

  answerGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) checkQuizAnswer(button);
  });

  document.querySelectorAll("[data-helpful]").forEach((button) => {
    button.addEventListener("click", () => saveFeedback(button.dataset.helpful === "yes"));
  });

  document.getElementById("exportAnalyticsBtn").addEventListener("click", exportAnalytics);
  document.getElementById("logoutBtn").addEventListener("click", () => {
    apiToken = "";
    localStorage.removeItem("mamaAiApiToken");
    recordEvent("Выход", studentName.value.trim() || "Ученик");
    addMessage("bot", "Сессия завершена. Можно снова выбрать роль и продолжить работу.");
  });

  document.getElementById("gradeImportForm").addEventListener("submit", importGrades);
  if (runLifecycleBtn) runLifecycleBtn.addEventListener("click", runAccountLifecycleCheck);
  document.getElementById("generatePlanBtn").addEventListener("click", generateSmartPlan);
  document.getElementById("nextTrainerBtn").addEventListener("click", renderTrainerQuestion);
  trainerModeSelect.addEventListener("change", renderTrainerQuestion);
  trainerAnswers.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) checkTrainerAnswer(button);
  });
}

function renderAll() {
  ensureSubjectForGrade();
  applyGradeAssessmentRules();
  document.getElementById("brandSubtitle").textContent = uiLang === "en"
    ? `Grade ${currentGrade} of 1–11, Kazakhstan`
    : `${currentGrade} ${t("gradeClass")} из 1–11, Казахстан`;
  renderSubjects();
  renderMaterials();
  renderKnowledgeBaseStatus();
  renderPlan();
  renderProgress();
  renderAccountAndParent();
  renderTrainerQuestion();
  renderQuiz();
  renderScore();
  renderAnalytics();
  chatTitle.textContent = subjectLabel(currentSubject().title);
}

function isNoMarksGrade() {
  return currentGrade === 1;
}

function noMarksText() {
  if (uiLang === "kk") return "1-сыныпта баға, БЖБ және ТЖБ көрсетілмейді. Мұнда тек жұмсақ жаттығу, түсіндіру және қызығушылықты қолдау бар.";
  if (uiLang === "en") return "Grade 1 does not show marks, SOR, or SOCH. This level focuses on gentle practice, explanation, and motivation.";
  return "В 1 классе оценки, СОР и СОЧ не показываются. Здесь только мягкая тренировка, объяснение и поддержка интереса к учебе.";
}

function applyGradeAssessmentRules() {
  const sorOption = modeSelect.querySelector('option[value="sor"]');
  const sochOption = modeSelect.querySelector('option[value="soch"]');
  const gradeImportForm = document.getElementById("gradeImportForm");

  if (isNoMarksGrade()) {
    if (modeSelect.value === "sor" || modeSelect.value === "soch") {
      modeSelect.value = "school";
    }
    if (sorOption) sorOption.disabled = true;
    if (sochOption) sochOption.disabled = true;
    if (gradeImportForm) gradeImportForm.hidden = true;
  } else {
    if (sorOption) sorOption.disabled = false;
    if (sochOption) sochOption.disabled = false;
    if (gradeImportForm) gradeImportForm.hidden = false;
  }
}

function getSubjectsForGrade() {
  return getCurriculum().subjects.map(makeSubjectItem);
}

function currentSubject() {
  return getSubjectsForGrade().find((subject) => subject.key === currentSubjectKey) || getSubjectsForGrade()[0];
}

function ensureSubjectForGrade() {
  const subjects = getSubjectsForGrade();
  if (!subjects.some((subject) => subject.key === currentSubjectKey)) {
    currentSubjectKey = subjects[0].key;
  }
}

function renderSubjects() {
  const subjects = getSubjectsForGrade();
  subjectGrid.innerHTML = "";
  subjects.forEach((subject) => {
    const button = document.createElement("button");
    button.className = `subject-card ${subject.key === currentSubjectKey ? "active" : ""}`;
    button.dataset.subject = subject.key;
    button.innerHTML = `<span class="subject-icon">${subject.icon}</span><strong>${subjectLabel(subject.title)}</strong><small>${subject.tags}</small>`;
    button.addEventListener("click", () => {
      currentSubjectKey = subject.key;
      recordEvent("Выбор предмета", `${currentGrade} класс: ${subject.title}`);
      renderSubjects();
      renderMaterials();
      renderKnowledgeBaseSearch();
      renderPlan();
      renderProgress();
      renderQuiz();
      chatTitle.textContent = subjectLabel(subject.title);
      addMessage("bot", makeSubjectIntro(subject));
    });
    subjectGrid.appendChild(button);
  });
}

async function renderKnowledgeBaseStatus() {
  if (!kbStatusPill || !kbResults) return;
  try {
    const status = await apiFetch("/api/kb/status", {}, false);
    kbStatusPill.textContent = status.status;
    const counts = status.counts || {};
    const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
    if (!total) {
      kbResults.innerHTML = `<p>${t("kbAwaiting")}</p>`;
    }
  } catch {
    kbStatusPill.textContent = "offline";
    kbResults.innerHTML = `<p>${t("kbOffline")}</p>`;
  }
}

async function renderKnowledgeBaseSearch() {
  if (!kbResults) return;
  const subject = currentSubject();
  const params = new URLSearchParams({
    keyword: kbKeyword.value.trim(),
    grade: String(currentGrade),
    subject: subject.key,
    quarter: kbQuarter.value,
    language: currentLang
  });

  kbResults.innerHTML = `<p>${t("kbSearching")}</p>`;
  try {
    const search = await apiFetch(`/api/kb/search?${params.toString()}`, {}, false);
    kbStatusPill.textContent = search.results?.length ? "found" : "awaiting_import";

    if (!search.results?.length) {
      const waiting = (search.awaitingImport || []).map((item) => `<li><strong>${item.entityType}</strong><span>${item.scope}</span><small>${item.status}</small></li>`).join("");
      kbResults.innerHTML = `<p>${t("kbAwaiting")}</p><ul>${waiting}</ul>`;
      return;
    }

    kbResults.innerHTML = search.results.map((item) => {
      const record = item.record || {};
      const title = record.title || record.topic || record.subject || item.source;
      const detail = record.status || record.academicYear || "";
      return `<article><strong>${title}</strong><span>${item.source}</span><small>${detail}</small></article>`;
    }).join("");
  } catch {
    kbStatusPill.textContent = "offline";
    kbResults.innerHTML = `<p>${t("kbOffline")}</p>`;
  }
}

function renderMaterials() {
  const subject = currentSubject();
  const curriculum = getCurriculum();
  document.getElementById("materialsTitle").textContent = uiLang === "en"
    ? `${subjectLabel(subject.title)}: Grade ${currentGrade}`
    : `${subjectLabel(subject.title)}: ${currentGrade} ${t("gradeClass")}`;
  document.getElementById("materialsGrade").textContent = uiLang === "en" ? `Grade ${currentGrade}` : `${currentGrade} ${t("gradeClass")}`;

  document.getElementById("topicList").innerHTML = subject.topics
    .map((topic) => `<li>${topic}</li>`)
    .join("");

  document.getElementById("resourceList").innerHTML = [
    `<strong>${t("textbook")}:</strong> ${t("textbookStub")}`,
    `<strong>${t("workbook")}:</strong> ${t("materialsStub")}`,
    `<strong>${t("knowledgeBase")}:</strong> ${t("materialsStub")}`
  ].map((item) => `<li>${item}</li>`).join("");

  const assessmentItems = isNoMarksGrade()
    ? [
      noMarksText(),
      `<strong>${t("miniTest")}:</strong> ${quizBank[subject.key]?.question || quizBank.default.question}`
    ]
    : [
      ...curriculum.sorTopics[subject.title].map((item) => `<strong>СОР:</strong> ${item}`),
      ...curriculum.sochTopics[subject.title].map((item) => `<strong>СОЧ:</strong> ${item}`),
      `<strong>${t("miniTest")}:</strong> ${quizBank[subject.key]?.question || quizBank.default.question}`
    ];
  document.getElementById("assessmentList").innerHTML = assessmentItems.map((item) => `<li>${item}</li>`).join("");
}

function makeSubjectIntro(subject) {
  if (currentLang === "kk") {
    return `${currentGrade}-сынып, пән: ${subjectLabel(subject.title)}. Тақырыптар: ${subject.topics.join(", ")}. Сұрағыңды жаз, мен қадамдап түсіндіремін.`;
  }
  if (currentLang === "en") {
    return `Grade ${currentGrade}, subject: ${subjectLabel(subject.title)}. Topics: ${subject.topics.join(", ")}. Write your question, and I will explain it step by step.`;
  }
  return `${subjectLabel(subject.title)}, ${currentGrade} класс. Доступные темы: ${subject.topics.join(", ")}. Напишите вопрос, и я объясню по шагам.`;
}

function renderPlan() {
  const subject = currentSubject();
  const mode = isNoMarksGrade() && (modeSelect.value === "sor" || modeSelect.value === "soch") ? "school" : modeSelect.value;
  const plan = document.getElementById("dailyPlan");
  const labels = {
    school: [`Повторить тему: ${subject.topics[0]}`, "Решить 5 заданий", "Пройти мини-тест"],
    sor: ["Выделить цели раздела", "Повторить слабые темы", "Решить 3 типовых задания СОР"],
    soch: ["Собрать темы четверти", "Сделать пробный вариант", "Разобрать ошибки"],
    unt: ["Пройти 10 вопросов по профилю", "Отметить ошибки", "Повторить формулы и даты"]
  };
  document.getElementById("planTime").textContent = mode === "unt" ? "45 минут" : "25 минут";
  plan.innerHTML = labels[mode].map((item, index) => `<li><input type="checkbox" ${index === 0 ? "checked" : ""} /> ${item}</li>`).join("");
}

function renderProgress() {
  const rows = document.getElementById("progressRows");
  const subjects = getSubjectsForGrade().slice(0, 6);

  if (isNoMarksGrade()) {
    document.getElementById("progressTitle").textContent = uiLang === "en"
      ? `${studentName.value || "Student"}: Grade 1`
      : `${studentName.value || "Ученик"}: 1 ${t("gradeClass")}`;
    rows.innerHTML = subjects.map((subject) => {
      return `<div class="progress-row no-marks-row"><span>${subjectLabel(subject.title)}</span><div class="bar"><i style="width: 100%"></i></div><strong>✓</strong></div>`;
    }).join("");
    document.getElementById("parentNote").textContent = noMarksText();
    return;
  }

  rows.innerHTML = subjects.map((subject, index) => {
    const value = getProgressValue(subject.key, index, subject.title);
    return `<div class="progress-row"><span>${subjectLabel(subject.title)}</span><div class="bar"><i style="width: ${value}%"></i></div><strong>${value}%</strong></div>`;
  }).join("");

  const weakest = subjects.map((subject, index) => ({
    title: subject.title,
    value: getProgressValue(subject.key, index, subject.title)
  })).sort((a, b) => a.value - b.value)[0];

  document.getElementById("progressTitle").textContent = uiLang === "en"
    ? `${studentName.value || "Student"}: Grade ${currentGrade}`
    : `${studentName.value || "Ученик"}: ${currentGrade} ${t("gradeClass")}`;
  document.getElementById("parentNote").textContent = `Слабая зона сейчас: ${subjectLabel(weakest.title)} (${weakest.value}%). Рекомендуем короткое повторение, 3 задания и проверку ошибок.`;
}

function getProgressValue(key, index, title = "") {
  const realGrades = serverStudent?.grades?.filter((grade) => grade.subject === title) || [];
  if (realGrades.length) {
    const average = realGrades.reduce((sum, grade) => sum + Number(grade.value || 0), 0) / realGrades.length;
    return Math.max(20, Math.min(100, Math.round((average / 5) * 100)));
  }
  const seed = currentGrade * 9 + key.length * 7 + index * 11 + points;
  return 48 + (seed % 43);
}

async function renderAccountAndParent() {
  const subject = currentSubject();
  if (studentCabinetText) {
    const city = studentCity?.value.trim() || serverStudent?.city || "Алматы";
    studentCabinetText.textContent = `${studentName.value || "Ученик"}: ${currentGrade} класс, ${city}, ${subjectLabel(subject.title)}, ${points} баллов.`;
  }
  if (parentCabinetText) {
    parentCabinetText.textContent = "Родительский кабинет показывает текущую тему, слабые места, рекомендации и план занятий.";
  }
  if (currentTopicInsight) {
    currentTopicInsight.textContent = `${subjectLabel(subject.title)}: ${subject.topics[0]}`;
  }

  try {
    const cloud = await apiFetch("/api/cloud/status", {}, false);
    cloudStatusPill.textContent = cloud.mode || cloud.provider || "local";
    cloudBackendText.textContent = cloud.message || "Локальный режим активен.";
    if (authStatusText) {
      authStatusText.textContent = cloud.authReady
        ? `Supabase Auth готов: ${authProviderSelect?.value || "email"}.`
        : `Подготовлено под Supabase Auth. Сейчас вход: ${authProviderSelect?.value || "email"}, локальный режим.`;
    }
  } catch {
    cloudStatusPill.textContent = "local";
    cloudBackendText.textContent = "Публичный/локальный режим. Для общей базы нужен облачный backend.";
    if (authStatusText) authStatusText.textContent = "Локальный режим авторизации.";
  }

  try {
    const summary = await apiFetch("/api/parent/summary", {}, false);
    renderParentSummary(summary);
    renderWeeklyPlan(summary.plan);
  } catch {
    renderParentSummary(makeLocalParentSummary());
    renderWeeklyPlan(makeLocalPlan());
  }
}

function makeLocalParentSummary() {
  const subject = currentSubject();
  return {
    currentTopic: subject.topics[0],
    weakTopics: [{ topic: subjectLabel(subject.title), wrong: 1, total: 3 }],
    recommendations: [
      "Составить короткий план на неделю",
      "Повторять тему по 15-25 минут",
      "После ошибки просить ребёнка объяснить ход решения"
    ],
    plan: makeLocalPlan()
  };
}

function makeLocalAdminStudents() {
  const city = studentCity?.value.trim() || "Алматы";
  return {
    ownerOnly: roleSelect.value === "admin",
    adminEmail: "gulmirau1979@gmail.com",
    students: [
      {
        id: "public-demo-student",
        name: studentName.value.trim() || "Ученик",
        grade: currentGrade,
        city,
        email: userEmail?.value.trim() || "",
        role: roleSelect.value,
        status: "active",
        lastSeenAt: new Date().toISOString(),
        daysInactive: 0,
        points
      }
    ],
    inactiveStudents: []
  };
}

function renderParentSummary(summary) {
  if (currentTopicInsight) currentTopicInsight.textContent = summary.currentTopic || currentSubject().topics[0];
  if (weakTopicsList) {
    const weak = summary.weakTopics?.length ? summary.weakTopics : [{ topic: "Пока нет данных об ошибках", wrong: 0, total: 0 }];
    weakTopicsList.innerHTML = weak.map((item) => `<li>${item.topic}${item.total ? `: ошибок ${item.wrong}/${item.total}` : ""}</li>`).join("");
  }
  if (recommendationList) {
    const recs = summary.recommendations?.length ? summary.recommendations : ["Продолжать мягкую ежедневную практику"];
    recommendationList.innerHTML = recs.map((item) => `<li>${item}</li>`).join("");
  }
}

function makeLocalPlan() {
  const subject = currentSubject();
  const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];
  return {
    focusTopic: subject.topics[0],
    tasks: days.map((day, index) => ({
      day,
      title: index === 0 ? `Диагностика: ${subject.topics[0]}` : index === 4 ? "Мини-проверка и похвала" : `${subjectLabel(subject.title)}: практика`,
      minutes: index === 4 ? 15 : 25,
      status: "planned"
    }))
  };
}

function renderWeeklyPlan(plan = null) {
  if (!weeklyPlanList) return;
  const activePlan = plan || makeLocalPlan();
  weeklyPlanList.innerHTML = activePlan.tasks.map((task) => {
    return `<li><input type="checkbox" /> <span><strong>${task.day}:</strong> ${task.title} · ${task.minutes} мин</span></li>`;
  }).join("");
}

async function generateSmartPlan() {
  const subject = currentSubject();
  weeklyPlanList.innerHTML = "<li>Составляю план...</li>";
  try {
    const response = await apiFetch("/api/learning-plan/generate", {
      method: "POST",
      body: {
        studentName: studentName.value.trim() || "Ученик",
        grade: currentGrade,
        subject: subject.key,
        subjectTitle: subject.title,
        topic: subject.topics[0],
        language: currentLang
      }
    });
    renderWeeklyPlan(response.plan);
    renderParentSummary(response.parentSummary);
    addMessage("bot success", `План готов: фокус на теме "${response.plan.focusTopic}".`);
  } catch {
    const plan = makeLocalPlan();
    renderWeeklyPlan(plan);
    addMessage("bot success", `План готов локально: фокус на теме "${plan.focusTopic}".`);
  }
}

function renderTrainerQuestion() {
  if (!trainerQuestion || !trainerAnswers) return;
  const mode = trainerModeSelect.value;
  const pool = trainerBank.filter((item) => item.mode === mode || mode === "weak");
  currentTrainerQuestion = pool[(Date.now() + points + currentGrade) % pool.length] || trainerBank[0];
  trainerQuestion.textContent = `${currentTrainerQuestion.question} (демо, не официальный банк заданий)`;
  trainerResult.textContent = "";
  trainerAnswers.innerHTML = currentTrainerQuestion.answers.map(([text, correct]) => `<button data-correct="${correct}">${text}</button>`).join("");
}

async function checkTrainerAnswer(button) {
  const correct = button.dataset.correct === "true";
  const selected = button.textContent;
  Array.from(trainerAnswers.querySelectorAll("button")).forEach((item) => {
    item.disabled = true;
    item.classList.toggle("correct", item.dataset.correct === "true");
    if (item === button && !correct) item.classList.add("wrong");
  });
  trainerResult.textContent = correct
    ? "Верно. Отлично: ты не просто ответил(а), а тренируешь стратегию."
    : "Пока нет. Ничего страшного: ошибка показывает, какую тему повторить.";
  awardPoints(correct ? 8 : 2, correct ? "тренажёр" : "попытку");

  try {
    const subject = currentSubject();
    const response = await apiFetch("/api/trainer/attempt", {
      method: "POST",
      body: {
        studentName: studentName.value.trim() || "Ученик",
        grade: currentGrade,
        mode: trainerModeSelect.value,
        subject: subject.key,
        subjectTitle: subject.title,
        topic: currentTrainerQuestion.topic,
        question: currentTrainerQuestion.question,
        selected,
        correct,
        sourceStatus: "demo_not_official"
      }
    });
    if (response.student) serverStudent = response.student;
    renderParentSummary(response.parentSummary);
  } catch {
    renderParentSummary(makeLocalParentSummary());
  }
  renderScore();
  renderAnalytics();
}

function renderQuiz() {
  const bank = modeSelect.value === "unt" ? quizBank.unt : (quizBank[currentSubjectKey] || quizBank.default);
  document.getElementById("quizTitle").textContent = modeSelect.value === "unt" ? "Подготовка к ЕНТ" : "Проверь понимание";
  quizQuestion.textContent = bank.question;
  quizResult.textContent = "";
  answerGrid.innerHTML = bank.answers.map(([text, correct]) => `<button data-correct="${correct}">${text}</button>`).join("");
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";
  analytics.questions += 1;
  awardPoints(2, "попытку");
  recordEvent("Вопрос", `${currentGrade} класс, ${currentSubject().title}: ${text.slice(0, 50)}`);

  addTypingMessage("Думаю как репетитор");

  try {
    const subject = currentSubject();
    const response = await apiFetch("/api/ask", {
      method: "POST",
      body: {
        studentName: studentName.value.trim() || "Аружан",
        grade: currentGrade,
        subjectKey: subject.key,
        subjectTitle: subject.title,
        topic: detectTopic(subject, text.toLowerCase()),
        difficulty: detectDifficulty(text.toLowerCase()),
        mode: modeSelect.value,
        language: currentLang,
        question: text
      }
    });
    if (response.student) {
      serverStudent = response.student;
      points = Number(response.student.points || points);
    }
    replaceLastBotMessage(response.answer);
    serverOnline = true;
    updateProfileNote();
    renderScore();
    syncServerState();
  } catch {
    serverOnline = false;
    replaceLastBotMessage(makeAnswer(text));
    updateProfileNote();
  }
}

function makeAnswer(text) {
  const subject = currentSubject();
  const lower = text.toLowerCase();
  const topic = detectTopic(subject, lower);
  const difficulty = detectDifficulty(lower);
  const ageTone = getAgeTone();

  if (currentLang === "kk") {
    return makeTutorResponse({
      subject,
      topic,
      difficulty,
      originalQuestion: text,
      ageTone,
      language: "kk",
      mode: "school"
    });
  }
  if (currentLang === "en") {
    return makeTutorResponse({
      subject,
      topic,
      difficulty,
      originalQuestion: text,
      ageTone,
      language: "en",
      mode: "school"
    });
  }
  if (lower.includes("ент") || modeSelect.value === "unt") {
    return makeTutorResponse({
      subject,
      topic: "подготовка к ЕНТ",
      difficulty,
      originalQuestion: text,
      ageTone,
      mode: "unt"
    });
  }
  if (lower.includes("сор") || lower.includes("соч")) {
    return makeTutorResponse({
      subject,
      topic: lower.includes("соч") ? "подготовка к СОЧ" : "подготовка к СОР",
      difficulty,
      originalQuestion: text,
      ageTone,
      mode: lower.includes("соч") ? "soch" : "sor"
    });
  }

  return makeTutorResponse({
    subject,
    topic,
    difficulty,
    originalQuestion: text,
    ageTone,
    mode: modeSelect.value
  });
}

async function handlePhotoUpload(file) {
  addMessage("bot", "Фото принято. Сейчас попробую отправить его на сервер для AI-разбора.");
  try {
    const imageData = await fileToDataUrl(file);
    const subject = currentSubject();
    const response = await apiFetch("/api/photo", {
      method: "POST",
      body: {
        studentName: studentName.value.trim() || "Аружан",
        grade: currentGrade,
        subjectKey: subject.key,
        subjectTitle: subject.title,
        topic: subject.topics[0],
        difficulty: "средний",
        mode: modeSelect.value,
        language: currentLang,
        fileName: file.name,
        imageData
      }
    });
    const importResult = await apiFetch("/api/kb/photo-import", {
      method: "POST",
      body: {
        grade: currentGrade,
        subjectKey: subject.key,
        subjectTitle: subject.title,
        topic: subject.topics[0],
        language: currentLang,
        fileName: file.name,
        imageData
      }
    }, false);
    replaceLastBotMessage(response.answer);
    document.getElementById("photoStatus").textContent = makePhotoImportStatus(importResult);
    renderKnowledgeBaseStatus();
    serverOnline = true;
    updateProfileNote();
    syncServerState();
  } catch {
    serverOnline = false;
    replaceLastBotMessage("Разбор фото: читаем условие, определяем предмет, выписываем данные, решаем по шагам и проверяем ответ. Для настоящего распознавания запустите сервер и добавьте OPENAI_API_KEY.");
    updateProfileNote();
  }
}

function makePhotoImportStatus(result) {
  if (!result?.ok) return "Фото принято для разбора, но не добавлено в базу знаний.";
  if (result.status === "imported_needs_review") {
    return "Фото распознано и добавлено в базу знаний со статусом: ожидает проверки взрослым.";
  }
  if (result.status === "uploaded_awaiting_ocr") {
    return "Фото сохранено в базе знаний. OCR будет доступен после подключения OPENAI_API_KEY; материал ожидает проверки.";
  }
  if (result.status === "ocr_failed") {
    return "Фото сохранено, но OCR не смог распознать текст. Материал ожидает повторной обработки или ручной проверки.";
  }
  return `Фото добавлено в базу знаний со статусом: ${result.status || "awaiting_review"}.`;
}

function makeTutorResponse({ subject, topic, difficulty, originalQuestion, ageTone, language = "ru", mode }) {
  if (language === "kk") {
    return [
      `Диагностика: ${currentGrade}-сынып, пән: ${subject.title}, тақырып: ${topic}, деңгей: ${difficulty}.`,
      "Шартты қысқаша түсіндіру: тапсырманы бірден көшірмейміз, алдымен не сұралып тұрғанын анықтаймыз.",
      "Сұрақ: сен нені түсіндің, ал қай жерде қиындық болды?",
      "Кеңес: белгілі ақпаратты және табу керек нәрсені бөлек жаз.",
      "Қадамдар: 1) негізгі сөздерді тап. Түсінікті ме? 2) ережені таңда. Қалай ойлайсың, келесі не істейміз? 3) мысалмен тексер.",
      "Жауап: соңғы жауапты тек қадамдар түсінікті болғаннан кейін жазамыз.",
      "Тексеру: жауап шартқа сәйкес келе ме?",
      "Ұқсас тапсырма: осы тақырып бойынша бір жеңіл мысал құрастыр.",
      "Жарайсың! Талпынғаның үшін +2 балл, түсіндіруге қатысқаның үшін тағы балл аласың."
    ].join("\n\n");
  }

  if (language === "en") {
    return [
      `Diagnosis: grade ${currentGrade}, subject: ${subject.title}, topic: ${topic}, level: ${difficulty}.`,
      "Short explanation: we will not jump to the final answer. First we understand what the task asks.",
      "Question: what part is already clear, and where did it become difficult?",
      "Hint: write what is known and what we need to find.",
      "Steps: 1) Find the key words. Does this make sense? 2) Choose the rule. What should we do next? 3) Check with a small example.",
      "Answer: we write the final answer only after the reasoning is clear.",
      "Check: does the answer match the question?",
      "Similar task: make one easier example on the same topic.",
      "Well done. You get points for trying, thinking, and checking your work."
    ].join("\n\n");
  }

  const modeLine = {
    school: "обычная школьная задача",
    sor: "подготовка к СОР",
    soch: "подготовка к СОЧ",
    unt: "подготовка к ЕНТ"
  }[mode] || "учебное задание";

  return [
    `Диагностика: ${currentGrade} класс, предмет: ${subject.title}, тема: ${topic}, формат: ${modeLine}, сложность: ${difficulty}.`,
    `Короткое объяснение условия: я вижу задание "${originalQuestion}". Сейчас не будем сразу писать готовый ответ. Сначала поймем, что дано, что нужно найти или объяснить, и какое правило здесь подходит. ${ageTone}`,
    "Вопрос к тебе: что в условии уже понятно? Где остановился: в словах задания, в выборе правила или в вычислениях?",
    `Подсказка: выпиши отдельно "дано" и "нужно найти". Потом найди ключевую тему: ${topic}. Если ошибешься, ничего страшного: ошибка просто показывает место, которое надо спокойно разобрать.`,
    [
      "Пошаговое решение:",
      "1. Читаем условие и подчеркиваем важные слова. Понятно, почему сначала читаем, а не считаем?",
      `2. Определяем правило по теме "${topic}". Как думаешь, какое действие или правило здесь может понадобиться?`,
      "3. Делаем первый маленький шаг: записываем известные данные или главную мысль своими словами. Понятно, почему так?",
      "4. Решаем дальше не прыжком, а по одному действию. После каждого действия проверяем: стало ли ближе к вопросу задачи?",
      "5. Если появился промежуточный результат, объясняем его словами. Как думаешь, что делаем дальше?"
    ].join("\n"),
    "Ответ: итоговый ответ нужно записать только после этих шагов. В демо-версии я показываю ход решения; когда подключим AI API, iMama сможет подставлять конкретные числа из задания и доводить решение до точного ответа.",
    "Проверка: подставь полученный результат обратно в условие или перечитай ответ как предложение. Он отвечает именно на вопрос задачи?",
    `Похожее задание: придумай или реши такой же пример по теме "${topic}", но с более простыми числами или более коротким текстом.`,
    "Похвала: молодец, что разбираешься, а не просто списываешь. За попытку начислено +2 балла; за объяснение своего шага и правильную проверку можно получить еще больше."
  ].join("\n\n");
}

function detectTopic(subject, lowerText) {
  return subject.topics.find((topic) => lowerText.includes(topic.toLowerCase())) || subject.topics[0] || "общая тема";
}

function detectDifficulty(lowerText) {
  const hardWords = ["докажи", "обоснуй", "анализ", "сложн", "ент", "соч", "олимпиад"];
  const easyWords = ["объясни", "прост", "что такое", "пример"];
  if (hardWords.some((word) => lowerText.includes(word))) return "повышенный";
  if (easyWords.some((word) => lowerText.includes(word))) return "базовый";
  return currentGrade >= 9 ? "средний ближе к повышенному" : "средний";
}

function getAgeTone() {
  if (currentGrade <= 4) return "Объясняю очень простыми словами, как на занятии с младшим школьником.";
  if (currentGrade <= 8) return "Объясняю спокойно и на понятных примерах.";
  return "Объясняю взрослее: с правилом, логикой и проверкой результата.";
}

function awardPoints(amount, reason) {
  points += amount;
  localStorage.setItem("mamaAiPoints", points);
  recordEvent("Баллы", `+${amount} за ${reason}`);
  renderScore();
}

function makeHint() {
  const subject = currentSubject();
  return `Подсказка по предмету "${subject.title}": выпишите условие, найдите тему (${subject.topics.slice(0, 3).join(", ")}), решите один простой пример и только потом переходите к сложному заданию.`;
}

function chooseLanguage(button) {
  currentLang = button.dataset.lang;
  learningLanguageSelect.value = currentLang;
  localStorage.setItem("mamaAiLearningLang", currentLang);
  document.querySelectorAll(".lang-btn").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  addMessage("bot success", getLanguageMessage());
  recordEvent("Язык", currentLang.toUpperCase());
}

function getLanguageMessage() {
  if (currentLang === "kk") return "Жауап тілі қазақша болады. Мен әдеби қазақ тілінде, мектеп терминдерін дұрыс қолданып түсіндіремін.";
  if (currentLang === "en") return "The answer language is English. I will use clear school English and adapt explanations to the student's grade.";
  return "Буду отвечать на русском языке: грамотно, простыми словами и со школьной терминологией.";
}

function checkQuizAnswer(button) {
  const isCorrect = button.dataset.correct === "true";
  awardPoints(1, "попытку в мини-тесте");
  answerGrid.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
    item.classList.toggle("correct", item.dataset.correct === "true");
  });

  if (isCorrect) {
    awardPoints(10, "правильный ответ");
    analytics.correct += 1;
    quizResult.textContent = "Верно! Ты получил баллы за попытку и правильный ответ.";
    addMessage("bot success", "Отлично. Ты не просто выбрал вариант, а сделал шаг в понимании темы. Теперь закрепи похожим заданием.");
    showPraise();
    burstStars(button);
    launchThemeReward();
    playRewardSound();
    recordEvent("Правильный ответ", currentSubject().title);
  } else {
    analytics.wrong += 1;
    button.classList.add("wrong");
    quizResult.textContent = "Почти. Правильный ответ подсвечен зеленым, а попытка все равно засчитана.";
    addMessage("bot", "Ты попробовал, и это важно. Давай спокойно разберем ошибку: сравни свой вариант с зеленым ответом и подумай, какое слово в вопросе помогло выбрать правильно. Понятно, почему этот вариант подходит лучше?");
    recordEvent("Неправильный ответ", currentSubject().title);
  }

  localStorage.setItem("mamaAiPoints", points);
  saveAnalytics();
  renderScore();
  renderAnalytics();
  apiFetch("/api/quiz", {
    method: "POST",
    body: {
      studentName: studentName.value.trim() || "Аружан",
      grade: currentGrade,
      subject: currentSubject().title,
      correct: isCorrect
    }
  }).then((response) => {
    if (response.student) {
      serverStudent = response.student;
      points = Number(response.student.points || points);
      renderScore();
    }
    if (response.analytics) applyServerAnalytics(response.analytics);
    serverOnline = true;
    updateProfileNote();
  }).catch(() => {
    serverOnline = false;
    updateProfileNote();
  });
}

function saveFeedback(isHelpful) {
  const text = document.getElementById("feedbackText").value.trim() || (isHelpful ? "Полезно" : "Нужно улучшить");
  analytics.feedback.unshift({ text, helpful: isHelpful, date: new Date().toLocaleString("ru-RU") });
  if (isHelpful) analytics.helpful += 1;
  document.getElementById("feedbackText").value = "";
  recordEvent("Отзыв", isHelpful ? "Полезно" : "Нужно улучшить");
  saveAnalytics();
  renderAnalytics();
  apiFetch("/api/feedback", {
    method: "POST",
    body: {
      studentName: studentName.value.trim() || "Аружан",
      grade: currentGrade,
      text,
      helpful: isHelpful
    }
  }).then((response) => {
    applyServerAnalytics(response.analytics, response.events);
    serverOnline = true;
    updateProfileNote();
  }).catch(() => {
    serverOnline = false;
    updateProfileNote();
  });
}

function renderScore() {
  level = Math.max(1, Math.floor(points / 50));
  document.getElementById("points").textContent = points;
  document.getElementById("streak").textContent = streak;
  document.getElementById("level").textContent = level;
}

async function importGrades(event) {
  event.preventDefault();
  const raw = document.getElementById("gradesJson").value.trim();
  if (!raw) {
    addMessage("bot", "Вставьте оценки в формате JSON. Например: [{\"subject\":\"Математика\",\"value\":5,\"type\":\"СОР\",\"date\":\"2026-07-10\"}]");
    return;
  }

  let grades;
  try {
    grades = JSON.parse(raw);
  } catch {
    addMessage("bot", "Не получилось прочитать JSON. Проверьте кавычки, запятые и квадратные скобки.");
    return;
  }

  try {
    const response = await apiFetch("/api/grades/import", {
      method: "POST",
      body: {
        studentName: studentName.value.trim() || "Аружан",
        grade: currentGrade,
        grades
      }
    });
    serverStudent = response.student;
    document.getElementById("gradesJson").value = "";
    addMessage("bot success", `Оценки загружены: ${response.student.grades.length} записей. Теперь успеваемость можно анализировать на сервере.`);
    serverOnline = true;
    updateProfileNote();
    renderProgress();
    syncServerState();
  } catch {
    addMessage("bot", "Сервер не принял оценки. Запустите backend командой npm start из папки mama_ai_app.");
    serverOnline = false;
    updateProfileNote();
  }
}

function applyServerAnalytics(serverAnalytics, events = []) {
  if (!serverAnalytics) return;
  analytics.visits = serverAnalytics.visits ?? analytics.visits;
  analytics.questions = serverAnalytics.questions ?? analytics.questions;
  analytics.correct = serverAnalytics.correct ?? analytics.correct;
  analytics.wrong = serverAnalytics.wrong ?? analytics.wrong;
  analytics.helpful = serverAnalytics.helpful ?? analytics.helpful;
  analytics.cities = serverAnalytics.cities || analytics.cities || {};
  if (serverAnalytics.users) {
    analytics.users = Array.from({ length: serverAnalytics.users }, (_, index) => `server-user-${index + 1}`);
  }
  if (events.length) {
    analytics.events = events.map((event) => ({
      type: event.type,
      detail: event.detail,
      date: new Date(event.createdAt).toLocaleString("ru-RU")
    }));
  }
  saveAnalytics();
  renderAnalytics();
}

function renderAnalytics() {
  const totalAnswers = analytics.correct + analytics.wrong;
  document.getElementById("visitsMetric").textContent = analytics.visits;
  document.getElementById("usersMetric").textContent = analytics.users.length;
  const cityEntries = Object.entries(analytics.cities || {});
  const citiesMetric = document.getElementById("citiesMetric");
  if (citiesMetric) citiesMetric.textContent = cityEntries.length;
  document.getElementById("questionsMetric").textContent = analytics.questions;
  document.getElementById("correctMetric").textContent = totalAnswers ? `${Math.round((analytics.correct / totalAnswers) * 100)}%` : "0%";
  document.getElementById("helpfulMetric").textContent = analytics.helpful;
  document.getElementById("wrongMetric").textContent = analytics.wrong;
  document.getElementById("eventList").innerHTML = analytics.events.slice(0, 8).map((event) => `<li><strong>${event.type}</strong><span>${event.detail}</span><small>${event.date}</small></li>`).join("");
  const cityAnalyticsList = document.getElementById("cityAnalyticsList");
  if (cityAnalyticsList) {
    cityAnalyticsList.innerHTML = cityEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => `<li><strong>${city}</strong><span>${count} ученик(ов)</span><small>город</small></li>`)
      .join("") || "<li><strong>Нет данных</strong><span>Город появится после авторизации</span></li>";
  }
  renderAccountLifecycleStatus();
  renderAdminStudents();
}

async function renderAdminStudents() {
  if (!adminStudentRows || !inactiveStudentList) return;
  try {
    const report = await apiFetch("/api/admin/students", {}, false);
    const ownerOnly = Boolean(report.ownerOnly);
    const currentEmail = userEmail?.value.trim().toLowerCase() || "";
    const isOwner = ownerOnly || currentEmail === String(report.adminEmail || "").toLowerCase();
    if (adminAccessText) {
      adminAccessText.textContent = isOwner
        ? "Админ-доступ активен. Видна сводка учеников, городов и активности."
        : `Полный доступ только для ${report.adminEmail || "владельца"}. Сейчас показан безопасный демо-режим.`;
    }

    const rows = (report.students || []).slice(0, 20);
    adminStudentRows.innerHTML = rows.map((student) => `
      <tr>
        <td>${student.name || "Ученик"}</td>
        <td>${student.grade || "-"}</td>
        <td>${student.city || "Не указан"}</td>
        <td>${student.daysInactive || 0} дн.</td>
        <td>${student.status || "active"}</td>
      </tr>
    `).join("") || "<tr><td colspan=\"5\">Пока нет учеников</td></tr>";

    const inactive = report.inactiveStudents?.length ? report.inactiveStudents : [];
    inactiveStudentList.innerHTML = inactive.slice(0, 8).map((student) => (
      `<li><strong>${student.name}</strong><span>${student.city || "Не указан"} · ${student.grade || "-"} класс · ${student.daysInactive || 0} дн. без входа</span><small>${student.status || "active"}</small></li>`
    )).join("") || "<li><strong>Все хорошо</strong><span>Нет учеников с долгой неактивностью</span></li>";
  } catch {
    adminStudentRows.innerHTML = "<tr><td colspan=\"5\">Админ-таблица доступна после запуска сервера</td></tr>";
    inactiveStudentList.innerHTML = "<li><strong>Локальный режим</strong><span>Запустите сервер для проверки активности</span></li>";
  }
}

async function renderAccountLifecycleStatus() {
  if (!lifecycleList) return;
  try {
    const report = await apiFetch("/api/account/lifecycle", {}, false);
    const policy = report.policy || {};
    lifecyclePolicy.textContent = `Проверка: ${policy.inactivityWarningDays || 30} дней без входа, предупреждение, затем ${policy.inactivityGraceDays || 3} дня ожидания перед удалением.`;
    lifecycleEmailStatus.textContent = policy.emailReady
      ? `Email включен: ${policy.emailProvider}.`
      : "Email пока не подключен: предупреждения сохраняются в очередь уведомлений.";
    const students = report.students || [];
    lifecycleList.innerHTML = students.slice(0, 8).map((student) => {
      const deletion = student.scheduledDeletionAt ? `Удаление: ${formatShortDate(student.scheduledDeletionAt)}` : "Удаление не запланировано";
      return `<li><strong>${student.name}</strong><span>${student.status || "active"} · неактивен ${student.daysInactive || 0} дн. · ${deletion}</span><small>${student.lastSeenAt ? formatShortDate(student.lastSeenAt) : ""}</small></li>`;
    }).join("") || "<li><strong>Нет учеников</strong><span>Пока нет аккаунтов для проверки</span></li>";
  } catch {
    lifecycleList.innerHTML = "<li><strong>Локальный режим</strong><span>Статус удаления доступен после запуска сервера.</span></li>";
  }
}

async function runAccountLifecycleCheck() {
  if (!runLifecycleBtn) return;
  runLifecycleBtn.disabled = true;
  runLifecycleBtn.textContent = "Проверяю...";
  try {
    const report = await apiFetch("/api/account/lifecycle/run", { method: "POST", body: {} }, false);
    const result = report.result || {};
    addMessage("bot success", `Проверка аккаунтов завершена. Предупреждений: ${(result.warned || []).length}, удалено: ${(result.deleted || []).length}.`);
    renderAccountLifecycleStatus();
  } catch {
    addMessage("bot", "Не удалось запустить проверку аккаунтов. Проверь, запущен ли сервер.");
  } finally {
    runLifecycleBtn.disabled = false;
    runLifecycleBtn.textContent = "Проверить сейчас";
  }
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function recordEvent(type, detail) {
  analytics.events.unshift({ type, detail, date: new Date().toLocaleString("ru-RU") });
  analytics.events = analytics.events.slice(0, 50);
  saveAnalytics();
}

function trackLocalCity() {
  const city = studentCity?.value.trim() || "Алматы";
  analytics.cities = analytics.cities || {};
  if (!analytics.cities[city]) analytics.cities[city] = 0;
  analytics.cities[city] = Math.max(analytics.cities[city], 1);
  saveAnalytics();
}

function saveAnalytics() {
  localStorage.setItem("mamaAiAnalytics", JSON.stringify(analytics));
}

function applyExperienceSettings() {
  animationToggle.checked = animationsEnabled;
  soundToggle.checked = soundEnabled;
  reducedMotionToggle.checked = reducedMotionEnabled;
  dailyThemeToggle.checked = dailyThemeEnabled;
  document.body.classList.toggle("no-animations", !animationsEnabled);
  document.body.classList.toggle("reduced-motion", reducedMotionEnabled);
  document.body.classList.toggle("theme-disabled", !dailyThemeEnabled);
  natureSoundBtn.disabled = !soundEnabled || !dailyThemeEnabled || getDailyTheme().sound !== "birds";
  natureSoundBtn.textContent = birdAudio ? t("natureSoundOn") : t("natureSound");
}

function getAlmatyDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const data = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${data.year}-${data.month}-${data.day}T00:00:00Z`);
}

function getDailyTheme() {
  const almatyDate = getAlmatyDate();
  const dayOfMonth = almatyDate.getUTCDate();
  return dailyThemes[dayOfMonth % dailyThemes.length];
}

function startKazakhstanClock() {
  updateKazakhstanClock();
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(updateKazakhstanClock, 1000);
}

function updateKazakhstanClock() {
  const now = new Date();
  const locale = uiLang === "kk" ? "kk-KZ" : uiLang === "en" ? "en-US" : "ru-RU";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Almaty",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Almaty",
    hour: "2-digit",
    minute: "2-digit",
    hour12: uiLang === "en"
  });

  let dateText = dateFormatter.format(now);
  if (uiLang === "ru") dateText = dateText.charAt(0).toUpperCase() + dateText.slice(1);
  if (uiLang === "kk" && !dateText.includes("жыл")) dateText = `${dateText} жыл`;
  if (uiLang === "en") dateText = dateText.replace(",", ",");

  currentDateText.textContent = dateText;
  currentTimeText.textContent = `${timeFormatter.format(now)}, ${uiLang === "en" ? "Almaty" : "Алматы"}`;
}

function renderDailyTheme() {
  dailyThemeLayer.innerHTML = "";
  if (!dailyThemeEnabled) return;

  const theme = getDailyTheme();
  dailyThemeLayer.dataset.theme = theme.name;
  const count = reducedMotionEnabled ? 6 : 12;

  for (let index = 0; index < count; index += 1) {
    const item = document.createElement("span");
    item.className = `theme-particle theme-${theme.particles}`;
    item.style.left = index % 2 === 0 ? `${2 + Math.random() * 14}%` : `${84 + Math.random() * 12}%`;
    item.style.top = `${8 + Math.random() * 82}%`;
    item.style.animationDelay = `${Math.random() * 4}s`;
    item.style.setProperty("--theme-color-a", theme.colors[0]);
    item.style.setProperty("--theme-color-b", theme.colors[1]);
    item.innerHTML = makeThemeSvg(theme.particles);
    dailyThemeLayer.appendChild(item);
  }
}

function makeThemeSvg(type) {
  const svg = {
    birds: '<svg viewBox="0 0 42 24"><path d="M5 14c7-10 12-10 18 0M19 14c7-10 12-10 18 0" fill="none" stroke="var(--theme-color-a)" stroke-width="4" stroke-linecap="round"/></svg>',
    flowers: '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="5" fill="#ffd166"/><circle cx="18" cy="7" r="7" fill="var(--theme-color-a)"/><circle cx="18" cy="29" r="7" fill="var(--theme-color-a)"/><circle cx="7" cy="18" r="7" fill="var(--theme-color-b)"/><circle cx="29" cy="18" r="7" fill="var(--theme-color-b)"/></svg>',
    clouds: '<svg viewBox="0 0 54 30"><path d="M16 25h25a9 9 0 0 0 0-18 13 13 0 0 0-24-2A10 10 0 0 0 16 25Z" fill="var(--theme-color-a)" stroke="#b8d8ee" stroke-width="2"/></svg>',
    stars: '<svg viewBox="0 0 34 34"><path d="m17 2 4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1Z" fill="var(--theme-color-a)" stroke="var(--theme-color-b)" stroke-width="2"/></svg>',
    books: '<svg viewBox="0 0 42 34"><rect x="5" y="7" width="10" height="22" rx="2" fill="var(--theme-color-a)"/><rect x="16" y="4" width="10" height="25" rx="2" fill="var(--theme-color-b)"/><rect x="27" y="9" width="10" height="20" rx="2" fill="#ff8ab3"/></svg>',
    pencils: '<svg viewBox="0 0 44 20"><path d="M4 10h27l7-6 3 6-3 6-7-6H4Z" fill="var(--theme-color-a)" stroke="#8a6b00" stroke-width="2"/><path d="m38 4 3 6-3 6" fill="#2f3148"/></svg>',
    balloons: '<svg viewBox="0 0 30 44"><ellipse cx="15" cy="14" rx="11" ry="13" fill="var(--theme-color-a)"/><path d="M15 27c-2 6-6 7-2 14" fill="none" stroke="var(--theme-color-b)" stroke-width="2"/></svg>',
    leaves: '<svg viewBox="0 0 34 34"><path d="M29 5C13 5 5 13 6 29c16 1 24-7 23-24Z" fill="var(--theme-color-a)"/><path d="M8 27 27 8" stroke="#5b8d46" stroke-width="2"/></svg>',
    butterflies: '<svg viewBox="0 0 42 30"><ellipse cx="13" cy="14" rx="10" ry="7" fill="var(--theme-color-a)"/><ellipse cx="29" cy="14" rx="10" ry="7" fill="var(--theme-color-b)"/><rect x="19" y="7" width="4" height="16" rx="2" fill="#5b4b7a"/></svg>',
    planets: '<svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="11" fill="var(--theme-color-a)"/><ellipse cx="21" cy="21" rx="18" ry="6" fill="none" stroke="var(--theme-color-b)" stroke-width="3"/></svg>',
    snowflakes: '<svg viewBox="0 0 36 36"><path d="M18 3v30M5 10l26 16M31 10 5 26" stroke="var(--theme-color-a)" stroke-width="3" stroke-linecap="round"/></svg>',
    iceCream: '<svg viewBox="0 0 34 44"><circle cx="17" cy="13" r="11" fill="var(--theme-color-a)"/><path d="m8 22 9 18 9-18Z" fill="#d79a55" stroke="#9d6a36" stroke-width="2"/></svg>'
  };
  return svg[type] || svg.stars;
}

function addMessage(type, text) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  chat.appendChild(div);
  if (type.includes("bot")) lastAnswerText = text;
  chat.scrollTop = chat.scrollHeight;
}

function addTypingMessage(text) {
  const div = document.createElement("div");
  div.className = "message bot typing";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function replaceLastBotMessage(text) {
  const messages = Array.from(chat.querySelectorAll(".message.bot"));
  const last = messages[messages.length - 1];
  if (last) {
    last.classList.remove("typing");
    last.textContent = text;
  } else {
    addMessage("bot", text);
  }
  lastAnswerText = text;
  chat.scrollTop = chat.scrollHeight;
}

function speakLastAnswer() {
  if (!soundEnabled) {
    voiceStatus.textContent = t("soundOff");
    return;
  }
  if (!("speechSynthesis" in window)) {
    voiceStatus.textContent = uiLang === "en" ? "Text-to-speech is not available in this browser yet" : uiLang === "kk" ? "Бұл браузерде мәтінді дыбыстау әзірге қолжетімсіз" : "Озвучивание пока недоступно в этом браузере";
    return;
  }
  const text = (lastAnswerText || "Пока нет ответа для озвучивания").replace(/\s+/g, " ").slice(0, 1200);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = currentLang === "kk" ? "kk-KZ" : currentLang === "en" ? "en-US" : "ru-RU";
  utterance.rate = 0.92;
  utterance.pitch = 1.08;
  utterance.volume = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith(currentLang === "kk" ? "kk" : currentLang === "en" ? "en" : "ru"));
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.onstart = () => {
    voiceStatus.textContent = t("speaking");
  };
  utterance.onend = () => {
    voiceStatus.textContent = "";
  };
  window.speechSynthesis.speak(utterance);
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceStatus.textContent = t("voiceUnavailable");
    return;
  }

  if (recognition) recognition.stop();
  recognition = new SpeechRecognition();
  recognition.lang = currentLang === "kk" ? "kk-KZ" : currentLang === "en" ? "en-US" : "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    voiceStatus.textContent = uiLang === "en" ? "Listening... say your question" : uiLang === "kk" ? "Тыңдап тұрмын... сұрағыңды айт" : "Слушаю... скажи вопрос голосом";
  };
  recognition.onresult = (event) => {
    userInput.value = event.results[0][0].transcript;
    voiceStatus.textContent = uiLang === "en" ? "Done, I wrote down the question" : uiLang === "kk" ? "Дайын, сұрақ жазылды" : "Готово, я записала вопрос";
  };
  recognition.onerror = () => {
    voiceStatus.textContent = uiLang === "en" ? "I could not recognize speech. Try again" : uiLang === "kk" ? "Дауысты тану мүмкін болмады. Қайталап көр" : "Не получилось распознать речь. Попробуй еще раз";
  };
  recognition.onend = () => {
    if (voiceStatus.textContent.includes("Слушаю") || voiceStatus.textContent.includes("Listening") || voiceStatus.textContent.includes("Тыңдап")) {
      voiceStatus.textContent = "";
    }
  };
  recognition.start();
}

function showPraise() {
  praisePop.innerHTML = `<strong>${t("rewardCorrect")}</strong><span>${t("rewardPoints")}</span><small>${t("rewardContinue")}</small>`;
  praisePop.classList.remove("show");
  void praisePop.offsetWidth;
  praisePop.classList.add("show");
}

function burstStars(target) {
  if (!animationsEnabled) return;
  const rect = target.getBoundingClientRect();
  for (let index = 0; index < 10; index += 1) {
    const star = document.createElement("span");
    star.className = "star-burst";
    star.textContent = "⭐";
    star.style.left = `${rect.left + rect.width / 2}px`;
    star.style.top = `${rect.top + rect.height / 2}px`;
    star.style.setProperty("--x", `${(Math.random() - 0.5) * 180}px`);
    star.style.setProperty("--y", `${-40 - Math.random() * 90}px`);
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 950);
  }
}

function launchThemeReward() {
  if (!animationsEnabled || reducedMotionEnabled) return;
  const theme = getDailyTheme();
  const colors = theme.colors;
  for (let index = 0; index < 26; index += 1) {
    const piece = document.createElement("span");
    piece.className = `confetti-piece reward-${theme.particles}`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--theme-color-a", colors[0]);
    piece.style.setProperty("--theme-color-b", colors[1]);
    piece.innerHTML = makeThemeSvg(theme.particles);
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!window.mamaAudioContext) window.mamaAudioContext = new AudioContext();
  return window.mamaAudioContext;
}

function playTone(frequency, start, duration, gainValue = 0.025) {
  const context = getAudioContext();
  if (!context || !soundEnabled) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
  gain.gain.setValueAtTime(0.0001, context.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(context.currentTime + start);
  oscillator.stop(context.currentTime + start + duration + 0.03);
}

function playRewardSound() {
  if (!soundEnabled) return;
  playTone(659, 0, 0.16, 0.02);
  playTone(784, 0.12, 0.18, 0.018);
  playTone(988, 0.26, 0.22, 0.016);
}

function toggleNatureSound() {
  if (!soundEnabled || getDailyTheme().sound !== "birds") return;
  if (birdAudio) {
    stopBirdSound();
    return;
  }
  startBirdSound();
}

function startBirdSound() {
  const context = getAudioContext();
  if (!context) return;
  birdAudio = setInterval(() => {
    playTone(1200 + Math.random() * 800, 0, 0.08, 0.008);
    playTone(1500 + Math.random() * 900, 0.1, 0.06, 0.006);
  }, 1800);
  natureSoundBtn.textContent = t("natureSoundOn");
}

function stopBirdSound() {
  if (birdAudio) clearInterval(birdAudio);
  birdAudio = null;
  if (natureSoundBtn) natureSoundBtn.textContent = t("natureSound");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportAnalytics() {
  const rows = [
    ["metric", "value"],
    ["visits", analytics.visits],
    ["users", analytics.users.length],
    ["questions", analytics.questions],
    ["correct_answers", analytics.correct],
    ["wrong_answers", analytics.wrong],
    ["helpful_feedback", analytics.helpful]
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mama-ai-analytics.csv";
  link.click();
  URL.revokeObjectURL(url);
  recordEvent("Экспорт", "CSV аналитики");
}
