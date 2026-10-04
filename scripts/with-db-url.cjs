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
const url =
  merged.DATABASE_URL ||
  `postgresql://${encodeURIComponent(merged.DB_USER ?? "postgres")}:${encodeURIComponent(merged.DB_PASS ?? "")}@${merged.DB_HOST ?? "localhost"}:${merged.DB_PORT ?? "5432"}/${merged.DB_NAME}?schema=public`;

const [command, ...args] = process.argv.slice(2);

if (!command) {
  process.stderr.write("Informe o comando a executar\n");
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: "inherit",
  env: { ...merged, DATABASE_URL: url },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
