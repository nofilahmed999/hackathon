# HCM Lite — AI-assisted Human Capital Management

A complete, production-conscious Human Capital Management application built for the **Saylani Hackathon**.

## 🎨 Visual Design System

The application strictly adheres to the requested enterprise HR design system:
- **Navy**: `#112D4E` (Primary navigation, headers, and emphasis)
- **Blue**: `#3F72AF` (Primary actions, active navigation indicator)
- **Light blue-gray**: `#DBE2EF` (Subtle borders, dividers, and secondary surfaces)
- **Off-white**: `#F9F7F7` (Main surfaces and background)
- **Typography**: Geist Sans / Inter for UI, Geist Mono for codes/timestamps
- **Visual Discipline**: Strictly zero gradients, zero neon, zero glassmorphism, zero hover scale animations. Clean, professional corporate design.

---

## 🏗️ Architecture & Technology Stack

- **Client Application**: React 19, Vite, React Router v7, Tailwind CSS v4
- **State Management**: Redux Toolkit & Redux Persist
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Biometric Attendance**: Web MediaDevices Camera + Canvas mathematical 128-dimensional facial descriptor vector generation and Euclidean distance matching
- **Visual Analytics**: Recharts (Database-driven, zero fabricated metrics)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

---

## 🔐 Role-Based Access Control

1. **Admin**:
   - Initial bootstrap signup & company configuration
   - Company settings & business rule policies (grace period, start time, half-day threshold)
   - Provision HR Manager accounts (secondary Firebase auth instance without session swapping)
   - Department management with live employee count aggregation
   - Complete employee directory with active/inactive toggles
   - Daily attendance audit register
   - Company-wide leave approvals
   - Activity audit trail logging
   - AI HR Operations Assistant

2. **HR**:
   - HR Operations dashboard
   - Employee onboarding & account provisioning
   - Department management
   - Daily attendance board
   - Leave request review & decision note logging
   - AI HR Operations Assistant

3. **Employee**:
   - Employee self-service dashboard
   - Informed consent biometric face enrollment
   - Face-verification check-in (liveness check + Euclidean descriptor matching)
   - Server-calculated check-out & shift working hours
   - Personal attendance history
   - Leave request application & status tracking
   - AI HR Operations Assistant

---

## 🤖 AI HR Assistant (Real Firestore Data)

The assistant answers queries using live records aggregated from Cloud Firestore:
- Active vs. inactive headcount
- Today's attendance counts (on-time, late arrivals, missing/pending)
- Staff distribution across departments
- Pending leave petitions
- Recent administrative activity

---

## 🚀 Getting Started

### 1. Configure Environment
In `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSyDZ--dAdMvsRBW45k0FZgt3COeREKb44lY
VITE_FIREBASE_AUTH_DOMAIN=hackathon-eaf70.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hackathon-eaf70
VITE_FIREBASE_STORAGE_BUCKET=hackathon-eaf70.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=220795298046
VITE_FIREBASE_APP_ID=1:220795298046:web:b22d8972ed32995d2cc5af
```

### 2. Run the Development Server
```bash
cd frontend
npm run dev
```

### 3. Production Build
```bash
cd frontend
npm run build
```

---

## 📋 Hackathon Verification Workflow

1. Navigate to `/bootstrap` to create the initial **Administrator** credentials.
2. Complete **Organization Onboarding** (`/admin/company-setup`) with company name, office start time (default `09:00`), and grace period (default `15` mins).
3. In **HR Management** (`/admin/hr`), provision an HR Officer account.
4. In **Departments** (`/admin/departments`), create operational units.
5. In **Employee Directory** (`/admin/employees`), provision an Employee account.
6. Sign in as the **Employee**, navigate to **Face Enrollment** (`/employee/enrollment`), provide consent, and register your face template.
7. Navigate to **Face Attendance** (`/employee/attendance`) to perform verified biometric check-in.
8. Submit an absence request under **My Leaves** (`/employee/leaves`).
9. Sign in as **HR** or **Admin** to evaluate the leave petition under **Leave Approvals** (`/admin/leaves` or `/hr/leaves`).
10. Open **AI Assistant** (`/ai-assistant`) and ask:
   - *"How many active employees do we have?"*
   - *"How many employees checked in today?"*
   - *"Which departments have the most employees?"*
   - *"Which employees have missing attendance records today?"*

---

## 🔑 How to Re-create an Admin Account If Deleted

If your administrator account was deleted or you are locked out, you can recreate it using any of the following 3 solutions:

### Solution 1: Emergency Recovery Form in Web UI (Zero-terminal)
1. Navigate to [`/bootstrap`](http://localhost:5173/bootstrap) (or click the **"One-Time Admin Setup & Recovery"** link at the bottom of the Sign In page).
2. Click **"Admin Deleted? Recreate with Recovery Key"**.
3. Enter the Master Recovery Key:
   ```text
   HCM-ADMIN-RECOVER-2026
   ```
   *(Configured via `VITE_ADMIN_RECOVERY_KEY` in `frontend/.env`)*.
4. The form unlocks immediately. Enter your desired Admin name, email, and password.
5. Submit the form — the system will automatically create your credentials and link your existing company data.

### Solution 2: Terminal CLI Script
In your terminal inside the `frontend` directory, execute:
```bash
cd frontend
npm run create-admin
```
Or with custom credentials:
```bash
node scripts/create-admin.mjs myadmin@company.com MySecurePassword123! "Master Administrator"
```

### Solution 3: Direct Firebase Console Reset
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. In **Firestore Database** -> `users` collection, delete any remnant document that has `"role": "admin"`.
3. Refresh [`/bootstrap`](http://localhost:5173/bootstrap) — public admin setup is automatically unlocked.
