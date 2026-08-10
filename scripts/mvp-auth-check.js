const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

const index = read("index.html");
const script = read("script.js");
const supabase = read("supabase-client.js");
const config = read("config.js");
const migration = read("supabase/migrations/202608100001_mvp_auth_rls.sql");
const gitignore = read(".gitignore");

assert(index.includes("config.js"), "index.html loads config.js");
assert(index.includes("supabase-client.js"), "index.html loads supabase-client.js");
assert(index.includes("registerBtn"), "registration button exists");
assert(index.includes("loginBtn"), "login button exists");
assert(!/<option value=\"admin\"/i.test(index), "admin role is not self-selectable");

assert(supabase.includes("/auth/v1/signup"), "Supabase signup endpoint is wired");
assert(supabase.includes("/auth/v1/token?grant_type=password"), "Supabase email/password login is wired");
assert(supabase.includes("roleForEmail"), "admin role is assigned by owner email, not UI choice");
assert(!/service_role/i.test(config), "config.js does not contain service role key text");
assert(!/sk-proj-|sk-[A-Za-z0-9_-]{20,}/.test(config + index + script + supabase), "public files do not contain OpenAI secret keys");

assert(migration.includes("enable row level security"), "migration enables row level security");
assert(migration.includes("parent_children"), "migration includes parent-child links");
assert(migration.includes("teacher_classes"), "migration includes teacher-class links");
assert(migration.includes("test_attempts"), "migration includes test attempts");
assert(migration.includes("user_events"), "migration includes analytics events");
assert(migration.includes("public.can_read_profile"), "migration includes shared access function");

assert(gitignore.includes(".env"), ".env is ignored");
assert(gitignore.includes("data/"), "local data folder is ignored");

if (process.exitCode) {
  console.error("MVP auth/cloud static checks failed.");
  process.exit(process.exitCode);
}

console.log("MVP auth/cloud static checks passed.");
