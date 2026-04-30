import { useState } from "react";
import { AlertTriangle, CheckCircle, Folder, File, ChevronRight, ChevronDown, Copy, Check, XCircle, ArrowRight } from "lucide-react";

const PROBLEMS = [
  {
    severity: "critical",
    area: "ROOT",
    title: "20+ file .md di audit sparsi nella root",
    current: "ACCOUNT_ROLES_AND_LINKS_FIX_REPORT.md, AUDIT_20_FASI_PULSEHR.md, AUDIT_FIXES_26_04.md, AUDIT_REPORT_FASE2_3.md, BLOCKER_FIXES_REPORT_26_04.md, BLOCKER_FIXES_REPORT_FINAL.md, CHANGELOG.md, CLOSED_BETA.md, CSS_AUDIT_REPORT.md, DEPLOYMENT.md, DEPLOY_INSTRUCTIONS.md, DEPLOY_RENDER_VERCEL.md, FASE5_REPORT.md, ...",
    fix: "Sposta tutto in docs/ → docs/audit/, docs/deploy/, docs/reports/"
  },
  {
    severity: "critical",
    area: "ROOT",
    title: "Cartella src/ in mezzo a backend/ e frontend/",
    current: "Il repo contiene src/ (Base44 React), frontend/ (Next.js) e backend/ (Django) tutti allo stesso livello. Caos totale.",
    fix: "src/ è la app Base44 e NON appartiene al repo pulse2.0. Il repo deve avere solo backend/ e frontend/."
  },
  {
    severity: "critical",
    area: "BACKEND",
    title: "backend/backend/ — cartella annidata con lo stesso nome",
    current: "backend/backend/ contiene settings.py, urls.py, wsgi.py, asgi.py. Nessun senso.",
    fix: "Rinomina in backend/config/ (standard Django per il progetto config package)"
  },
  {
    severity: "critical",
    area: "BACKEND",
    title: "backend/api/ e backend/users/ allo stesso livello",
    current: "backend/api/ sembra un'app separata ma backend/users/ contiene TUTTO (views, services, models, serializers). Duplicazione di responsabilità.",
    fix: "Se api/ è solo routing: mantieni. Se contiene logica: unifica tutto in users/ o splitta in app separate per dominio."
  },
  {
    severity: "high",
    area: "BACKEND",
    title: "30+ file _views.py piatti in backend/users/",
    current: "views.py, leave_views.py, dashboard_views.py, analytics_views.py, automation_views.py, companies_admin_views.py, consultant_advanced_views.py, geolocation_views.py, payroll_views.py, safety_views.py, document_views.py...",
    fix: "Crea backend/users/views/ package con file separati per dominio: views/__init__.py, views/auth.py, views/attendance.py, views/leave.py, views/dashboard.py ecc."
  },
  {
    severity: "high",
    area: "BACKEND",
    title: "File di utility misti con file di business logic",
    current: "email_utils.py, geolocation_utils.py, pricing_utils.py, cookie_auth.py, automation_service.py tutti piatti in users/",
    fix: "Crea backend/users/utils/ per utility e tieni services/ separato"
  },
  {
    severity: "high",
    area: "BACKEND",
    title: "Dockerfile.disabled in produzione",
    current: "backend/Dockerfile.disabled — file disabilitato committato nel repo",
    fix: "Elimina. Usa git history se serve."
  },
  {
    severity: "high",
    area: "BACKEND",
    title: "README moltiplicati in ogni cartella",
    current: "backend/README.md, backend/README_DEPLOY_RAILWAY.md, backend/SETUP_LOCAL.md, backend/LICENZA.txt",
    fix: "Tieni solo backend/README.md. Il resto va in docs/"
  },
  {
    severity: "high",
    area: "FRONTEND",
    title: "File .md sparsi in frontend/components/",
    current: "frontend/components/LANGUAGE-SWITCHER-README.md",
    fix: "Elimina o sposta in docs/"
  },
  {
    severity: "high",
    area: "FRONTEND",
    title: "Componenti duplicati: auth-guard.js e auth-guard.tsx",
    current: "frontend/components/auth-guard.js E auth-guard.tsx — stessa cosa in due file diversi",
    fix: "Tieni solo auth-guard.tsx (TypeScript). Elimina il .js"
  },
  {
    severity: "high",
    area: "FRONTEND",
    title: "Componenti piatti in frontend/components/ root",
    current: "app-shell.js, approval-workflow.jsx, auth-guard.js, auth-guard.tsx, company-card.js, company-status-badge.js, department-badge.js... tutti nella root di components/",
    fix: "Sposta in sottocartelle per dominio: components/company/, components/attendance/ ecc. Le sottocartelle auth/, dashboard/, layout/ esistono già — usale."
  },
  {
    severity: "medium",
    area: "FRONTEND",
    title: "features/ duplica la struttura di components/",
    current: "frontend/features/ e frontend/components/ hanno strutture sovrapposte",
    fix: "Consolida: usa components/ per UI puri, features/ SOLO per feature-specific logic (hooks + components + types insieme)"
  },
  {
    severity: "medium",
    area: "FRONTEND",
    title: "Mix di .js, .jsx, .tsx nella stessa cartella",
    current: "company-card.js, auth-guard.tsx, approval-workflow.jsx — tre estensioni diverse per lo stesso tipo di file",
    fix: "Scegli UNO standard: .tsx per tutto (TypeScript) o .jsx per tutto (JavaScript). Non mescolare."
  },
  {
    severity: "medium",
    area: "ROOT",
    title: "File di setup script multipli e ridondanti",
    current: "backend/setup-local.bat, backend/setup-local.ps1, backend/setup-local.sh, backend/build.sh — 4 script per lo stesso scopo",
    fix: "Mantieni Makefile (già presente) e al massimo build.sh. Elimina i .bat/.ps1 o sposta in scripts/"
  },
  {
    severity: "medium",
    area: "FRONTEND",
    title: "QA e doc file dentro frontend/",
    current: "frontend/MANUAL_QA.md, frontend/QA_CHECKLIST.md, frontend/QUICK_START_E2E.md",
    fix: "Sposta in docs/qa/"
  }
];

