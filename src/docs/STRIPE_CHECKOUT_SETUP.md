# Stripe Checkout Setup - AldevionHR

**Document**: `docs/STRIPE_CHECKOUT_SETUP.md`  
**Date**: 2026-05-01  
**Status**: Production Ready ✅

---

## 🎯 Overview

Modulo checkout Stripe integrato nella SubscriptionPage con:
- ✅ Modal checkout inline
- ✅ Session ID tracking per audit/compliance
- ✅ Addons personalizzazione
- ✅ Error handling robusto
- ✅ Success/cancelled feedback
- ✅ Metadata tracking

---

## 📋 Components & Functions

### Frontend Components

#### 1. `components/checkout/StripeCheckoutModal.jsx`
**Modale checkout inline**
- Selezione piano + addons
- Preview prezzo finale
- Checkout con session tracking
- iframe detection (sicurezza)
- Loading state + error handling

**Props**:
```jsx
<StripeCheckoutModal
  plan={planObject}        // Piano selezionato
  isOpen={boolean}         // Visibilità modale
  onClose={function}       // Callback chiusura
  billingInterval="monthly" // 'monthly' | 'yearly'
  user={userObject}        // Oggetto utente Base44
/>
```

#### 2. `components/checkout/StripeCheckoutSuccess.jsx`
**Pagina fallback post-checkout**
- Visualizza status (success/cancelled/error)
- Session ID per tracking
- Dettagli abbonamento
- Opzioni prossimi step

### Backend Functions

#### 3. `functions/stripeCheckoutSession.js`
**Crea sessione Stripe con tracking**

**Input**:
```javascript
{
  price_id: string,              // Stripe price ID
  plan_id: string,               // DB plan ID
  plan_name: string,             // Piano name
  billing_interval: 'monthly|yearly',
  selected_addons: array,        // Addons selezionati
  company_id: string,            // Company ID
  total_amount: number,          // Importo in cents
}
```

**Output**:
```javascript
{
  success: true,
  session_id: string,            // Stripe session ID
  checkout_session_id: string,   // ID tracking interno
  url: string,                   // URL checkout Stripe
  metadata: {
    plan_name: string,
    total_amount: number,
    billing_interval: string,
    addons_count: number,
  }
}
```

**Features**:
- Crea sessione Stripe con metadata completa
- Salva session_id in localStorage per tracking
- Crea audit log della transazione
- Validazione utente autenticato
- Error handling Stripe-specific
- CORS validation

---

## 🔧 Configuration

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...     # Secret key (backend)
STRIPE_PUBLISHABLE_KEY=pk_test_...# Public key (frontend, in manifest)
BASE44_APP_ID=app_xxx             # App ID (già configurato)
```

### Database Setup

**SubscriptionPage prerequisites**:
```javascript
// Entity: SubscriptionPlan (deve avere)
{
  id: string,
  name: string,
  description: string,
  price_monthly: number,
  price_yearly: number,
  max_employees: number,
  features: array,
  is_popular: boolean,
  is_active: boolean,
  stripe_price_id: string,        // REQUIRED
  color: string,                  // Per styling badge
  sort_order: number,
}

// Entity: SubscriptionAddon (opzionale)
{
  id: string,
  name: string,
  base_price: number,
  unit_label: string,
  max_quantity: number,
  is_active: boolean,
  sort_order: number,
}
```

### Stripe Dashboard Setup

1. **Create Products** (Dashboard > Products)
   - Startup Plan: €29/month or €290/year
   - Professional Plan: €79/month or €790/year
   - Enterprise Plan: €199/month or €1990/year

2. **Create Prices**
   - Add monthly + yearly pricing
   - Copy price IDs to database

3. **Webhook Endpoints** (Settings > Webhooks)
   - Add endpoint: `/functions/stripeWebhook`
   - Subscribe to events:
     - `checkout.session.completed`
     - `invoice.paid`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

---

## 🚀 Usage

### Basic Flow

1. **User views subscription page**
```jsx
// /dashboard/company/subscription
import SubscriptionPage from '@/pages/company/SubscriptionPage';
```

2. **User selects plan**
   - Click "Inizia ora" button
   - Modal opens with plan details

3. **User customizes (optional)**
   - Add addons (storage, users, etc)
   - See price update in real-time

4. **User clicks "Procedi al pagamento"**
   - Session created via `stripeCheckoutSession`
   - Session ID saved to localStorage
   - Redirects to Stripe Checkout

5. **After Stripe checkout**
   - Success: Redirect to `/dashboard/company/subscription?status=success&session_id=...`
   - Cancelled: Redirect to `/dashboard/company/subscription?status=cancelled`
   - Component shows appropriate feedback

---

## 🔐 Security

### iframe Detection
```javascript
// Prevents checkout in iframe (mobile webviews, etc)
if (window.self !== window.top) {
  toast.error("Checkout available only from published app");
  return;
}
```

### Metadata Tracking
**Session_id saved in multiple places**:

1. **localStorage** (client):
   ```javascript
   localStorage.setItem('stripe_session_id', session.id);
   localStorage.setItem('stripe_checkout_time', new Date().toISOString());
   ```

2. **Stripe metadata**:
   ```javascript
   metadata: {
     base44_app_id: Deno.env.get('BASE44_APP_ID'),
     session_id: sessionId,
     plan_id,
     company_id,
     user_email,
     total_amount,
     created_at,
   }
   ```

3. **Audit Log** (database):
   ```javascript
   await createAuditLog({
     action: 'checkout_session_created',
     entity_type: 'subscription',
     entity_id: sessionId,
     details: { stripe_session_id, plan_name, total_amount }
   });
   ```

### CORS Validation
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://app.aldevionhr.com',
];
// Request rejected if origin not whitelisted
```

