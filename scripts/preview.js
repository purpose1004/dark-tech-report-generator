#!/usr/bin/env node
/*
 * 跨平台预览/QA：把 .pptx 转成每页一张 PNG。
 * 依赖 LibreOffice (soffice) 做 pptx→pdf，pdftoppm (poppler) 做 pdf→png。
 * 用法: node scripts/preview.js <file.pptx> [outDir]
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pptx = process.argv[2];
if (!pptx) { console.error("Usage: node scripts/preview.js <file.pptx> [outDir]"); process.exit(1); }
if (!fs.existsSync(pptx)) { console.error("找不到文件:", pptx); process.exit(1); }
const outDir = process.argv[3] || path.join(path.dirname(path.resolve(pptx)), "_preview");
fs.mkdirSync(outDir, { recursive: true });

function which(cands) {
  for (const c of cands) {
    try { execFileSync(c, ["--version"], { stdio: "ignore" }); return c; } catch (e) {}
    try { if (path.isAbsolute(c) && fs.existsSync(c)) return c; } catch (e) {}
  }
  return null;
}

const soffice = which([
  "soffice", "libreoffice",
  "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
]);
if (!soffice) {
  console.error("未找到 LibreOffice (soffice)。请安装：https://www.libreoffice.org/");
  console.error("（或在 PowerPoint/Keynote/WPS 里直接打开 .pptx 预览。）");
  process.exit(1);
}

console.log("→ pptx → pdf …");
execFileSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", outDir, path.resolve(pptx)], { stdio: "inherit" });
const pdf = path.join(outDir, path.basename(pptx).replace(/\.pptx$/i, ".pdf"));
if (!fs.existsSync(pdf)) { console.error("PDF 生成失败"); process.exit(1); }

const pdftoppm = which(["pdftoppm"]);
if (!pdftoppm) {
  console.log("PDF 已生成:", pdf);
  console.log("（未找到 pdftoppm/poppler，跳过 PNG 转换。安装 poppler 后可逐页出图。）");
  process.exit(0);
}
console.log("→ pdf → png …");
execFileSync(pdftoppm, ["-png", "-r", "150", pdf, path.join(outDir, "slide")], { stdio: "inherit" });
console.log("✓ 输出目录:", outDir);