const TARGET_STRUCTURE = `pulse2.0/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-frontend.yml
│   │   └── deploy-backend.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                          ← NUOVO: tutto il markdown qui
│   ├── audit/
│   │   ├── AUDIT_20_FASI.md
│   │   ├── AUDIT_FIXES.md
│   │   └── BLOCKER_FIXES.md
│   ├── deploy/
│   │   ├── RENDER_VERCEL.md
│   │   ├── RAILWAY.md
│   │   └── VERCEL.md
│   ├── qa/
│   │   ├── MANUAL_QA.md
│   │   ├── QA_CHECKLIST.md
│   │   └── QUICK_START_E2E.md
│   └── reports/
│       ├── CHANGELOG.md
│       └── FASE5_REPORT.md
│
├── backend/
│   ├── config/                    ← RINOMINATO da backend/backend/
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── users/                     ← App principale Django
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── users.py
│   │   │   ├── companies.py
│   │   │   ├── attendance.py
│   │   │   ├── leave.py
│   │   │   ├── payroll.py
│   │   │   └── safety.py
│   │   │
│   │   ├── views/                 ← NUOVO: package invece di file piatti
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── attendance.py
│   │   │   ├── leave.py
│   │   │   ├── dashboard.py
│   │   │   ├── analytics.py
│   │   │   ├── companies.py
│   │   │   ├── consultant.py
│   │   │   ├── documents.py
│   │   │   ├── payroll.py
│   │   │   ├── safety.py
│   │   │   └── automation.py
│   │   │
│   │   ├── services/              ← NUOVO: package invece di file singolo
│   │   │   ├── __init__.py
│   │   │   ├── attendance.py
│   │   │   ├── leave.py
│   │   │   ├── notifications.py
│   │   │   └── onboarding.py
│   │   │
│   │   ├── utils/                 ← NUOVO: utility separate
│   │   │   ├── __init__.py
│   │   │   ├── email.py
│   │   │   ├── geolocation.py
│   │   │   ├── pricing.py
│   │   │   └── cookie_auth.py
│   │   │
│   │   ├── serializers/           ← NUOVO: package invece di file singolo
│   │   │   ├── __init__.py
│   │   │   ├── users.py
│   │   │   ├── attendance.py
│   │   │   └── leave.py
│   │   │
│   │   ├── migrations/
│   │   ├── templates/
│   │   │   └── emails/
│   │   ├── tests/
│   │   ├── management/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── permissions.py
│   │   └── exceptions.py
│   │
│   ├── api/                       ← Solo routing (urls.py)
│   │   └── urls.py
│   │
│   ├── scripts/                   ← NUOVO: scripts consolidati
│   │   └── build.sh
│   │
│   ├── manage.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── Procfile
│   ├── render.yaml
│   └── README.md                  ← Solo 1 README
│
├── frontend/
│   ├── app/                       ← Next.js App Router (OK)
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── company/
│   │   │   ├── consultant/
│   │   │   ├── attendance/
│   │   │   └── employee/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                    ← Shadcn/primitivi (OK)
│   │   ├── layout/                ← Navbar, Sidebar, Shell (OK)
│   │   ├── auth/                  ← Auth components (OK)
│   │   ├── dashboard/             ← Dashboard widgets (OK)
│   │   ├── attendance/            ← NUOVO: da root components/
│   │   ├── company/               ← NUOVO: company-card.js, status-badge
│   │   ├── notifications/         ← (OK)
│   │   ├── onboarding/            ← (OK)
│   │   ├── forms/                 ← (OK)
│   │   └── pwa/                   ← (OK)
│   │
│   ├── features/                  ← Solo feature modules complessi
│   │   └── [feature]/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── types/
│   │
│   ├── hooks/                     ← (OK)
│   ├── lib/                       ← api.js, cn.js, auth (OK)
│   ├── types/                     ← TypeScript types (OK)
│   ├── public/
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   ├── next.config.js
│   └── README.md
│
├── docker-compose.yml
├── Makefile
├── .gitignore
├── .dockerignore
└── README.md`;

