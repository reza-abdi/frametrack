import { spawnSync } from "node:child_process";

const required = ["E2E_BASE_URL", "E2E_ADMIN_LOGIN", "E2E_ADMIN_PASSWORD"];
const missing = required.filter((name) => !process.env[name]?.trim());

if (process.env.E2E_DATABASE_ISOLATED !== "true") {
  console.error(
    "E2E execution deferred: set E2E_DATABASE_ISOLATED=true only for an isolated database."
  );
  process.exit(1);
}
if (missing.length) {
  console.error(`E2E execution deferred: missing ${missing.join(", ")}.`);
  process.exit(1);
}

const result = spawnSync("npx.cmd", ["playwright", "test"], {
  env: process.env,
  stdio: "inherit",
  shell: false,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
