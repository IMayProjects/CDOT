const esbuild = require("esbuild");
const fs = require("fs/promises");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const outputDir = path.join(projectRoot, "dist");

const bundles = [
  {
    entry: "src/code.ts",
    output: "core.js",
    globalName: "CDOTCore",
    handlers: ["runDeviceMigration"],
  },
  {
    entry: "src/UI.ts",
    output: "ui.js",
    globalName: "CDOTUI",
    handlers: ["onOpen", "showSidebar", "getClientConfig", "saveClientConfig"],
  },
];

const htmlAssets = [
  { source: "src/UI.html", output: "UI.html" },
];

function createHandlerFooter(globalName, handlers) {
  return handlers
    .map(
      (handler) =>
        `function ${handler}(...args) { return ${globalName}.${handler}(...args); }`,
    )
    .join("\n");
}

async function build() {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all(
    bundles.map((bundle) =>
      esbuild.build({
        entryPoints: [path.join(projectRoot, bundle.entry)],
        bundle: true,
        format: "iife",
        globalName: bundle.globalName,
        platform: "browser",
        target: "es2019",
        outfile: path.join(outputDir, bundle.output),
        footer: {
          js: createHandlerFooter(bundle.globalName, bundle.handlers),
        },
      }),
    ),
  );

  await Promise.all(
    [
      { source: "appsscript.json", output: "appsscript.json" },
      ...htmlAssets,
    ].map((asset) =>
      fs.copyFile(
        path.join(projectRoot, asset.source),
        path.join(outputDir, asset.output),
      ),
    ),
  );
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