const MIGRATION_STEPS = [
  {
    step: 1,
    title: "Crea docs/ e sposta tutti i .md dalla root",
    commands: `mkdir -p docs/audit docs/deploy docs/qa docs/reports

# Sposta audit reports
git mv AUDIT_20_FASI_PULSEHR.md docs/audit/
git mv AUDIT_FIXES_26_04.md docs/audit/
git mv AUDIT_REPORT_FASE2_3.md docs/audit/
git mv BLOCKER_FIXES_REPORT_26_04.md docs/audit/
git mv BLOCKER_FIXES_REPORT_FINAL.md docs/audit/
git mv ACCOUNT_ROLES_AND_LINKS_FIX_REPORT.md docs/audit/
git mv CSS_AUDIT_REPORT.md docs/audit/
git mv FASE5_REPORT.md docs/reports/
git mv CHANGELOG.md docs/reports/

# Sposta deploy docs
git mv DEPLOYMENT.md docs/deploy/
git mv DEPLOY_INSTRUCTIONS.md docs/deploy/
git mv DEPLOY_RENDER_VERCEL.md docs/deploy/

# Sposta qa docs
git mv frontend/MANUAL_QA.md docs/qa/
git mv frontend/QA_CHECKLIST.md docs/qa/
git mv frontend/QUICK_START_E2E.md docs/qa/

# Sposta altri
git mv CLOSED_BETA.md docs/
git mv ARCHITECTURE.md docs/`,
    risk: "low"
  },
  {
    step: 2,
    title: "Rinomina backend/backend/ → backend/config/",
    commands: `cd backend
git mv backend config

# Aggiorna manage.py
sed -i 's/backend.settings/config.settings/g' manage.py

# Aggiorna wsgi/asgi
sed -i 's/backend.settings/config.settings/g' config/wsgi.py
sed -i 's/backend.settings/config.settings/g' config/asgi.py

# Aggiorna settings
sed -i "s/ROOT_URLCONF = 'backend.urls'/ROOT_URLCONF = 'config.urls'/g" config/settings.py
sed -i "s/WSGI_APPLICATION = 'backend.wsgi.application'/WSGI_APPLICATION = 'config.wsgi.application'/g" config/settings.py`,
    risk: "medium"
  },
  {
    step: 3,
    title: "Split settings in base/development/production",
    commands: `mkdir -p backend/config/settings
mv backend/config/settings.py backend/config/settings/base.py
touch backend/config/settings/__init__.py

# Crea development.py
cat > backend/config/settings/development.py << 'EOF'
from .base import *
DEBUG = True
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}
EOF

# Crea production.py
cat > backend/config/settings/production.py << 'EOF'
from .base import *
import dj_database_url
DEBUG = False
DATABASES = {'default': dj_database_url.config(conn_max_age=600)}
EOF`,
    risk: "medium"
  },
  {
    step: 4,
    title: "Crea views/ package in backend/users/",
    commands: `cd backend/users
mkdir views
touch views/__init__.py

# Sposta i view files nel package
git mv views.py views/auth.py
git mv dashboard_views.py views/dashboard.py
git mv leave_views.py views/leave.py
git mv analytics_views.py views/analytics.py
git mv automation_views.py views/automation.py
git mv companies_admin_views.py views/companies.py
git mv consultant_advanced_views.py views/consultant.py
git mv geolocation_views.py views/geolocation.py
git mv payroll_views.py views/payroll.py
git mv safety_views.py views/safety.py
git mv document_views.py views/documents.py

# views/__init__.py deve ri-esportare tutto
# per backward compat con urls.py`,
    risk: "high"
  },
  {
    step: 5,
    title: "Crea utils/ package in backend/users/",
    commands: `cd backend/users
mkdir utils
touch utils/__init__.py

git mv email_utils.py utils/email.py
git mv geolocation_utils.py utils/geolocation.py
git mv pricing_utils.py utils/pricing.py
git mv cookie_auth.py utils/cookie_auth.py
git mv automation_service.py utils/automation_service.py

# Aggiorna tutti gli import in views/
grep -r "from .email_utils" . --include="*.py" -l | xargs sed -i 's/from .email_utils/from .utils.email/g'
grep -r "from .pricing_utils" . --include="*.py" -l | xargs sed -i 's/from .pricing_utils/from .utils.pricing/g'`,
    risk: "high"
  },
  {
    step: 6,
    title: "Pulisci frontend/components/ root",
    commands: `cd frontend/components

# Elimina duplicato JS (tieni solo TSX)
git rm auth-guard.js

# Sposta componenti dalla root alle sottocartelle
mkdir -p company attendance
git mv company-card.js company/CompanyCard.tsx
git mv company-status-badge.js company/CompanyStatusBadge.tsx
git mv department-badge.js company/DepartmentBadge.tsx
git mv approval-workflow.jsx attendance/ApprovalWorkflow.tsx
git mv app-shell.js layout/AppShell.tsx

# Elimina .md nella root components
git rm LANGUAGE-SWITCHER-README.md`,
    risk: "medium"
  },
  {
    step: 7,
    title: "Consolida script backend",
    commands: `cd backend
mkdir scripts
git mv setup-local.bat scripts/
git mv setup-local.ps1 scripts/
git mv setup-local.sh scripts/setup-local.sh
# build.sh rimane nella root backend (usato da Render/Railway)

# Elimina Dockerfile.disabled
git rm Dockerfile.disabled

# Consolida README docs backend
git mv README_DEPLOY_RAILWAY.md ../docs/deploy/RAILWAY.md
git mv SETUP_LOCAL.md ../docs/deploy/SETUP_LOCAL.md
git mv LICENZA.txt ../LICENSE`,
    risk: "low"
  },
  {
    step: 8,
    title: "Elimina src/ dal repo (è la app Base44 separata)",
    commands: `# src/ appartiene al workspace Base44, NON a questo repo.
# Va rimossa dal tracking git.

echo "src/" >> .gitignore
git rm -r --cached src/
git commit -m "chore: remove Base44 src/ from repo (belongs to Base44 workspace)"`,
    risk: "low"
  }
];

