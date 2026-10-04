const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const source = path.join(root, "node_modules", "tinymce");
const destination = path.join(root, "public", "tinymce");

if (!fs.existsSync(source)) {
  process.exit(0);
}

fs.cpSync(source, destination, { recursive: true });

// Pacote tinymce-i18n (langs8 = TinyMCE 8) — português (Brasil).
const langSource = path.join(root, "node_modules", "tinymce-i18n", "langs8", "pt-BR.js");
const langsDir = path.join(destination, "langs");
const langDest = path.join(langsDir, "pt-BR.js");

if (fs.existsSync(langSource)) {
  fs.mkdirSync(langsDir, { recursive: true });
  fs.copyFileSync(langSource, langDest);
}
