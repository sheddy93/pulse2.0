# PulseHR Onboarding System

Sistema di onboarding professionale con flussi guidati per PulseHR.

## 📁 Struttura File

```
app/
  onboarding/
    page.jsx                    # Main onboarding page

components/
  onboarding/
    onboarding-wizard.jsx       # Wizard container component
    role-flows.jsx              # Role-specific flow definitions
    empty-states.jsx            # Empty state components
    loading-states.jsx          # Loading skeletons
    README.md                   # This file
```

## 🎯 Funzionalità Principali

### Onboarding Wizard
- **Full-screen immersive experience** con effetti glass-morphism
- **Barra di progresso** in tempo reale
- **Navigazione con tastiera** (ESC per chiudere, Enter per continuare)
- **Auto-save** automatico dei progressi
- **Step indicator** con navigazione clickable
- **Responsive design** per desktop e mobile

### Role-Specific Flows

#### 👤 Employee (Dipendente)
1. Welcome + Profile setup
2. Contatti emergenza
3. Dati bancari
4. Preferenze notifiche
5. Completamento

#### 🏢 Company Admin (Amministratore Azienda)
1. Welcome + Conferma azienda
2. Logo aziendale
3. Configurazione orario lavoro
4. Invita dipendenti
5. Setup reparti
6. Impostazioni buste paga
7. Revisione e completamento

#### 💼 Consultant (Consulente)
1. Welcome + Specializzazioni
2. Collega aziende clienti
3. Importa dati esistenti
4. Preferenze notifiche
5. Completamento

#### ⚙️ Platform Admin
1. Configurazione sistema
2. Piani tariffari
3. Template email
4. Revisione integrazioni
5. Completamento

## 🚀 Utilizzo

### Pagina Principale (page.jsx)

```jsx
import { OnboardingPage } from '@/app/onboarding/page';

// La pagina gestisce automaticamente:
// - Rilevamento ruolo utente
// - Caricamento flusso appropriato
// - Salvataggio progressi
// - Redirect al completamento
```

### Wizard Component

```jsx
import OnboardingWizard from '@/components/onboarding/onboarding-wizard';
import { employeeFlow } from '@/components/onboarding/role-flows';

function MyOnboarding() {
  const handleComplete = async (data) => {
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    router.push('/dashboard');
  };

  const handleSave = async (data) => {
    await fetch('/api/onboarding/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <OnboardingWizard
      flow={employeeFlow}
      initialStep={0}
      onComplete={handleComplete}
      onSave={handleSave}
      userData={userData}
      autoSave={true}
    />
  );
}
```

### Custom Hook

```jsx
import { useOnboardingWizard } from '@/components/onboarding/onboarding-wizard';

function MyComponent() {
  const {
    isOpen,
    openWizard,
    closeWizard,
    handleComplete,
    handleSave,
  } = useOnboardingWizard(employeeFlow, {
    initialOpen: false,
    onComplete: async (data) => {
      // Handle completion
    },
    onSave: async (data) => {
      // Handle save
    },
  });

  return (
    <button onClick={openWizard}>
      Start Onboarding
    </button>
  );
}
```

## 🎨 Loading States

```jsx
import {
  ProfileSetupLoading,
  CompanySetupLoading,
  EmployeeListLoading,
  OnboardingPageLoading,
  InlineLoading,
} from '@/components/onboarding/loading-states';

// Full page loading
<OnboardingPageLoading message="Caricamento in corso..." />

// Form loading
<ProfileSetupLoading />
<CompanySetupLoading />

// List loading
<EmployeeListLoading count={3} />

// Inline loading
<InlineLoading text="Salvataggio..." />
```

## 📭 Empty States

```jsx
import {
  NoEmployeesEmptyState,
  NoCompaniesEmptyState,
  NoProjectsEmptyState,
  SetupCompleteEmptyState,
} from '@/components/onboarding/empty-states';

// No employees
<NoEmployeesEmptyState
  onAddEmployee={() => {}}
  onImport={() => {}}
/>

// No companies
<NoCompaniesEmptyState
  onAddCompany={() => {}}
  onConnectCompany={() => {}}
/>

// Setup complete
<SetupCompleteEmptyState
  onGoToDashboard={() => router.push('/dashboard')}
  userName="Mario"
/>
```