const severityConfig = {
  critical: { color: "text-red-600", bg: "bg-red-50 border-red-200", label: "CRITICO", icon: XCircle },
  high: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "ALTO", icon: AlertTriangle },
  medium: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "MEDIO", icon: AlertTriangle },
};

const riskConfig = {
  low: { color: "text-green-700 bg-green-100", label: "Rischio BASSO" },
  medium: { color: "text-yellow-700 bg-yellow-100", label: "Rischio MEDIO" },
  high: { color: "text-red-700 bg-red-100", label: "Rischio ALTO — aggiorna import!" },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiato!" : "Copia"}
    </button>
  );
}

function ProblemCard({ p }) {
  const [open, setOpen] = useState(false);
  const cfg = severityConfig[p.severity];
  const Icon = cfg.icon;
  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
      <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setOpen(!open)}>
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.color} border border-current`}>{cfg.label}</span>
            <span className="text-xs font-mono text-slate-500">{p.area}</span>
          </div>
          <p className="font-semibold text-slate-800 mt-1">{p.title}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-current border-opacity-20 pt-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Situazione Attuale</p>
            <p className="text-sm text-slate-700 font-mono bg-white bg-opacity-60 rounded p-2">{p.current}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">✓ Fix</p>
            <p className="text-sm text-green-800 font-semibold">{p.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ s }) {
  const [open, setOpen] = useState(false);
  const risk = riskConfig[s.risk];
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50" onClick={() => setOpen(!open)}>
        <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          {s.step}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">{s.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${risk.color}`}>{risk.label}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
            <span className="text-xs text-slate-400 font-mono">bash</span>
            <CopyButton text={s.commands} />
          </div>
          <pre className="bg-slate-900 text-green-400 text-xs p-4 overflow-x-auto leading-relaxed">{s.commands}</pre>
        </div>
      )}
    </div>
  );
}

