# LogiHR – Supabase & Enterprise ESS Setup Guide
**LogiBrisk Technologies · Timezone: Asia/Kolkata (IST, UTC+05:30)**

This documentation outlines the complete database schema, security definer transactional functions, Row Level Security (RLS) policies, Edge Functions deployment, Capacitor native build instructions, and the Go-Live readiness checklist.

---

## 1. Supabase Project Setup & Environment Variables

### Client-Side Environment Variables (.env)
```ini
# Supabase Public Configuration (Safe for client bundle)
VITE_SUPABASE_URL="https://<YOUR-PROJECT-REF>.supabase.co"
VITE_SUPABASE_ANON_KEY="<YOUR-ANON-PUBLIC-KEY>"

# Kiosk & Demo Flags
VITE_DEMO_MODE="false" # Set to "true" only in test/sandbox environments
```

### Server-Side Secrets (Supabase Vault / Express .env)
```ini
# Authoritative server secrets (NEVER exposed to frontend bundle)
SUPABASE_SERVICE_ROLE_KEY="<YOUR-SERVICE-ROLE-SECRET>"
GEMINI_API_KEY="<YOUR-GEMINI-API-KEY>"
KIOSK_ADMIN_PIN="9941" # Hashed / configured on server only
```

---

## 2. Database Migrations Order

Apply migrations in sequence in the Supabase SQL Editor:

1. **`supabase/migrations/001_schema.sql`**:
   - Creates `employees`, `devices`, `geofence_sites`, `punches`, `leave_balances`, `leave_requests`, `holidays`.
   - Seeds initial geofence sites (Surat HQ, Ahmedabad Tech Hub, Mumbai Client Site) and 2026 Gazetted Holidays.

2. **`supabase/migrations/002_approvals_timesheet_regularization_payslips.sql`**:
   - Creates `regularizations`, `timesheets`, `timesheet_rows`, and `payslips` tables.
   - Creates `is_manager_of` and `get_current_employee_id` security definer helper functions.
   - Configures comprehensive RLS policies on all operational tables.
   - Deploys transactional security definer functions:
     - `approve_leave_request`: Transactionally validates manager relationship, prevents self-approval, updates request status to `APPROVED`, and deducts `leave_balances.used` with row-locking (`for update`).
     - `reject_leave_request`: Validates and marks rejected with manager feedback.
     - `approve_regularization` & `reject_regularization`: Validates and marks regularization with anti-self-approval rule.
     - `approve_timesheet` & `reject_timesheet`: Validates and marks submitted timesheet.

3. **`supabase/migrations/003_consent_and_rls_functions.sql`**:
   - Adds DPDP Act 2023 consent tracking (`consent_given_at`, `consent_version`) on `employees`.
   - Creates immutable audit log table `consent_logs`.
   - Deploys `record_employee_consent` transactional RPC.

---

## 3. Row Level Security (RLS) Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| **`employees`** | Authenticated users (own profile & colleagues for directory/manager lookup) | Service Role only | Own profile (limited) or HR Admin | Service Role only |
| **`punches`** | Own punches (`employee_id = get_current_employee_id()`) OR Manager (`is_manager_of`) | Service Role / Edge Function only (Authoritative server timestamped) | Forbidden | Forbidden |
| **`leave_requests`** | Own rows OR Manager (`is_manager_of`) | Own rows (`employee_id = get_current_employee_id()`) | Own pending rows (for cancellation only) | Forbidden |
| **`leave_balances`** | Own balances OR Manager (`is_manager_of`) | Service Role only | Via `approve_leave_request` RPC only | Forbidden |
| **`regularizations`**| Own rows OR Manager (`is_manager_of`) | Own rows (`employee_id = get_current_employee_id()`) | Via approval RPC functions only | Forbidden |
| **`timesheets`** | Own rows OR Manager (`is_manager_of`) | Own rows | Own `DRAFT` or `REJECTED` rows only | Forbidden |
| **`timesheet_rows`** | Own rows OR Manager (`is_manager_of`) | Own rows for draft/rejected timesheets | Own rows for draft/rejected timesheets | Own rows for draft/rejected timesheets |
| **`payslips`** | Strictly Own rows (`employee_id = get_current_employee_id()`) | Service Role / Payroll Engine only | Service Role only | Service Role only |
| **`consent_logs`** | Own audit logs OR HR Admin | Via `record_employee_consent` RPC only | Forbidden (Immutable) | Forbidden |

