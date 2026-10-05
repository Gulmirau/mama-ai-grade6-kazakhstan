const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const pageUrl = process.argv[2] || `file:///${path.join(root, "index.html").replace(/\\/g, "/")}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK: ${message}`);
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(pageUrl);
  await page.waitForSelector("#guestStartBtn");
  await page.click("#guestStartBtn");
  await page.click("#guestGradeChoices button[data-grade='6']");
  await page.click("#guestSubjectChoices button[data-subject='math']");
  await page.click("#actionQuestionBtn");
  await page.waitForSelector("#assistant");

  const context = await page.evaluate(() => ({
    learningGrade: document.querySelector("#gradeSelect")?.value,
    catalogGrade: document.querySelector("#catalogGrade")?.value,
    catalogSubject: document.querySelector("#catalogSubject")?.value
  }));
  assert(context.learningGrade === "6", "learning flow keeps the selected grade");
  assert(context.catalogGrade === "6", "textbook catalog follows the selected grade");
  assert(context.catalogSubject === "math", "textbook catalog follows the selected subject");

  const answers = await page.evaluate(() => ({
    fraction: makeAnswer("3/4 - 1/4"),
    percent: makeAnswer("20% от 150"),
    equation: makeAnswer("2x + 3 = 11"),
    unsafeChain: makeAnswer("2 + 3 * 4")
  }));
  assert(answers.fraction.includes("Ответ: 1/2"), "fraction answer is exact and reduced");
  assert(answers.fraction.includes("Проверка:"), "fraction answer includes a check");
  assert(answers.percent.includes("Ответ: 30"), "percentage answer is exact");
  assert(answers.equation.includes("Ответ: x = 4"), "linear equation answer is exact");
  assert(!answers.unsafeChain.includes("Ответ: 5."), "multi-operation expression is not answered with a partial calculation");

  await page.click("#reportAnswerBtn");
  assert(await page.locator("#answerReportForm").isVisible(), "a child can report an incorrect answer");

  await page.evaluate(async () => {
    await handlePhotoUpload(new File(["not-an-image"], "task.png", { type: "image/png" }));
  });
  const photoStatus = await page.locator("#photoStatus").innerText();
  assert(photoStatus.includes("распознавание текста пока не подключено"), "photo tool clearly says when OCR is unavailable");
  assert(consoleErrors.length === 0, `page has no runtime errors${consoleErrors.length ? `: ${consoleErrors.join(" | ")}` : ""}`);

  await browser.close();
  console.log("Child readiness check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
