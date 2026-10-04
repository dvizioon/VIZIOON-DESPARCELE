const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "..", "node_modules", "tinymce");
const destination = path.join(__dirname, "..", "public", "tinymce");

if (!fs.existsSync(source)) {
  process.exit(0);
}

fs.cpSync(source, destination, { recursive: true });
