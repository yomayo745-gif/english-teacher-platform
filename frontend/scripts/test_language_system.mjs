import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsPath = path.resolve(__dirname, '../src/i18n/translations.ts');
const fileContent = fs.readFileSync(translationsPath, 'utf8');

// Extract translations object using regex or execution
const jsonCleaned = fileContent
  .replace(/export type.*?;/gs, '')
  .replace(/export interface.*?\}/gs, '')
  .replace(/export const translations = /g, 'globalThis.translations = ')
  .replace(/;\s*$/, '');

// Evaluate in clean context
try {
  eval(jsonCleaned);
} catch (e) {
  console.error("Failed to parse translations:", e);
  process.exit(1);
}

const trans = globalThis.translations;
let totalChecked = 0;
let errors = [];

function checkObject(obj, prefix = '') {
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object') {
      if ('en' in val || 'uz' in val) {
        totalChecked++;
        if (!val.en || typeof val.en !== 'string' || val.en.trim() === '') {
          errors.push(`Missing EN for: ${fullPath}`);
        }
        if (!val.uz || typeof val.uz !== 'string' || val.uz.trim() === '') {
          errors.push(`Missing UZ for: ${fullPath}`);
        }
      } else {
        checkObject(val, fullPath);
      }
    }
  }
}

checkObject(trans);

console.log(`\n=== LANGUAGE SYSTEM AUDIT RESULT ===`);
console.log(`Total translation items audited: ${totalChecked}`);
if (errors.length === 0) {
  console.log(`[PASS] 100% parity achieved! Zero missing keys in UZ and EN.\n`);
  process.exit(0);
} else {
  console.error(`[FAIL] Found ${errors.length} issues:`);
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}
