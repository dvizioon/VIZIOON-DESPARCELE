const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = {};

  for (const rawLine of fs.readFileSync(filePath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    parsed[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return parsed;
}

const root = path.resolve(__dirname, "..");
const fileEnv = {
  ...parseEnvFile(path.join(root, ".env.example")),
  ...parseEnvFile(path.join(root, ".env")),
};
const merged = { ...fileEnv, ...process.env };
const mode = process.argv[2] === "start" ? "start" : "dev";
const host = String(merged.HOST ?? "").trim() || "localhost";
const port = String(merged.PORT ?? "7250").trim();
const nextBin = path.join(root, "node_modules/next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, mode, "--port", port, "--hostname", host], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
