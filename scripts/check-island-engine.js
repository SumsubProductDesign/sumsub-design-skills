// Checks that plan.js / build.js / finish.js define every helper they call (v3.214.0 shipped finish.js without refPlacement).
// Run: node scripts/check-island-engine.js
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "../reference/products/island-migration");
const lib = fs.readFileSync(path.join(dir, "island-migration-lib.js"), "utf8");
const helpers = new Set([...lib.matchAll(/^\s*(?:async\s+)?function\s+(\w+)|^\s*const\s+(\w+)\s*=/gm)].map(m => m[1] || m[2]));
let bad = 0;
for (const f of ["plan.js", "build.js", "finish.js"]) {
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  const defined = new Set([...src.matchAll(/(?:function\s+(\w+))|(?:const\s+(\w+)\s*=)|(?:let\s+(\w+))/g)].map(m => m[1] || m[2] || m[3]));
  const called = new Set([...src.matchAll(/(?<![.\w])(\w+)\s*\(/g)].map(m => m[1]));
  const missing = [...called].filter(n => helpers.has(n) && !defined.has(n));
  if (missing.length) { bad++; console.error(f + ": calls undefined helpers: " + missing.join(", ")); } else console.log(f + ": ok");
  // v3.238: the file is pasted whole into one use_figma call, whose code limit is 50 000 characters, plus the appended
  // `return JSON.stringify(await …)` line. build.js reached 52 007 and had to be trimmed by hand mid-run.
  const chars = [...src].length, LIMIT = 49800;
  if (chars > LIMIT) { bad++; console.error(f + ": " + chars + " characters — over " + LIMIT + "; it won't fit one use_figma call. Move comments to island-migration-lib.js."); }
  else console.log(f + ": " + chars + " characters (limit " + LIMIT + ")");
}
process.exit(bad ? 1 : 0);
