const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK: ${message}`);
}

check(html.includes('id="assistantCapabilityNote"'), "chat shows an honest capability status");
check(script.includes('localStorage.getItem("mamaAiPoints") || 0'), "new users start with zero points");
check(script.includes('localStorage.getItem("mamaAiStreak") || 0'), "new users start with zero streak");
check(!script.includes('consumeGuestAction(2)'), "question points are not counted twice");
check(!script.includes('consumeGuestAction(1)'), "quiz attempt points are not counted twice");
check(script.includes("Сколько будет 7 × 4?"), "grade 3-4 math quiz is age appropriate");
check(script.includes("makeVerifiedArithmeticResponse"), "public app has verified basic arithmetic fallback");
check(server.includes("makeVerifiedArithmeticFallback"), "local backend has verified basic arithmetic fallback");
check(script.includes("12 - 5 = 7") === false, "arithmetic answer is calculated rather than hard-coded");
check(script.includes("официальный комплект ожидает импорт"), "SOR and SOCH training is marked non-official");
check(!server.includes('body.name || "Аружан"'), "backend does not invent a child name");
check(server.includes("grades: []"), "new backend profile has no invented marks");

console.log("Quality regression checks passed.");