## 🔧 Personalizzazione

### Creare un Nuovo Flow

```jsx
export const customFlow = {
  role: "custom_role",
  steps: [
    {
      id: "welcome",
      label: "Benvenuto",
      icon: User,
      component: WelcomeStep,
    },
    {
      id: "setup",
      label: "Configurazione",
      icon: Settings,
      component: SetupStep,
    },
    // ... altri step
  ],
};
```

### Creare un Nuovo Step Component

```jsx
function CustomStep({ 
  onNext, 
  onPrevious, 
  onSkip, 
  onSave,
  stepData,
  isFirstStep,
  isLastStep 
}) {
  const handleSubmit = (data) => {
    onSave(data); // Save step data
    onNext(); // Go to next step
  };

  return (
    <div className="space-y-6">
      {/* Your step content */}
      
      <div className="flex justify-between pt-4">
        {!isFirstStep && (
          <Button onClick={onPrevious} variant="outline">
            Indietro
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button onClick={onSkip} variant="ghost">
            Salta
          </Button>
          <Button onClick={() => handleSubmit(data)}>
            {isLastStep ? 'Completa' : 'Continua'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 Design System

### Colori e Gradienti
- **Primary**: Violet-Indigo gradient (`from-violet-600 to-indigo-600`)
- **Glass Effect**: Backdrop blur con bordi semi-trasparenti
- **Shadows**: Soft shadows per elevazione

### Animazioni
- **Shimmer**: Loading skeleton animation
- **Blob**: Background floating animation
- **Bounce**: Progress dots animation
- **Fade In/Out**: Smooth transitions

### Breakpoints
- **Mobile**: < 768px (compact vertical layout)
- **Desktop**: ≥ 768px (full horizontal stepper)

## 🔌 Integrazione API

### Endpoints Richiesti

```javascript
// GET user profile and role
GET /api/user/profile
Response: {
  id: string,
  role: 'employee' | 'company_admin' | 'consultant' | 'platform_admin',
  onboardingCompleted: boolean,
  onboardingProgress: object | null,
}

// POST save progress
POST /api/user/onboarding/save
Body: {
  userId: string,
  progress: object,
}

// POST complete onboarding
POST /api/user/onboarding/complete
Body: {
  userId: string,
  completedData: object,
}
```

## ⌨️ Keyboard Shortcuts

- **ESC**: Chiudi wizard (con conferma se ci sono modifiche)
- **Enter**: Vai al prossimo step (non attivo in campi input)
- **Tab**: Navigazione tra elementi
- **Click**: Torna a step precedenti completati

## 📱 Responsive Features

### Mobile
- Progress bar compatta
- Step indicator verticale semplificato
- Navigation hints in basso
- Touch-optimized buttons

### Desktop
- Full step indicator orizzontale
- Keyboard shortcuts abilitati
- Hover states avanzati
- Larger content area

## 🎯 Best Practices

1. **Always save progress** - Usa auto-save per evitare perdita dati
2. **Validate before next** - Valida i dati prima di procedere
3. **Clear error messages** - Mostra errori chiari e actionable
4. **Skip non-critical steps** - Permetti skip per step opzionali
5. **Show progress clearly** - Utente deve sempre sapere dove si trova
6. **Optimize for performance** - Lazy load components pesanti
7. **Test all flows** - Testa ogni ruolo e percorso

## 🐛 Troubleshooting

### Wizard non si apre
- Verifica che il `flow` prop sia definito correttamente
- Controlla che `steps` array non sia vuoto

### Auto-save non funziona
- Verifica che `onSave` callback sia definito
- Controlla `autoSave={true}` prop
- Verifica chiamate API in console

### Step components non si renderizzano
- Assicurati che ogni step abbia una proprietà `component`
- Verifica import dei component

### Stili non applicati
- Verifica che Tailwind config includa le animazioni
- Controlla che globals.css abbia le animation delays

## 📄 License

Proprietà di PulseHR. Tutti i diritti riservati.
