/**
 * Script di verifica configurazione Playwright
 * 
 * Esegui: node tests/e2e/verify-setup.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifica configurazione Playwright E2E\n');

let errors = 0;
let warnings = 0;

// 1. Verifica file di test
console.log('📝 Verifica file di test:');
const testFiles = [
  'test-landing.spec.js',
  'test-auth.spec.js',
  'test-dashboard.spec.js',
  'test-navigation.spec.js',
];

testFiles.forEach(file => {
  const path = join(__dirname, file);
  if (existsSync(path)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MANCANTE`);
    errors++;
  }
});

// 2. Verifica playwright.config.js
console.log('\n⚙️  Verifica configurazione:');
const configPath = join(__dirname, '..', '..', 'playwright.config.js');
if (existsSync(configPath)) {
  console.log('  ✅ playwright.config.js');
  
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    
    // Verifica progetti browser
    const browsers = ['chromium', 'firefox', 'webkit', 'Mobile Chrome'];
    browsers.forEach(browser => {
      if (configContent.includes(browser)) {
        console.log(`    ✅ Browser configurato: ${browser}`);
      } else {
        console.log(`    ⚠️  Browser mancante: ${browser}`);
        warnings++;
      }
    });
    
    // Verifica webServer
    if (configContent.includes('webServer')) {
      console.log('    ✅ Web server auto-start configurato');
    } else {
      console.log('    ⚠️  Web server auto-start non configurato');
      warnings++;
    }
    
    // Verifica baseURL
    if (configContent.includes('baseURL')) {
      console.log('    ✅ Base URL configurato');
    } else {
      console.log('    ❌ Base URL non configurato');
      errors++;
    }
  } catch (err) {
    console.log(`    ⚠️  Errore lettura config: ${err.message}`);
    warnings++;
  }
} else {
  console.log('  ❌ playwright.config.js - MANCANTE');
  errors++;
}

// 3. Verifica package.json
console.log('\n📦 Verifica package.json:');
const packagePath = join(__dirname, '..', '..', 'package.json');
if (existsSync(packagePath)) {
  try {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    
    // Verifica dipendenze
    if (pkg.dependencies && pkg.dependencies['@playwright/test']) {
      console.log(`  ✅ @playwright/test installato (v${pkg.dependencies['@playwright/test']})`);
    } else {
      console.log('  ❌ @playwright/test non installato');
      errors++;
    }
    
    // Verifica script
    const scripts = ['test:e2e', 'test:e2e:ui', 'test:e2e:debug'];
    scripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        console.log(`  ✅ Script: ${script}`);
      } else {
        console.log(`  ⚠️  Script mancante: ${script}`);
        warnings++;
      }
    });
  } catch (err) {
    console.log(`  ⚠️  Errore lettura package.json: ${err.message}`);
    warnings++;
  }
}

// 4. Conta test
console.log('\n🧪 Conta test:');
let totalTests = 0;
testFiles.forEach(file => {
  const path = join(__dirname, file);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8');
    const testMatches = content.match(/test\(/g);
    const count = testMatches ? testMatches.length : 0;
    totalTests += count;
    console.log(`  ${file}: ${count} test`);
  }
});
console.log(`  📊 Totale: ${totalTests} test`);

// Riepilogo
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('✅ Configurazione perfetta! Tutto pronto per i test E2E.');
  console.log('\n🚀 Esegui i test con:');
  console.log('   npm run test:e2e');
  console.log('   npm run test:e2e:ui  (modalità interattiva)');
  console.log('\n⚠️  IMPORTANTE: Prima installare i browser:');
  console.log('   npx playwright install');
} else {
  if (errors > 0) {
    console.log(`❌ Trovati ${errors} errori`);
  }
  if (warnings > 0) {
    console.log(`⚠️  Trovati ${warnings} warning`);
  }
  console.log('\n🔧 Correggi i problemi prima di eseguire i test.');
  process.exit(1);
}

console.log('='.repeat(50));
