import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const directories = ["src", "prisma", "scripts"];
const codeExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css"]);
const thaiCharacters = /[\u0e00-\u0e7f]/;
const errors = [];
let scanned = 0;

function checkFile(filename) {
  const source = fs.readFileSync(filename, "utf8");
  const extension = path.extname(filename);
  if (extension === ".css") {
    for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
      if (thaiCharacters.test(match[0])) errors.push(`${filename}: Thai CSS comment`);
    }
    scanned++;
    return;
  }
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    extension === ".tsx" ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    source,
  );
  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) break;
    if (
      (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) &&
      thaiCharacters.test(scanner.getTokenText())
    ) {
      const line = source.slice(0, scanner.getTokenPos()).split("\n").length;
      errors.push(`${filename}:${line}: Thai comment`);
    }
  }
  scanned++;
}

function visit(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "exports"].includes(item.name)) continue;
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) visit(filename);
    else if (item.isFile() && codeExtensions.has(path.extname(filename))) checkFile(filename);
  }
}

for (const directory of directories) visit(directory);
if (errors.length > 0) {
  console.error("Comment policy failed:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Comment policy passed (${scanned} code files, no Thai comments).`);
}