---

## 📊 Tracking & Analytics

### Session ID Tracking
**Used for**:
- Audit trail (who paid, when, what)
- Compliance (GDPR, contractual)
- Refund disputes (linking payment to subscription)
- Analytics (conversion funnel)

### Data Points Tracked
```javascript
{
  session_id: string,            // Unique per checkout
  stripe_session_id: string,     // Stripe's ID
  company_id: string,
  user_email: string,
  plan_id: string,
  plan_name: string,
  total_amount: number,
  billing_interval: string,
  selected_addons: array,
  created_at: ISO8601,
  status: 'initiated|completed|failed',
}
```

---

## 🐛 Troubleshooting

### Checkout won't open
**Symptom**: Modal appears but click does nothing

**Solutions**:
1. Check console for errors
2. Verify STRIPE_PUBLISHABLE_KEY in env
3. Verify plan has `stripe_price_id`
4. Check iframe detection (mobile apps)

### Session ID not saved
**Symptom**: No tracking in localStorage

**Solutions**:
1. Check browser DevTools > Application > localStorage
2. Verify `stripeCheckoutSession` function completes successfully
3. Check browser console for errors

### Stripe returns 400 error
**Symptom**: "Invalid request to Stripe"

**Solutions**:
1. Verify price_id is valid
2. Verify Stripe keys are correct
3. Check Stripe Dashboard for recent changes
4. Verify plan status is active in Stripe

### Post-checkout not loading
**Symptom**: Redirected but page shows loading forever

**Solutions**:
1. Check network tab for failed requests
2. Verify success_url is correct
3. Verify subscription was created in database
4. Check Base44 function logs

---

## 📈 Testing

### Test Cards (Stripe Sandbox)
```
Successful payment:  4242 4242 4242 4242
Requires auth:       4000 0025 0000 3155
Declined:            4000 0000 0000 0002
```

### Test Flow
1. Go to `/dashboard/company/subscription`
2. Click "Inizia ora" on any plan
3. Modal opens with checkout form
4. Click "Procedi al pagamento"
5. Modal closes, redirected to Stripe
6. Use test card `4242 4242 4242 4242`
7. Fill in test data (any future date, any CVV)
8. Complete payment
9. Redirect to success page with session ID

### Verify Tracking
```javascript
// Browser console
console.log(localStorage.getItem('stripe_session_id'));
// Should show: checkout_1234567890_abc123def456
```

---

## 🔄 Webhook Handling

**Stripe sends webhooks to**: `/functions/stripeWebhook`

**Events handled**:
- `checkout.session.completed`: Update CompanySubscription
- `customer.subscription.updated`: Update billing info
- `customer.subscription.deleted`: Mark subscription as cancelled
- `invoice.paid`: Update payment status

---

## 📋 Checklist

- [ ] Stripe account created and keys configured
- [ ] SubscriptionPlan entity has stripe_price_id
- [ ] SubscriptionAddon entity created (optional)
- [ ] stripeCheckoutSession function deployed
- [ ] StripeCheckoutModal component renders
- [ ] Test checkout with sandbox card
- [ ] Verify session_id in localStorage
- [ ] Verify audit log created
- [ ] Test success/cancelled redirects
- [ ] Configure Stripe webhooks
- [ ] Test webhook delivery

---

## 📞 Support

**Questions about Stripe setup?**
- Check `functions/stripeCheckoutSession.js` (well-commented)
- Check `components/checkout/StripeCheckoutModal.jsx` (well-commented)
- Review Stripe docs: https://docs.stripe.com/checkout

**Having issues?**
1. Check browser console for errors
2. Check `functions/` logs in Base44 dashboard
3. Check Stripe Dashboard > Events for webhook history
4. Verify environment variables are set

---

**Status**: Production Ready ✅  
**Last Updated**: 2026-05-01  
**Version**: 1.0.0