---

## 4. Supabase Edge Functions Deployment

Deploy edge functions via the Supabase CLI:

```bash
# 1. Authoritative IST server time endpoint
supabase functions deploy time --no-verify-jwt

# 2. Tamper-Proof Attendance Punch (evaluates geofence & stamps server time)
supabase functions deploy punch

# 3. Kiosk Admin PIN verification
supabase functions deploy kiosk-pin

# 4. Server-Side Gemini AI Assistant
supabase functions deploy assistant
```

---

## 5. Capacitor Mobile Release Guide (Android & iOS)

### Prerequisites
- Node.js >= 20
- Android Studio Ladybug / Koala + Android SDK 34+
- Xcode 16+ & macOS Sequoia / Sonoma (for iOS)

### Step 1: Initialize & Sync Capacitor
```bash
# 1. Build the production web bundle
npm run build

# 2. Sync web assets with native platform containers
npm run cap:sync
```

### Step 2: Android Signed Release (AAB)
```bash
# 1. Generate release keystore if not already created
keytool -genkey -v -keystore logihr-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias logihr-key

# 2. Configure android/app/build.gradle with signingConfig:
#    signingConfigs {
#        release {
#            storeFile file("logihr-release-key.jks")
#            storePassword System.getenv("KEYSTORE_PASSWORD")
#            keyAlias "logihr-key"
#            keyPassword System.getenv("KEY_PASSWORD")
#        }
#    }

# 3. Build signed Android App Bundle (AAB) for Google Play Store
cd android && ./gradlew bundleRelease
# Output located at: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 3: iOS TestFlight Build
```bash
# 1. Open iOS project in Xcode
npm run cap:open:ios

