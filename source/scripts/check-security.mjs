import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url)));
const required = "15.5.29";
const requiredPackages = ["node_modules/next", "node_modules/@next/env", ...[
  "darwin-arm64", "darwin-x64", "linux-arm64-gnu", "linux-arm64-musl",
  "linux-x64-gnu", "linux-x64-musl", "win32-arm64-msvc", "win32-x64-msvc"
].map((suffix) => `node_modules/@next/swc-${suffix}`)];
const problems = [];
if (manifest.dependencies.next !== required) problems.push(`package.json must pin next@${required}`);
if (lock.packages?.[""]?.dependencies?.next !== required) problems.push(`lockfile root dependency must pin next@${required}`);
for (const name of requiredPackages) {
  const value = lock.packages?.[name];
  if (!value) { problems.push(`${name}: missing lockfile entry`); continue; }
  if (value.version !== required) problems.push(`${name}: wrong version ${value.version}`);
  if (typeof value.integrity !== "string" || !value.integrity.startsWith("sha512-")) problems.push(`${name}: SHA512 lockfile integrity is missing`);
}
if (problems.length) {
  console.error("AXIS SECURITY RELEASE GATE FAILED:\n- " + problems.join("\n- "));
  console.error(`Connect to npm registry, run: node scripts/refresh-next-lock.mjs && npm install next@${required} --save-exact; then commit package-lock.json and rerun npm run verify`);
  process.exit(1);
}
console.log(`AXIS security gate passed: Next.js ${required}, lockfile SHA512 metadata present.`);
