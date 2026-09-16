const esbuild = require("esbuild");
const fs = require("fs/promises");
const path = require("path");

async function build() {
  const outputDir = path.join(__dirname, "..", "dist");

  await esbuild.build({
    entryPoints: [path.join(__dirname, "..", "src", "code.ts")],
    bundle: true,
    format: "iife",
    globalName: "AppsScript",
    platform: "browser",
    target: "es2019",
    outfile: path.join(outputDir, "code.js"),
    footer: {
      js: [
        "function myFunction() { return AppsScript.myFunction(); }",
        "function runDeviceMigration() { return AppsScript.runDeviceMigration(); }",
      ].join("\n"),
    },
  });

  await fs.copyFile(
    path.join(__dirname, "..", "appsscript.json"),
    path.join(outputDir, "appsscript.json"),
  );
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
