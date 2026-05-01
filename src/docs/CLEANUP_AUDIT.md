# 🔍 Audit Cleanup - AldevionHR

**Data:** 2026-05-01  
**Scope:** Rimozione rimanenze Base44, duplicati, code dead, e file non necessari

---

## ❌ PROBLEMI IDENTIFICATI

### 1. **Base44 Dependencies & Code** (CRITICAL)
- ❌ `package.json`: `@base44/sdk` ^ `@base44/vite-plugin` (non usati)
- ❌ `vite.config.js`: `base44Plugin()` nel config
- ❌ `src/api/base44Client.js`: Intero file legacy (NON USATO)
- ❌ `src/lib/app-params.js`: Gestione auth Base44 (NON USATO)
- ❌ `src/lib/AuthContext.jsx`: Context Base44 auth (DUPLICATE con AuthContextDecoupled)
- ❌ `src/api/migrationAdapter.ts`: Bridge temporaneo (NON PIÙ NECESSARIO)

### 2. **Frontend Web Vitals Overzealous** (REMOVABLE)
- ⚠️ `src/main.jsx`: 70 righe di Web Vitals monitoring (EXCESSIVE)
  - `getCLS()`, `getLCP()`, `getFID()` - overkill per fase di sviluppo
  - Console log spammante in console.log ogni evento
  - **Action:** Semplificare a minimal logging

### 3. **Service Layer Redundancy**
- ⚠️ `src/services/index.ts`: Exports solo 5 servizi, ma molti file hanno imports sparsi
- ⚠️ `src/services/authService.js` vs `src/services/authService.ts` (DUPLICATO!)
- ⚠️ Molti file hanno `// TODO: Replace with API call` inline (legacy)

### 4. **Unused/Legacy API Adapters**
- ❌ `src/api/adapters/` folder: 2 file (legacy + nuovo)
  - `restAdapter.js` - versione vecchia
  - `restAdapter.ts` - versione nuova
  - **Action:** Consolidare in un unico file TypeScript

### 5. **Backend Configuration Files**
- ⚠️ `backend/tsconfig.json`: Potrebbe essere semplificato
- ⚠️ `backend/nest-cli.json`: Boilerplate standard NestJS

### 6. **Documentation Bloat**
- ⚠️ `docs/` folder: 20+ file markdown
  - Molti sono status report (non necessari in produzione)
  - **Files to remove:** PROGRESS_TRACKER.md, MIGRATION_*.md, CHECKLIST_*.md, CODE_AUDIT_*.md

### 7. **PWA Service Workers Duplicati**
- ❌ `public/service-worker.js` (vecchio)
- ⚠️ `public/service-worker-v3.js` (attuale?)
- ⚠️ `public/service-worker-enhanced.js` (legacy?)
- **Action:** Tenere SOLO il file attuale, rinominare se necessario

### 8. **Frontend Package.json**
- ⚠️ Mancano alcune dipendenze usate nel codice:
  - `react-markdown` (usato in ChatWindow) - NON IN DIPENDENZE!
  - `speakeasy` (usato per 2FA) - NON IN DIPENDENZE!
  - `jspdf`, `jszip`, `html2canvas` (usati per export) - NON IN DIPENDENZE!

### 9. **Entity Duplicati**
- ⚠️ Molti file `.json` nella cartella `src/entities/` non sono più usati:
  - `src/entities/CalendarSyncState.json` (vs CalendarSync.json)
  - Altre varianti storiche

### 10. **Lib Folder Scattered**
- ⚠️ `src/lib/` contiene 20+ file misti:
  - Auth context (duplicato)
  - Config params (legacy)
  - Utils sparse
  - **Action:** Organizzare in sottocartelle logiche

---

## ✅ AZIONI CONSIGLIATE

### Phase 1: Critical Cleanup (OGGI)
1. ✂️ Rimuovere `@base44/sdk` da package.json
2. ✂️ Rimuovere `@base44/vite-plugin` da vite.config.js
3. ✂️ Eliminare `src/api/base44Client.js`
4. ✂️ Eliminare `src/lib/app-params.js`
5. ✂️ Consolidare `src/services/authService.js` → `.ts`
6. ✂️ Consolidare `src/api/adapters/` → singolo `restClient.ts`
7. ✂️ Consolidare service workers → `public/service-worker.js`
8. ✂️ Verificare/aggiungere dipendenze mancanti in package.json

### Phase 2: Documentation Cleanup (TOMORROW)
1. ✂️ Tenere: README.md, README_MIGRATION.md, ARCHITECTURE.md, API_DOCUMENTATION.md
2. ✂️ Eliminare: PROGRESS_TRACKER.md, MIGRATION_*.md, CHECKLIST_*.md, CODE_AUDIT_*.md
3. ✂️ Creare: docs/CLEANUP_SUMMARY.md (al posto di tutti i report)

### Phase 3: Lib Organization (TOMORROW)
1. 📁 Creare `/src/lib/auth/` (contexts, hooks)
2. 📁 Creare `/src/lib/utils/` (helpers)
3. 📁 Creare `/src/lib/config/` (constants, env)
4. Muovere file in cartelle appropriate

### Phase 4: Entity Cleanup (OPTIONAL)
1. Rivedere entities non più usate
2. Consolidare varianti duplicate

---

## 📊 STIME

| Categoria | File | LOC | Azione |
|-----------|------|-----|--------|
| Base44 Legacy | 4 | ~300 | DELETE |
| Web Vitals | 1 | 70 | SIMPLIFY |
| Service Duplicati | 2 | 200 | CONSOLIDATE |
| API Adapters | 2 | 100 | CONSOLIDATE |
| Service Workers | 3 | 300 | CONSOLIDATE |
| Docs Legacy | 15 | 5000+ | DELETE |
| **TOTALE** | **27** | **~6000** | |

**Spazio riducibile:** ~200-300 KB  
**Build time savings:** ~5-10% (meno file da processare)  
**Mental load savings:** HUGE (meno confusione, path chiari)

---

## 🚀 PRIORITÀ

1. 🔴 **CRITICAL** - Rimuovere Base44 (causa conflitti build)
2. 🟠 **HIGH** - Consolidare duplicati (causa confusione)
3. 🟡 **MEDIUM** - Semplificare Web Vitals
4. 🟢 **LOW** - Organizzare lib folder (miglioramento UX)