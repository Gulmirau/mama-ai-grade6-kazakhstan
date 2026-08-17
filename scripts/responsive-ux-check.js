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