# 2. In Xcode:
#    - Select Team & Provisioning Profile under "Signing & Capabilities"
#    - Select Any iOS Device (arm64)
#    - Go to Product > Archive
#    - Click "Distribute App" > "App Store Connect" > "Upload"
# 3. Build will appear in App Store Connect TestFlight within 10-15 minutes.
```

---

## 6. Business Rule Verification & Test Execution

### A. Vitest Automated Test Suite
Run the test suite calling real service calculation functions:
```bash
npm test
```

Verified Test Cases (`src/tests/calculations.test.ts`):
1. **Haversine & Geofence Engine**: Exact 0m calculation for identical coordinates, <250m inside perimeter, and >15km outside rejection.
2. **Leave Working Day Calculator**: Monday-to-Wednesday (3 working days), Friday-to-Monday skipping weekend (2 working days), half-day calculation (0.5 days), and full week excluding weekends (5 working days).
3. **Work-Minutes & Shift Timing**: On-time detection (09:25 vs 09:30 AM), late mark detection (09:42 vs 09:30 AM), net work minutes deducting meal breaks (495m from 540m gross), and 12h/24h time parsing to minutes.
4. **Timesheet Overlap Validator**: Passes non-overlapping consecutive intervals, rejects overlapping time slots.

### B. Manual & SQL RLS Verification Checklist
Execute `supabase/tests/rls_and_security_tests.sql` in the Supabase SQL editor or perform the following manual test steps:

1. **Direct Punch Insert Restriction**:
   - **Step**: As an authenticated employee, attempt an `INSERT INTO public.punches` via Supabase client.
   - **Expected**: Rejected with `new row violates row-level security policy for table "punches"`. Only Edge Functions with `service_role` can stamp authoritative punches.
2. **Anti-Self-Approval Restriction**:
   - **Step**: As Employee A, call `approve_leave_request(req_id, emp_a_id)`.
   - **Expected**: Throws Postgres error `42501: Employees cannot approve their own requests`.
3. **Manager Role Authorization**:
   - **Step**: As non-manager Employee B, attempt to call `approve_leave_request(req_id, emp_b_id)` on Employee A's request.
   - **Expected**: Throws Postgres error `42501: Caller is not authorized to approve this request`.
4. **Profile Column Immutability**:
   - **Step**: As Employee A, attempt to update `role`, `manager_id`, or `assigned_sites` on `public.employees`.
   - **Expected**: Trigger `trg_protect_employee_columns` raises exception `Employees cannot modify their own role, manager, or assigned sites`.
5. **Payslips Confidentiality**:
   - **Step**: Query `SELECT * FROM public.payslips` as Employee A.
   - **Expected**: Returns exclusively records matching `employee_id = get_current_employee_id()`. Zero records for colleagues returned.

---

## 7. Go-Live Blockers Checklist

Before promoting LogiHR to production, the following mandatory items must be completed:

| Category | Go-Live Blocker Item | Status & Production Resolution Plan |
| :--- | :--- | :--- |
| **RLS Verification** | Database RLS policy execution | **Verified in SQL**: All RLS policies active on `employees`, `punches`, `leave_requests`, `leave_balances`, `regularizations`, `timesheets`, `timesheet_rows`, `payslips`, `consent_logs`. Run `supabase/tests/rls_and_security_tests.sql` to re-validate on staging environment. |
| **Authentication** | Force-password-reset on first login | **Action Required**: Supabase Auth users should be invited with `inviteUserByEmail()`, triggering mandatory password creation. Production auth flow must enforce `password_updated_at IS NOT NULL` before granting session access. |
| **Payroll Data** | Real payroll data source integration | **Action Required**: Integrate payroll ERP (e.g., Darwinbox, Keka, GreytHR, or SAP) via secure webhook / cron job utilizing `SUPABASE_SERVICE_ROLE_KEY` to populate `public.payslips` with encrypted breakdown JSON and signed storage URLs. |
| **Privacy & DPDP** | Consent text legal review | **Action Required**: Corporate legal counsel must review the privacy agreement terms in `PrivacyConsentModal.tsx` against India's Digital Personal Data Protection (DPDP) Act 2023 specifications prior to enterprise deployment. |
| **Geofence Calibration** | GPS site perimeter validation | **Action Required**: Conduct physical on-site GPS walk-around at Surat HQ, Ahmedabad Hub, and Mumbai site with multi-device GPS averaging to fine-tune `radius_meters` and account for urban multipath interference. |
| **Mobile Security** | Android mock location detection | **Documented**: `@capacitor/geolocation` does not expose mock location flags. Standard web/Capacitor GPS is protected server-side via geofence distance and maximum accuracy thresholds (<50m). Production native Android build should register a custom Android Plugin reading `Location.isMock()` / `Location.isFromMockProvider()`. |
| **Store Release** | Play Store & TestFlight signing | **Action Required**: Generate corporate release keystore (`.jks`) for Android App Bundle (AAB) and enroll in Apple Developer Enterprise Program for iOS TestFlight provisioning profile. |
| **Database Ops** | Backup & Point-in-Time Recovery (PITR) | **Action Required**: Enable Supabase Pro PITR (Point-in-Time Recovery) with 7-day or 30-day retention and automated daily logical backups before migrating real employee attendance data. |
| **Pilot Rollout** | Phased pilot with 5–10 employees | **Action Required**: Conduct a 2-week pilot with 1 manager and 5–10 employees across Android and iOS devices to validate real clock-in/out timestamps, leave approval notifications, and offline punch caching. |
