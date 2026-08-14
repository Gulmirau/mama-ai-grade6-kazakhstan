const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];

function check(name, ok) {
  checks.push({ name, ok: Boolean(ok) });
}

const index = read("index.html");
const script = read("script.js");
const style = read("style.css");
const supabaseClient = read("supabase-client.js");
const migration = read("supabase/migrations/202608120001_child_guest_and_invites.sql");

check("landing screen exists", index.includes('id="landing"') && index.includes("Начать заниматься") && index.includes("Войти"));
check("guest wizard exists", index.includes('id="guestWizard"') && index.includes("В каком ты классе?") && script.includes("renderGuestWizard"));
check("help drawer exists", index.includes('id="helpDrawer"') && index.includes("Показать прямо на сайте") && script.includes("openHelpDrawer"));
check("adult registration is not first screen", index.includes('class="profile-panel adult-panel"') && style.includes("body.landing-active .sidebar"));
check("guest mode limit exists", script.includes("const GUEST_ACTION_LIMIT = 3") && script.includes("consumeGuestAction"));
check("guest state uses localStorage only for guest data", script.includes("mamaAiGuestState") && script.includes("mamaAiGuestPoints"));
check("parent can create child profile", index.includes("newChildName") && script.includes("createChildProfile"));
check("child links use hashed database tokens", migration.includes("token_hash") && migration.includes("token_sha256") && !migration.includes("invite_token text not null"));
check("child session is validated through Supabase RPC", supabaseClient.includes("activateChildInvite") && supabaseClient.includes("getChildSession"));
check("child progress can be saved", migration.includes("save_child_progress") && supabaseClient.includes("saveChildProgress"));
check("child mode hides adult technical panels", style.includes("body.child-mode .adult-panel") && style.includes("body.child-mode #analytics"));
check("mobile rules included", style.includes("@media (max-width: 760px)") && style.includes("max-width: 100vw"));
check("interactive guide exists", index.includes("videoModal") && script.includes("guideSlidesData"));
check("no service role key is exposed", !index.includes("service_role") && !script.includes("service_role") && !supabaseClient.includes("service_role"));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.name}`);
}

if (failed.length) {
  console.error(`Child-first check failed: ${failed.length}`);
  process.exit(1);
}

console.log("Child-first check passed.");
