const fs = require('fs');
const path = require('path');

const UNUSED_DB_ONLY_TABLES = new Set([
  'overdue_fee_adjustment_request',
  'access_credential',
  'ledger_entry',
]);

function normalizeType(rawType) {
  return rawType
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^BIGINT$/i, 'bigint')
    .replace(/^INT$|^INTEGER$/i, 'integer')
    .replace(/^BOOLEAN$/i, 'boolean')
    .replace(/^TIMESTAMPTZ$/i, 'timestamptz')
    .replace(/^TIMESTAMP WITH TIME ZONE$/i, 'timestamptz')
    .replace(/^DECIMAL\s*\(/i, 'decimal(')
    .replace(/^NUMERIC\s*\(/i, 'decimal(')
    .replace(/^VARCHAR\s*\(/i, 'varchar(')
    .replace(/^TEXT$/i, 'text')
    .replace(/^DATE$/i, 'date')
    .replace(/^TIME$/i, 'time')
    .toLowerCase();
}

function splitTopLevelCommas(body) {
  const parts = [];
  let depth = 0;
  let inSingle = false;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'" && body[i - 1] !== '\\') inSingle = !inSingle;
    else if (!inSingle && ch === '(') depth++;
    else if (!inSingle && ch === ')') depth = Math.max(0, depth - 1);
    else if (!inSingle && depth === 0 && ch === ',') {
      parts.push(body.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(body.slice(start));
  return parts.map(p => p.trim()).filter(Boolean);
}

function parsePostgresMigrations(migrationDir) {
  const files = fs.readdirSync(migrationDir)
    .filter(f => /^V\d+__.*\.sql$/.test(f))
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

  const tables = new Map();

  const ensureCol = (tableName, colName) => {
    const t = tables.get(tableName);
    return t ? t.columns.find(c => c.name === colName) : null;
  };

  for (const file of files) {
    let sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    // Strip block comments and line comments
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\r\n]*/g, '');

    // 1. CREATE TABLE
    const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\)\s*;/gi;
    let m;
    while ((m = createRegex.exec(sql)) !== null) {
      const tableName = m[1].toLowerCase();
      const body = m[2];
      const items = splitTopLevelCommas(body);
      const cols = [];
      const fks = [];
      const uniques = [];

      for (const item of items) {
        const upper = item.toUpperCase();
        if (upper.startsWith('CONSTRAINT') || upper.startsWith('FOREIGN KEY') || upper.startsWith('UNIQUE') || upper.startsWith('CHECK') || upper.startsWith('PRIMARY KEY')) {
          const fkMatch = item.match(/FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/i);
          if (fkMatch) {
            fks.push({ col: fkMatch[1].toLowerCase(), refTable: fkMatch[2].toLowerCase(), refCol: fkMatch[3].toLowerCase() });
          }
          const uqMatch = item.match(/UNIQUE\s*\(([^)]+)\)/i);
          if (uqMatch) {
            const uCols = uqMatch[1].split(',').map(s => s.trim().toLowerCase());
            uniques.push(uCols);
          }
          continue;
        }

        const colMatch = item.match(/^(\w+)\s+([A-Z]+(?:\s+WITH\s+TIME\s+ZONE)?(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)\s*(.*)$/i);
        if (colMatch) {
          const colName = colMatch[1].toLowerCase();
          const typeStr = normalizeType(colMatch[2]);
          const rest = colMatch[3] || '';
          const isPk = /PRIMARY\s+KEY/i.test(rest);
          const isNotNull = isPk || /\bNOT\s+NULL\b/i.test(rest);
          const isUnique = /\bUNIQUE\b/i.test(rest);
          cols.push({
            name: colName,
            type: typeStr,
            pk: isPk,
            nullable: !isNotNull,
            unique: isUnique,
            fk: null,
          });
        }
      }

      for (const fk of fks) {
        const c = cols.find(x => x.name === fk.col);
        if (c) c.fk = { table: fk.refTable, col: fk.refCol };
      }
      for (const uCols of uniques) {
        if (uCols.length === 1) {
          const c = cols.find(x => x.name === uCols[0]);
          if (c) c.unique = true;
        }
      }

      tables.set(tableName, { name: tableName, columns: cols, compositeUniques: uniques.filter(u => u.length > 1) });
    }

    // 2. ALTER TABLE ... ADD COLUMN
    const addColRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+([A-Z]+(?:\s+WITH\s+TIME\s+ZONE)?(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)\s*([^;]*);/gi;
    while ((m = addColRegex.exec(sql)) !== null) {
      const tableName = m[1].toLowerCase();
      const t = tables.get(tableName);
      if (!t) continue;
      const colName = m[2].toLowerCase();
      const rest = m[4] || '';
      if (!t.columns.find(c => c.name === colName)) {
        t.columns.push({
          name: colName,
          type: normalizeType(m[3]),
          pk: false,
          nullable: !/\bNOT\s+NULL\b/i.test(rest),
          unique: /\bUNIQUE\b/i.test(rest),
          fk: null,
        });
      }
    }

    // 3. ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL
    const dropNotNullRegex = /ALTER\s+TABLE\s+(\w+)\s+ALTER\s+COLUMN\s+(\w+)\s+DROP\s+NOT\s+NULL\s*;/gi;
    while ((m = dropNotNullRegex.exec(sql)) !== null) {
      const c = ensureCol(m[1].toLowerCase(), m[2].toLowerCase());
      if (c) c.nullable = true;
    }

    // 4. ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
    const alterFkRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)\s*;/gi;
    while ((m = alterFkRegex.exec(sql)) !== null) {
      const c = ensureCol(m[1].toLowerCase(), m[2].toLowerCase());
      if (c) c.fk = { table: m[3].toLowerCase(), col: m[4].toLowerCase() };
    }

    // 5. CREATE UNIQUE INDEX ... ON tbl(col)
    const uqIdxRegex = /CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?\w+\s+ON\s+(\w+)\s*\(\s*(\w+)\s*\)/gi;
    while ((m = uqIdxRegex.exec(sql)) !== null) {
      const c = ensureCol(m[1].toLowerCase(), m[2].toLowerCase());
      if (c) c.unique = true;
    }
  }

  return tables;
}

if (require.main === module) {
  const migDir = path.resolve('backend/src/main/resources/db/migration');
  const all = parsePostgresMigrations(migDir);
  const active = [...all.values()].filter(t => !UNUSED_DB_ONLY_TABLES.has(t.name));
  console.log(`Total Flyway tables: ${all.size} | Active JPA tables: ${active.length}`);
  const dumpCols = process.argv.includes('--dump');
  let fkCount = 0;
  for (const t of active) {
    const fks = t.columns.filter(c => c.fk).map(c => `${c.name}->${c.fk.table}${c.nullable ? '?' : ''}${c.unique ? '(1:1)' : ''}`);
    fkCount += fks.length;
    console.log(`- ${t.name} (${t.columns.length} cols): ${fks.join(', ') || '(standalone)'}`);
    if (dumpCols) {
      for (const c of t.columns) {
        const flags = [c.pk ? 'PK' : '', c.fk ? 'FK->' + c.fk.table : '', c.unique ? 'U' : '', c.nullable ? 'N' : 'NN'].filter(Boolean).join(',');
        console.log(`    ${c.name.padEnd(32)} ${c.type.padEnd(16)} ${flags}`);
      }
    }
  }
  console.log(`Total explicit SQL FKs among 27 active tables: ${fkCount}`);
}

module.exports = { parsePostgresMigrations, UNUSED_DB_ONLY_TABLES };
