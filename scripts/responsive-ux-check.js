const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const pageUrl = process.argv[2] || `file:///${path.join(root, "index.html").replace(/\\/g, "/")}`;
const viewports = [
  { width: 320, height: 720 },
  { width: 360, height: 760 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const maxRight = Math.max(...Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .map((element) => Math.ceil(element.getBoundingClientRect().right)), 0);
    return {
      overflow: doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > window.innerWidth + 1 || maxRight > window.innerWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      maxRight
    };
  });
}

async function inspectMobileControls(page, viewport) {
  return page.evaluate(({ width }) => {
    const selectors = [
      "input:not([type='hidden'])",
      "select",
      "textarea",
      "button"
    ];
    const visibleControls = Array.from(document.querySelectorAll(selectors.join(",")))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
    const undersized = visibleControls
      .filter((element) => element.getBoundingClientRect().height < 44)
      .map((element) => `${element.tagName.toLowerCase()}#${element.id || "(no-id)"}.${element.className || "(no-class)"}[${element.textContent.trim().slice(0, 24)}]:${Math.round(element.getBoundingClientRect().height)}`);
    const formFontSizes = visibleControls
      .filter((element) => ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName))
      .map((element) => Number.parseFloat(window.getComputedStyle(element).fontSize));
    const columnCount = (selector) => {
      const element = document.querySelector(selector);
      if (!element || window.getComputedStyle(element).display === "none") return null;
      return window.getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length;
    };
    return {
      width,
      undersized,
      hasSmallFormFont: formFontSizes.some((size) => size < 16),
      inputColumns: columnCount(".input-row"),
      actionColumns: columnCount(".subject-action-panel")
    };
  }, viewport);
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    browser = await chromium.launch({ channel: "msedge" });
  }
  const failures = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(pageUrl);
    await page.waitForSelector("#guestStartBtn");

    if (viewport.width === viewports[0].width) {
      const catalogState = await page.evaluate(() => ({
        count: Array.isArray(window.OFFICIAL_TEXTBOOK_CATALOG) ? window.OFFICIAL_TEXTBOOK_CATALOG.length : 0,
        hasKazakh: window.OFFICIAL_TEXTBOOK_CATALOG?.some((record) => record.instructionLanguage === "kk") || false,
        hasModule: Boolean(document.querySelector("#textbookCatalog"))
      }));
      if (catalogState.count < 500 || !catalogState.hasKazakh || !catalogState.hasModule) {
        failures.push(`${viewport.width}: textbook catalog failed ${JSON.stringify(catalogState)}`);
      }
    }

    let result = await hasHorizontalOverflow(page);
    if (result.overflow) failures.push(`${viewport.width}: landing overflow ${JSON.stringify(result)}`);

    await page.click("#guestStartBtn");
    await page.waitForSelector("#guestGradeChoices button[data-grade='6']");
    result = await hasHorizontalOverflow(page);
    if (result.overflow) failures.push(`${viewport.width}: grade step overflow ${JSON.stringify(result)}`);

    await page.click("#guestGradeChoices button[data-grade='6']");
    await page.waitForSelector("#guestSubjectChoices button");
    result = await hasHorizontalOverflow(page);
    if (result.overflow) failures.push(`${viewport.width}: subject step overflow ${JSON.stringify(result)}`);

    await page.click("#guestSubjectChoices button");
    await page.waitForSelector("#actionQuestionBtn");
    result = await hasHorizontalOverflow(page);
    if (result.overflow) failures.push(`${viewport.width}: action step overflow ${JSON.stringify(result)}`);

    await page.click("#actionQuestionBtn");
    await page.waitForSelector("#assistant");
    result = await hasHorizontalOverflow(page);
    if (result.overflow) failures.push(`${viewport.width}: workspace overflow ${JSON.stringify(result)}`);

    if (viewport.width <= 480) {
      const mobileControls = await inspectMobileControls(page, viewport);
      if (mobileControls.undersized.length) {
        failures.push(`${viewport.width}: controls below 44px ${JSON.stringify(mobileControls.undersized)}`);
      }
      if (mobileControls.hasSmallFormFont) {
        failures.push(`${viewport.width}: form text below 16px`);
      }
      if (mobileControls.inputColumns !== 1) {
        failures.push(`${viewport.width}: chat form is not single-column ${JSON.stringify(mobileControls)}`);
      }
    }

    await page.close();
  }

  await browser.close();

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }

  console.log(`Responsive UX check passed for ${viewports.map((item) => item.width).join(", ")} px.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