export default function StructureAudit() {
  const [tab, setTab] = useState("problems");
  const critical = PROBLEMS.filter(p => p.severity === "critical").length;
  const high = PROBLEMS.filter(p => p.severity === "high").length;
  const medium = PROBLEMS.filter(p => p.severity === "medium").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Folder className="w-7 h-7 text-yellow-400" />
            <h1 className="text-2xl font-bold">Analisi Struttura Repository</h1>
          </div>
          <p className="text-slate-400">pulse2.0 — Audit completo + Piano di riorganizzazione</p>
          <div className="flex gap-4 mt-4">
            <div className="bg-red-900 border border-red-700 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-red-300">{critical}</div>
              <div className="text-xs text-red-400">Critici</div>
            </div>
            <div className="bg-orange-900 border border-orange-700 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-orange-300">{high}</div>
              <div className="text-xs text-orange-400">Alti</div>
            </div>
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-yellow-300">{medium}</div>
              <div className="text-xs text-yellow-400">Medi</div>
            </div>
            <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-slate-300">{MIGRATION_STEPS.length}</div>
              <div className="text-xs text-slate-400">Step fix</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 flex gap-0">
          {[
            { id: "problems", label: "🔴 Problemi" },
            { id: "structure", label: "🗂 Struttura Target" },
            { id: "steps", label: "🛠 Passi di Fix" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Problems Tab */}
        {tab === "problems" && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Il repo ha <strong>3 mondi sovrapposti</strong>: src/ (Base44), frontend/ (Next.js), backend/ (Django) — tutti alla stessa profondità senza separazione logica. 
                In più 20+ file .md di audit sparsi ovunque. Questo va risolto prima di qualsiasi deployment.
              </p>
            </div>
            {PROBLEMS.map((p, i) => <ProblemCard key={i} p={p} />)}
          </div>
        )}

        {/* Structure Tab */}
        {tab === "structure" && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 font-medium">
                ✅ Struttura finale target dopo la riorganizzazione. Ogni file ha il suo posto logico e inequivocabile.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm font-mono">pulse2.0/ — struttura target</span>
                <CopyButton text={TARGET_STRUCTURE} />
              </div>
              <pre className="text-green-300 text-xs p-6 overflow-x-auto leading-relaxed whitespace-pre">{TARGET_STRUCTURE}</pre>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-800 mb-2">📁 Regole Backend</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-xs bg-slate-100 px-1 rounded">config/</code> al posto di <code className="text-xs bg-slate-100 px-1 rounded">backend/backend/</code></li>
                  <li>• settings split in base/dev/prod</li>
                  <li>• <code className="text-xs bg-slate-100 px-1 rounded">views/</code> package, non file piatti</li>
                  <li>• <code className="text-xs bg-slate-100 px-1 rounded">utils/</code> separato da business logic</li>
                  <li>• 1 solo README in backend/</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-800 mb-2">📁 Regole Frontend</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Solo <code className="text-xs bg-slate-100 px-1 rounded">.tsx</code> — niente .js/.jsx mix</li>
                  <li>• Componenti in sottocartelle per dominio</li>
                  <li>• No .md dentro <code className="text-xs bg-slate-100 px-1 rounded">components/</code></li>
                  <li>• Route groups con <code className="text-xs bg-slate-100 px-1 rounded">(auth)/</code> e <code className="text-xs bg-slate-100 px-1 rounded">(dashboard)/</code></li>
                  <li>• 1 solo auth-guard (TSX)</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-800 mb-2">📁 Regole Root</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Solo <code className="text-xs bg-slate-100 px-1 rounded">backend/</code>, <code className="text-xs bg-slate-100 px-1 rounded">frontend/</code>, <code className="text-xs bg-slate-100 px-1 rounded">docs/</code>, <code className="text-xs bg-slate-100 px-1 rounded">.github/</code></li>
                  <li>• <code className="text-xs bg-slate-100 px-1 rounded">src/</code> rimosso (è Base44)</li>
                  <li>• Tutti i .md → <code className="text-xs bg-slate-100 px-1 rounded">docs/</code></li>
                  <li>• 1 <code className="text-xs bg-slate-100 px-1 rounded">docker-compose.yml</code> in root</li>
                  <li>• 1 <code className="text-xs bg-slate-100 px-1 rounded">Makefile</code> in root</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Steps Tab */}
        {tab === "steps" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium">
                🛠 Esegui gli step <strong>nell'ordine indicato</strong>. Gli step 1, 7, 8 sono sicuri. 
                Gli step 4 e 5 (views/ e utils/ refactoring) richiedono di aggiornare tutti gli import — testa sempre con <code className="bg-blue-100 px-1 rounded">python manage.py check</code> dopo ogni step.
              </p>
            </div>
            {MIGRATION_STEPS.map(s => <StepCard key={s.step} s={s} />)}
            
            <div className="bg-slate-800 text-white rounded-xl p-6 mt-6">
              <h3 className="font-bold text-lg mb-3">✅ Verifica Finale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-2 font-mono">Backend</p>
                  <pre className="text-green-400 text-xs leading-relaxed">{`cd backend
python manage.py check --deploy
python manage.py test
python manage.py migrate --run-syncdb`}</pre>
                </div>
                <div>
                  <p className="text-slate-400 mb-2 font-mono">Frontend</p>
                  <pre className="text-green-400 text-xs leading-relaxed">{`cd frontend
npm run lint
npm run type-check
npm run build`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}