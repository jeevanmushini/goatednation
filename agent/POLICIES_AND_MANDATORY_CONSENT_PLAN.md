# GOATED NATION — Legal Policies & Mandatory Consent Architecture Plan
## Statutory Policy Synchronization & Registration Click-Wrap Consent Enforcement

> **Document Purpose:** Engineering implementation specification for:
> 1. Deploying and synchronizing all statutory policy documents in `agent/policies/` into live Next.js App Router routes (`/policies/*`) and updating `ZeninFooter.tsx`.
> 2. Enforcing a **mandatory statutory acceptance checkbox / radio selector** during account creation on `/register` (under the **Indian DPDP Act 2023** and **Indian Contract Act 1872**), without which sign-up is strictly prohibited.

---

## 1. System Architecture & Consent Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION CLICK-WRAP CONSENT PIPELINE                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│ 1. VISITOR ARRIVES AT /register                                                        │
│    • Fills in Name, Email, Password, Confirm Password                                  │
│                                                                                        │
│ 2. MANDATORY POLICY ACCEPTANCE SELECTOR (DPDP Act 2023 §6 Compliance)                  │
│    ┌──────────────────────────────────────────────────────────────────────────────┐    │
│    │ [x] I have read and agree to GOATED NATION's Terms of Service, Privacy       │    │
│    │     Policy, and Refund Policy.                                               │    │
│    └──────────────────────────────────────────────────────────────────────────────┘    │
│    • Interactive links open in new tabs to /policies/terms-of-service, etc.           │
│                                                                                        │
│ 3. DUAL-LAYER ENFORCEMENT ENGINE                                                       │
│    ┌──────────────────────────────┐          ┌──────────────────────────────────┐      │
│    │ Client-Side Enforcement      │          │ Server-Side Enforcement          │      │
│    │ • Button disabled if false   │   ───►   │ • POST /api/auth/register        │      │
│    │ • Displays inline validation │          │ • If agreedToTerms !== true:     │      │
│    │   error if bypassed          │          │   Reject with 400 Bad Request    │      │
│    └──────────────────────────────┘          └──────────────────────────────────┘      │
│                                                                                        │
│ 4. STATUTORY POLICY ARCHIVE HUB (/policies/*)                                          │
│    • Dedicated brutalist layout with sticky sidebar and print support                  │
│    • Connected directly from all ZeninFooter legal links (replaces /about)             │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Policy Route Deployment & Footer Synchronization

### 2.1 Route Architecture
Deploy the markdown policies from `agent/policies/` into Next.js App Router dynamic or static routes:

```
src/app/
├── policies/
│   ├── layout.tsx                     # Shared brutalist legal layout (sidebar, print action, back button)
│   ├── privacy-policy/page.tsx        # DPDP Act 2023 Compliant Privacy Policy
│   ├── terms-of-service/page.tsx      # Terms of Service & Conditions of Sale
│   ├── refund-and-exchange/page.tsx   # 7-Day Sizing Exchange & Shiprocket Return Policy
│   ├── shipping-and-delivery/page.tsx # Pan-India SLAs, Courier Partners & NDR Protocol
│   ├── grievance-redressal/page.tsx   # Mandatory Rule 4 & 5 Grievance Officer Disclosures
│   └── legal-metrology/page.tsx       # Apparel HSN, Net Quantity (1 N) & Packaging Registry
```

### 2.2 Updating `ZeninFooter.tsx`
In [src/components/zenin/ZeninFooter.tsx](file:///c:/Users/Sri%20Sri%20Gana/Desktop/Projects/goatednation/src/components/zenin/ZeninFooter.tsx), replace all placeholder `/about` links with their corresponding dedicated URLs:

```diff
--- a/src/components/zenin/ZeninFooter.tsx
+++ b/src/components/zenin/ZeninFooter.tsx
@@ -101,23 +101,23 @@ export const ZeninFooter: React.FC = () => {
         <div className="pt-6 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#888888] gap-4">
           <div>&copy; {new Date().getFullYear()} GOATED NATION. All rights reserved.</div>
           <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
-            <Link href="/about" className="hover:text-white transition-colors">
+            <Link href="/policies/refund-and-exchange" className="hover:text-white transition-colors">
               Refund policy
             </Link>
             <span>&bull;</span>
-            <Link href="/about" className="hover:text-white transition-colors">
+            <Link href="/policies/privacy-policy" className="hover:text-white transition-colors">
               Privacy policy
             </Link>
             <span>&bull;</span>
-            <Link href="/about" className="hover:text-white transition-colors">
+            <Link href="/policies/terms-of-service" className="hover:text-white transition-colors">
               Terms of service
             </Link>
             <span>&bull;</span>
-            <Link href="/about" className="hover:text-white transition-colors">
+            <Link href="/policies/shipping-and-delivery" className="hover:text-white transition-colors">
               Shipping policy
             </Link>
             <span>&bull;</span>
-            <Link href="/about" className="hover:text-white transition-colors">
-              Contact information
+            <Link href="/policies/grievance-redressal" className="hover:text-white transition-colors">
+              Grievance & Legal
             </Link>
```

---

## 3. Mandatory Acceptance Checkbox on `/register`

### 3.1 Statutory Legal Requirement
- **Under Section 6 of the DPDP Act 2023:** Consent must be *free, specific, informed, unconditional, and unambiguous with clear affirmative action*. Pre-ticked boxes are illegal; the user must actively check the box.
- **Under the Indian Contract Act 1872:** Click-wrap terms require an affirmative gesture signifying mutual assent.

---

### 3.2 Exact Frontend Implementation (`src/app/register/page.tsx`)

#### State & Handlers:
```typescript
// Inside RegisterForm component in src/app/register/page.tsx:
const [agreedToPolicies, setAgreedToPolicies] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  // 1. Mandatory Consent Check
  if (!agreedToPolicies) {
    setError('You must accept the Terms of Service, Privacy Policy, and Refund Policy to create an account.');
    return;
  }

  // 2. Existing password checks...
  if (password !== confirmPassword) {
    setError('Passwords do not match. Please verify.');
    return;
  }

  setIsSubmitting(true);
  const res = await register({
    name,
    email,
    password,
    agreedToTerms: true,
  });
  setIsSubmitting(false);
  // ...
};
```

#### UI Checkbox / Radio Selector (Placed directly before the Submit Button):
```tsx
{/* Mandatory Statutory Policies Acceptance Checkbox (DPDP Act 2023 Compliant) */}
<div className="pt-1 pb-1">
  <label className="flex items-start space-x-2.5 cursor-pointer group select-none">
    <div className="relative flex items-center justify-center mt-0.5">
      <input
        type="checkbox"
        required
        checked={agreedToPolicies}
        onChange={(e) => setAgreedToPolicies(e.target.checked)}
        className="w-4 h-4 rounded border-[#DCDCDC] text-black focus:ring-0 focus:ring-offset-0 accent-black cursor-pointer transition-all"
      />
    </div>
    <span className="text-[11px] font-mono text-[#555555] group-hover:text-black transition-colors leading-relaxed">
      I have read and agree to GOATED NATION&apos;s{' '}
      <Link
        href="/policies/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-black underline underline-offset-2 hover:text-[#FF4D00] transition-colors"
      >
        Terms of Service
      </Link>
      ,{' '}
      <Link
        href="/policies/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-black underline underline-offset-2 hover:text-[#FF4D00] transition-colors"
      >
        Privacy Policy
      </Link>
      , and{' '}
      <Link
        href="/policies/refund-and-exchange"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-black underline underline-offset-2 hover:text-[#FF4D00] transition-colors"
      >
        Refund Policy
      </Link>
      .
    </span>
  </label>
</div>

{/* Submit Button */}
<button
  type="submit"
  disabled={isSubmitting || !agreedToPolicies}
  className="w-full mt-2 py-3 px-4 rounded-lg bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
>
  <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER / 新規登録'}</span>
  <ArrowRight className="w-4 h-4" />
</button>
```

#### Social Sign-Up Consent Micro-Copy (Under Google Button):
```tsx
<p className="text-[10px] font-mono text-[#888888] text-center mt-2 leading-tight">
  By continuing with Google, you agree to GOATED NATION&apos;s{' '}
  <Link href="/policies/terms-of-service" target="_blank" className="underline hover:text-black">Terms</Link> &{' '}
  <Link href="/policies/privacy-policy" target="_blank" className="underline hover:text-black">Privacy Policy</Link>.
</p>
```

---

## 4. Backend Route Enforcement (`src/app/api/auth/register/route.ts`)

To ensure that malicious callers or automated bots cannot bypass the frontend checkbox:

```typescript
// Inside POST in src/app/api/auth/register/route.ts:
const body = await req.json();
const { name, email, password, agreedToTerms } = body;

// Enforce Affirmative Statutory Consent
if (agreedToTerms !== true) {
  return NextResponse.json(
    {
      success: false,
      error: 'Affirmative acceptance of the Terms of Service and Privacy Policy is required under the DPDP Act 2023.',
    },
    { status: 400 }
  );
}

// Proceed with user creation...
```

---

## 5. Verification & Testing Matrix

| Test Case | Scenario Tested | Expected Assertion |
| :--- | :--- | :--- |
| **TC-CONSENT-01** | User visits `/register` | Checkbox is un-checked by default. "Register" button is visually disabled (`opacity-40`). |
| **TC-CONSENT-02** | User attempts form submission without checking the box | Form does not submit; inline error triggers: *"You must accept the Terms of Service..."*. |
| **TC-CONSENT-03** | User clicks "Terms of Service" or "Privacy Policy" links | Links open in a separate tab to the compliant policy page without losing form state. |
| **TC-CONSENT-04** | User checks the box | Submit button immediately becomes enabled and active. |
| **TC-CONSENT-05** | API request sent to `POST /api/auth/register` with `agreedToTerms: false` or omitted | Server rejects with HTTP `400 Bad Request` and compliance error message. |
| **TC-CONSENT-06** | Footer links clicked on any storefront page | Footer links navigate to `/policies/refund-and-exchange`, `/policies/privacy-policy`, etc. with 200 OK. |

---

## 6. Execution Directives for the Implementing Agent

1. **Step 1:** Build the shared layout `src/app/policies/layout.tsx` and the 6 page components under `src/app/policies/*` rendering the legal texts from `agent/policies/`.
2. **Step 2:** Update [src/components/zenin/ZeninFooter.tsx](file:///c:/Users/Sri%20Sri%20Gana/Desktop/Projects/goatednation/src/components/zenin/ZeninFooter.tsx) with the new policy links.
3. **Step 3:** Add the mandatory policy acceptance checkbox to `src/app/register/page.tsx` and disable the button when unchecked.
4. **Step 4:** Add backend consent validation in `src/app/api/auth/register/route.ts`.
5. **Step 5:** Run `npx tsc --noEmit` and verify all tests pass.
