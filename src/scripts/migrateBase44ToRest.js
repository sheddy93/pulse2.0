#!/usr/bin/env node

/**
 * Script di migrazione automatica da base44 → restAdapter
 * Sostituisce le chiamate base44 con le equivalenti REST API
 * 
 * Utilizzo:
 * node scripts/migrateBase44ToRest.js <file_path> [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const BASE44_TO_REST_MAPPINGS = {
  // Auth mappings
  'base44.auth.me()': 'authService.me()',
  'base44.auth.logout()': 'authService.logout()',
  'base44.auth.isAuthenticated()': 'authService.isAuthenticated()',
  'base44.auth.updateMe(': 'authService.updateMe(',

  // Entity mappings - pattern matching
  'base44.entities.Employee.list()': 'employeeService.list()',
  'base44.entities.Employee.filter(': 'employeeService.filter(',
  'base44.entities.Employee.create(': 'employeeService.create(',
  'base44.entities.Employee.update(': 'employeeService.update(',
  'base44.entities.Employee.delete(': 'employeeService.delete(',

  'base44.entities.Company.list()': 'companyService.list()',
  'base44.entities.Company.filter(': 'companyService.filter(',
  'base44.entities.Company.create(': 'companyService.create(',
  'base44.entities.Company.update(': 'companyService.update(',

  'base44.entities.LeaveRequest.list()': 'leaveService.list()',
  'base44.entities.LeaveRequest.filter(': 'leaveService.filter(',
  'base44.entities.LeaveRequest.create(': 'leaveService.create(',
  'base44.entities.LeaveRequest.update(': 'leaveService.update(',

  'base44.entities.AttendanceEntry.list()': 'attendanceService.list()',
  'base44.entities.AttendanceEntry.filter(': 'attendanceService.filter(',
  'base44.entities.AttendanceEntry.create(': 'attendanceService.create(',

  'base44.entities.Document.list()': 'documentService.list()',
  'base44.entities.Document.filter(': 'documentService.filter(',
  'base44.entities.Document.create(': 'documentService.create(',
  'base44.entities.Document.update(': 'documentService.update(',
};

const REQUIRED_IMPORTS = {
  authService: "import { authService } from '@/services/authService';",
  employeeService: "import employeeService from '@/services/employees.service';",
  companyService: "import companyService from '@/services/companies.service';",
  leaveService: "import leaveService from '@/services/leave.service';",
  attendanceService: "import attendanceService from '@/services/attendance.service';",
  documentService: "import documentService from '@/services/documents.service';",
};

function migrateFile(filePath, dryRun = false) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const requiredImports = new Set();

  // Find all base44 usage and track required imports
  for (const [base44Call, restCall] of Object.entries(BASE44_TO_REST_MAPPINGS)) {
    if (content.includes(base44Call)) {
      const service = base44Call.split('.')[2].toLowerCase();
      if (service === 'auth') {
        requiredImports.add('authService');
      } else if (service === 'entities') {
        const entity = base44Call.split('.')[3];
        if (entity.includes('Employee')) requiredImports.add('employeeService');
        if (entity.includes('Company')) requiredImports.add('companyService');
        if (entity.includes('LeaveRequest')) requiredImports.add('leaveService');
        if (entity.includes('AttendanceEntry')) requiredImports.add('attendanceService');
        if (entity.includes('Document')) requiredImports.add('documentService');
      }
      content = content.replace(new RegExp(base44Call.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), restCall);
    }
  }

  // Remove old base44 import if present
  content = content.replace(/import\s+{\s*base44\s*}\s+from\s+['"]@\/api\/base44Client['"];?\n?/g, '');

  // Add required imports at top (after other imports)
  if (requiredImports.size > 0) {
    const importLines = Array.from(requiredImports)
      .map(service => REQUIRED_IMPORTS[service])
      .filter(Boolean)
      .join('\n');

    if (!content.includes(importLines)) {
      const importMatch = content.match(/^import\s+/m);
      if (importMatch) {
        const insertPos = content.lastIndexOf('\nimport') + 1;
        content = content.slice(0, insertPos) + importLines + '\n' + content.slice(insertPos);
      } else {
        content = importLines + '\n' + content;
      }
    }
  }

  if (content === originalContent) {
    console.log(`⏭️  No changes needed: ${filePath}`);
    return true;
  }

  if (dryRun) {
    console.log(`🔍 DRY RUN - Changes for: ${filePath}`);
    console.log(`   Imports to add: ${Array.from(requiredImports).join(', ')}`);
    return true;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Migrated: ${filePath}`);
  return true;
}

function migrateDirectory(dirPath, dryRun = false) {
  const files = fs.readdirSync(dirPath);
  let count = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      count += migrateDirectory(fullPath, dryRun);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (migrateFile(fullPath, dryRun)) {
        count++;
      }
    }
  }

  return count;
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = args[0] || 'src/pages';

console.log(`\n🚀 Starting migration: base44 → REST API`);
console.log(`📁 Target: ${target}`);
console.log(`⚙️  Mode: ${dryRun ? 'DRY RUN' : 'APPLY CHANGES'}\n`);

if (fs.statSync(target).isDirectory()) {
  const count = migrateDirectory(target, dryRun);
  console.log(`\n✨ Processed ${count} files`);
} else {
  migrateFile(target, dryRun);
}

console.log('');