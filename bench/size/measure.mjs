// Bundles the same small example with each library and prints what the first screen loads.
//
// Every entry in ./entries renders a translated string with a parameter and, where the
// library has it, a plural form. React itself is external: it is the same for everyone.
// Counted: the entry chunk and its static imports. Lazy chunks (a second language,
// dictly/check behind `validate`) are not, because the first screen does not load them.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";

import { build } from "esbuild";

const root = path.dirname(fileURLToPath(import.meta.url));

/** The packages each entry imports, for the version column. */
const PACKAGES = {
  dictly: ["dictly"],
  i18next: ["i18next", "react-i18next"],
  "react-intl": ["react-intl"],
  "use-intl": ["use-intl"],
  lingui: ["@lingui/core", "@lingui/react"],
  nanostores: ["@nanostores/i18n", "nanostores", "@nanostores/react"],
  "typesafe-i18n": ["typesafe-i18n"],
  rosetta: ["rosetta"],
};

function version(name) {
  const file = path.join(root, "node_modules", name, "package.json");

  return JSON.parse(readFileSync(file, "utf8")).version;
}

async function measure(entry) {
  const result = await build({
    entryPoints: [path.join(root, "entries", entry)],
    bundle: true,
    minify: true,
    format: "esm",
    splitting: true,
    outdir: path.join(root, "out"),
    write: false,
    metafile: true,
    jsx: "automatic",
    platform: "browser",
    target: "es2022",
    external: ["react", "react-dom", "react/jsx-runtime"],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
  });

  const { outputs } = result.metafile;
  const eager = new Set();
  const visit = (output) => {
    if (eager.has(output)) return;
    eager.add(output);
    for (const imported of outputs[output].imports) {
      if (imported.kind === "import-statement" && !imported.external) visit(imported.path);
    }
  };
  visit(Object.keys(outputs).find((output) => outputs[output].entryPoint));

  const eagerPaths = new Set([...eager].map((output) => path.resolve(output)));
  const code = Buffer.concat(
    result.outputFiles.filter((file) => eagerPaths.has(file.path)).map((file) => file.contents),
  );

  return {
    min: code.length,
    gzip: gzipSync(code, { level: 9 }).length,
    brotli: brotliCompressSync(code).length,
  };
}

const kB = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

const rows = [];

for (const entry of readdirSync(path.join(root, "entries")).filter((f) => f.endsWith(".jsx"))) {
  const name = entry.replace(".jsx", "");
  const packages = PACKAGES[name].map((p) => `${p} ${version(p)}`).join(", ");

  rows.push({ packages, ...(await measure(entry)) });
}

rows.sort((a, b) => a.gzip - b.gzip);

const table = [
  "| Packages | min | min + gzip | min + brotli |",
  "|---|--:|--:|--:|",
  ...rows.map((r) => `| ${r.packages} | ${kB(r.min)} | ${kB(r.gzip)} | ${kB(r.brotli)} |`),
].join("\n");

writeFileSync(path.join(root, "results.md"), `${table}\n`);
console.log(table);
