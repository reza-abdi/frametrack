import { spawnSync } from "node:child_process";

const testUrl = process.env.TEST_DATABASE_URL?.trim();
const developmentUrl = process.env.DATABASE_URL?.trim();

if (!testUrl) {
  console.error(
    "Integration tests deferred: configure an isolated TEST_DATABASE_URL."
  );
  process.exit(1);
}

if (developmentUrl && testUrl === developmentUrl) {
  console.error(
    "Refusing destructive integration tests: TEST_DATABASE_URL equals DATABASE_URL."
  );
  process.exit(1);
}

const env: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: testUrl,
  NODE_ENV: "test",
};
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

for (const [command, args] of [
  [npx, ["prisma", "migrate", "deploy"]],
  [npx, ["tsx", "--test", "tests/integration/*.test.ts"]],
] as const) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
