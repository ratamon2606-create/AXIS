import { readFileSync, writeFileSync } from "node:fs";
const url = new URL("../package-lock.json", import.meta.url);
const lock = JSON.parse(readFileSync(url));
for (const name of Object.keys(lock.packages)) {
  if (name === "node_modules/next" || name === "node_modules/@next/env" || name.startsWith("node_modules/@next/swc-")) {
    delete lock.packages[name];
  }
}
writeFileSync(url, JSON.stringify(lock, null, 2) + "\n");
console.log("Next-related lock entries removed. Now run: npm install next@15.5.29 --save-exact && npm ci && npm run verify");
