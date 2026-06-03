const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const publicFiles = [
  "index.html",
  "favicon.ico",
  "favicon.svg",
  "founder.jpg",
  "5E24676A-3698-49D0-8993-2C2A0D1BB2C0_4_5005_c.jpeg",
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of publicFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing public file: ${file}`);
  }
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const forbidden = [
  ".env.local",
  ".git",
  "tbc-chief-of-staff.skill",
  "cold-email-tool.html",
  "index.html.bak.colloquial",
  "api",
  "netlify",
];
for (const name of forbidden) {
  if (fs.existsSync(path.join(dist, name))) {
    throw new Error(`Forbidden file copied into dist: ${name}`);
  }
}

console.log(`[TBC] Built clean deploy folder: ${dist}`);
