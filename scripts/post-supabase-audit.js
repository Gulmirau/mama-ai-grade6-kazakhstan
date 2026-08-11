const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const publicUrl = "https://gulmirau.github.io/mama-ai-grade6-kazakhstan/";

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function loadConfig() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("config.js"), context);
  return context.window.MAMA_AI_CONFIG || {};
}

function hasForbiddenSecret(text) {
  return /service_role|sb_secret|database password|sk-proj-|sk-[A-Za-z0-9_-]{20,}/i.test(text);
}

function assert(condition, message, results) {
  results.push({ status: condition ? "PASS" : "FAIL", message });
}

async function fetchText(url) {
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}audit=${Date.now()}`, { cache: "no-store" });
  return { ok: response.ok, status: response.status, text: await response.text() };
}

async function trySupabaseSignup(config) {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    return { status: "SKIP", reason: "Supabase public config is not filled" };
  }
  const email = `imama.audit.${Date.now()}@gmail.com`;
  const password = `Audit${Date.now()}!`;
  const url = `${String(config.SUPABASE_URL).replace(/\/+$/, "")}/auth/v1/signup?redirect_to=${encodeURIComponent(publicUrl)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: config.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        role: "student",
        first_name: "Audit Student",
        city: "Almaty",
        grade: 3,
        interface_language: "ru",
        learning_language: "ru"
      }
    })
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const reason = data.msg || data.message || data.error || `HTTP ${response.status}`;
    if (/rate limit|too many|email rate/i.test(reason)) {
      return { status: "BLOCKED", reason };
    }
    return { status: "FAIL", reason };
  }
  return {
    status: "PASS",
    authUserCreated: Boolean(data.user?.id),
    sessionCreated: Boolean(data.session?.access_token),
    emailConfirmationRequired: Boolean(data.user?.id && !data.session),
    emailMasked: email.replace(/(?<=.{8}).(?=.*@)/g, "*")
  };
}

async function main() {
  const results = [];
  const config = loadConfig();
  const publicFiles = ["config.js", "index.html", "script.js", "supabase-client.js"].map(read).join("\n");
  const migration = read("supabase/migrations/202608100001_mvp_auth_rls.sql");
  const trigger = read("supabase/migrations/202608100002_auth_profile_trigger.sql");
  const parentLinkRpc = read("supabase/migrations/202608110001_parent_child_link_rpc.sql");
  const { buildCoverage } = require("./content-audit");
  const coverage = buildCoverage();

  assert(config.APP_MODE === "supabase", "config.js uses APP_MODE=supabase", results);
  assert(Boolean(config.SUPABASE_URL), "config.js has Supabase URL", results);
  assert(Boolean(config.SUPABASE_ANON_KEY), "config.js has Supabase publishable/anon key", results);
  assert(!hasForbiddenSecret(publicFiles), "public frontend files do not contain server secrets", results);
  assert(migration.includes("enable row level security"), "RLS is enabled in migration", results);
  assert(trigger.includes("after insert on auth.users"), "Auth trigger exists for automatic profiles", results);
  assert(parentLinkRpc.includes("link_child_by_code"), "Parent-child link RPC exists", results);
  assert(coverage.officialCatalog.length >= 288, "official textbook catalog has expected records", results);
  assert(coverage.userTextbookCatalog.length >= 17, "user textbook catalog preserves uploaded materials", results);
  assert(coverage.rows.length === 11, "coverage report covers grades 1-11", results);

  try {
    const publicIndex = await fetchText(publicUrl);
    assert(publicIndex.ok, "public GitHub Pages opens", results);
    assert(publicIndex.text.includes("config.js"), "public page loads config.js", results);
    const publicConfig = await fetchText(`${publicUrl}config.js`);
    assert(publicConfig.ok && publicConfig.text.includes('APP_MODE: "supabase"'), "public config is deployed with Supabase mode", results);
    assert(!hasForbiddenSecret(publicConfig.text), "public config has no forbidden server secret", results);
  } catch (error) {
    results.push({ status: "FAIL", message: `public GitHub Pages check failed: ${error.message}` });
  }

  const signup = await trySupabaseSignup(config).catch((error) => ({ status: "FAIL", reason: error.message }));
  results.push({ status: signup.status, message: "Supabase Auth signup via public key", detail: signup });

  const passed = results.filter((item) => item.status === "PASS").length;
  const failed = results.filter((item) => item.status === "FAIL").length;
  const skipped = results.filter((item) => item.status === "SKIP").length;
  const blocked = results.filter((item) => item.status === "BLOCKED").length;
  const report = {
    generatedAt: new Date().toISOString(),
    publicUrl,
    passed,
    failed,
    skipped,
    blocked,
    results
  };
  const reportPath = path.join(root, "reports", "post-supabase-audit.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`post-supabase audit: passed=${passed}, failed=${failed}, skipped=${skipped}, blocked=${blocked}`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
