// export-sqlite-to-excel.js
// Export all tables from a SQLite DB to Excel files in an exports directory.
//
// Usage examples:
//   node export-sqlite-to-excel.js
//   node export-sqlite-to-excel.js --db /srv/separnoavari/separnoavari/server/database.db
//   node export-sqlite-to-excel.js --out ./my_exports --mode combined
//
// Flags:
//   --db   : path to SQLite file (default: ./database.db)
//   --out  : output directory (default: ./exports)
//   --mode : "separate" (1 xlsx per table) or "combined" (all tables in one xlsx). Default: separate

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import ExcelJS from "exceljs";

// --- simple arg parser ---
function arg(key, fallback) {
  const i = process.argv.findIndex(v => v === `--${key}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const DB_PATH = arg("db", path.resolve("./database.db"));
const OUT_DIR = path.resolve(arg("out", "./exports"));
const MODE = (arg("mode", "separate") || "separate").toLowerCase(); // separate | combined

// --- ensure output dir exists ---
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- open database (read-only) ---
if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ DB file not found: ${DB_PATH}`);
  process.exit(1);
}
const db = new Database(DB_PATH, { readonly: true });

// --- list user tables (skip sqlite_internal tables) ---
const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`)
  .all()
  .map(r => r.name);

if (tables.length === 0) {
  console.log("ℹ️ No user tables found.");
  process.exit(0);
}

console.log(`🔎 Found ${tables.length} tables:\n - ${tables.join("\n - ")}`);

function getColumns(table) {
  const cols = db.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all();
  return cols.map(c => c.name);
}

function fetchAllRows(table) {
  // Using prepared stmt keeps memory sane even for big tables
  const stmt = db.prepare(`SELECT * FROM "${table}"`);
  return stmt.all();
}

function toDisplayValue(value) {
  if (value === null || value === undefined) return null;
  if (Buffer.isBuffer(value)) {
    // BLOB -> base64
    return value.toString("base64");
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString("base64");
  }
  if (typeof value === "object") {
    // Try to stringify JSON-ish objects
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return value;
}

// --- write one worksheet from table data ---
async function addWorksheetFromTable(workbook, table) {
  const cols = getColumns(table);
  const rows = fetchAllRows(table);

  const ws = workbook.addWorksheet(table);
  ws.addRow(cols); // header

  for (const r of rows) {
    const row = cols.map(c => toDisplayValue(r[c]));
    ws.addRow(row);
  }

  // Basic header styling
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle" };
  ws.columns = cols.map(() => ({ width: 20 }));
}

async function exportSeparate() {
  for (const table of tables) {
    const workbook = new ExcelJS.Workbook();
    await addWorksheetFromTable(workbook, table);
    const outPath = path.join(OUT_DIR, `${table}.xlsx`);
    await workbook.xlsx.writeFile(outPath);
    console.log(`✅ Wrote ${outPath}`);
  }
}

async function exportCombined() {
  const workbook = new ExcelJS.Workbook();
  for (const table of tables) {
    await addWorksheetFromTable(workbook, table);
  }
  const outPath = path.join(OUT_DIR, `sqlite_export_all_tables.xlsx`);
  await workbook.xlsx.writeFile(outPath);
  console.log(`✅ Wrote ${outPath}`);
}

(async () => {
  console.log(`\n📦 DB: ${DB_PATH}`);
  console.log(`📂 Out: ${OUT_DIR}`);
  console.log(`🧭 Mode: ${MODE}\n`);

  try {
    if (MODE === "combined") {
      await exportCombined();
    } else {
      await exportSeparate();
    }
    console.log("\n🎉 Done.");
  } catch (err) {
    console.error("❌ Export failed:", err);
    process.exit(1);
  } finally {
    db.close();
  }
})();
