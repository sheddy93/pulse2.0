#!/usr/bin/env node
/**
 * Script per rimuovere/stub tutti i riferimenti base44 rimasti nel codebase.
 * Sostituisce le operazioni con TODO comments.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');

function removeBase44References(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Remove base44 import statements
  content = content.replace(
    /import\s+\{?\s*base44\s*\}?\s*from\s+['"]@\/api\/base44Client['"];?\n/g,
    ''
  );

  // Replace base44.entities.X.list() calls with TODO
  content = content.replace(
    /const\s+(\w+)\s*=\s*(?:await\s+)?base44\.entities\.(\w+)\.(?:list|filter)\([^)]*\);?/g,
    (match, varName, entity) => `const ${varName} = []; // TODO: Replace with API call to backend`
  );

  // Replace base44.entities.X.create() calls with TODO
  content = content.replace(
    /(?:await\s+)?base44\.entities\.(\w+)\.create\(([^)]*)\);?/g,
    `// TODO: Replace with API call to backend`
  );

  // Replace base44.entities.X.update() calls with TODO
  content = content.replace(
    /(?:await\s+)?base44\.entities\.(\w+)\.update\(([^)]*)\);?/g,
    `// TODO: Replace with API call to backend`
  );

  // Replace base44.entities.X.delete() calls with TODO
  content = content.replace(
    /(?:await\s+)?base44\.entities\.(\w+)\.delete\(([^)]*)\);?/g,
    `// TODO: Replace with API call to backend`
  );

  // Generic base44 reference replacement
  content = content.replace(/base44\./g, '// TODO: ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      removeBase44References(filePath);
    }
  });
}

console.log('Removing base44 references...');
walkDir(srcDir);
console.log('✓ Done! All base44 references have been removed or replaced with TODO comments.');