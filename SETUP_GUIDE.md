# Company Coordinator Dashboard — Complete Setup Guide

> **Project:** SRCC Placement Cell — Company Coordinator Dashboard  
> **Repo:** https://github.com/FnS-JCs/company-coordinator-dashboard  
> **Stack:** React (Vite) + Tailwind CSS + Express.js + Firebase (Firestore + Auth) + Gmail API + WhatsApp Business Cloud API + Google Sheets API  
> **AI Coding Assistant:** Trae (standalone IDE by ByteDance)

---

## What This App Does

A web dashboard for SRCC Placement Cell's Company Coordinators with two core features:

1. **Withdrawal Mail Feed** — Withdrawal emails sent to `grc.placementcell@srcc.du.ac.in` are labelled by the GRC team and automatically appear on the coordinator's dashboard in real time, removing the manual communication layer between GRC and coordinators.

2. **WhatsApp Business Composer** — Coordinators can draft and send messages directly to individual shortlisted candidates (instead of creating WhatsApp groups), with a built-in acknowledgement button that tracks responses and syncs to a Google Sheet maintained by volunteers.

### User Roles
- **15 Senior Coordinators** (Phase 1: Aug–Feb) — each manages multiple companies
- **40 Junior Coordinators** (Phase 2: Feb–Apr) — each assigned one company, under a senior
- Each user sees only their assigned companies on login

---

## Project Structure

```
company-coordinator-dashboard/
├── client/                  → React + Vite + Tailwind (Frontend)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CompanyDetail.jsx
│   │   │   ├── Withdrawals.jsx
│   │   │   └── Compose.jsx
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   ├── firebase.js       → Firebase config + Auth setup
│   │   ├── App.jsx           → React Router routes
│   │   └── main.jsx
│   ├── .env                  → Client-side Firebase config (never commit)
│   ├── package.json
│   └── vite.config.ts
│
├── server/                  → Express.js (Backend)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── gmail.js
│   │   │   └── whatsapp.js
│   │   └── services/
│   │       ├── gmailService.js
│   │       ├── whatsappService.js
│   │       └── userService.js
│   ├── .env                  → All secret keys (never commit)
│   ├── serviceAccount.json   → Firebase Admin SDK key (never commit)
│   ├── gmail-credentials.json → Gmail OAuth credentials (never commit)
│   └── index.js              → Express entry point (port 5000)
│
├── .gitignore
└── README.md
```

---

## Prerequisites — What to Download

| Tool | Download Link | Purpose |
|------|--------------|---------|
| Node.js (LTS) | https://nodejs.org | Runs the backend + npm |
| Git | https://git-scm.com/downloads | Version control |
| Trae IDE | https://trae.ai | AI-powered coding environment |
| GitHub Account | https://github.com | Code hosting + team collaboration |

### Verify installations (in terminal):
```bash
node -v       # Should show v20.x.x or higher
git --version # Should show git version 2.x.x
```

> **Note on Node.js installation on Windows:** During installation, if a checkbox says "Automatically install the necessary tools" and you check it, a PowerShell window will open and install Chocolatey + Python build tools. This is normal and can take 5–10 minutes. Let it complete, then restart Trae.

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/FnS-JCs/company-coordinator-dashboard.git
cd company-coordinator-dashboard
```

Then install dependencies for both client and server:

```bash
cd client
npm install
cd ../server
npm install
```

---

## Step 2 — Firebase Setup

### 2a. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `company-coordinator-dashboard`
3. Disable Google Analytics → click **Create project**

### 2b. Set Up Firestore
1. Left sidebar → **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode**
4. Select region: `asia-south1 (Mumbai)`

### 2c. Set Up Authentication
1. Left sidebar → **Build** → **Authentication** → **Get started**
2. Under **Sign-in providers**, enable **Google**
3. Save

### 2d. Register Web App + Get Firebase Config
1. Go to **Project Settings** (gear icon ⚙️ top left) → **General**
2. Scroll to **Your apps** → click the Web icon `</>`
3. App nickname: `coordinator-dashboard` → click **Register app**
4. Copy the `firebaseConfig` object shown — save it somewhere safe (Notepad)
5. Click **Continue to console**

The config looks like this:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "company-coordinator-dashboard.firebaseapp.com",
  projectId: "company-coordinator-dashboard",
  storageBucket: "company-coordinator-dashboard.firebasestorage.app",
  messagingSenderId: "788837390994",
  appId: "1:788837390994:web:..."
};
```

### 2e. Get Service Account Key
1. Still in **Project Settings** → click **Service accounts** tab
2. Click **Generate new private key** → **Generate key**
3. A JSON file downloads — rename it to `serviceAccount.json`
4. Place it inside the `/server` folder
5. **Never commit this file** — it's already in `.gitignore`

---

## Step 3 — Google Cloud Setup (Gmail API)

### 3a. Enable APIs
1. Go to https://console.cloud.google.com
2. Select the same project Firebase created (same name)
3. Search and enable **Gmail API**
4. Search and enable **Cloud Pub/Sub API**

### 3b. OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. If on Google Workspace: select **Internal** → Create
3. If on personal Gmail: select **External** → Create (works fine)
4. Fill in:
   - App name: `SRCC Placement Dashboard`
   - User support email: your email
   - Developer contact: your email
5. Click **Save and Continue** through all steps

### 3c. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `gmail-coordinator`
5. Under **Authorized redirect URIs** add: `http://localhost:5000/api/gmail/oauth/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret** — save to Notepad
8. Download the JSON if possible and save as `gmail-credentials.json` in `/server`
9. If JSON download isn't available, manually create `gmail-credentials.json`:

```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:5000/api/gmail/oauth/callback"]
  }
}
```

---

## Step 4 — Environment Variables

### Server `.env` (create at `/server/.env`)
```env
FIREBASE_PROJECT_ID=company-coordinator-dashboard
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=company-coordinator-dashboard.firebaseapp.com
FIREBASE_STORAGE_BUCKET=company-coordinator-dashboard.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=788837390994
FIREBASE_APP_ID=1:788837390994:web:...

GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5000/api/gmail/oauth/callback

WHATSAPP_TOKEN=placeholder_for_now
WHATSAPP_PHONE_ID=placeholder_for_now

PORT=5000
```

### Client `.env` (create at `/client/.env`)
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=company-coordinator-dashboard.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=company-coordinator-dashboard
VITE_FIREBASE_STORAGE_BUCKET=company-coordinator-dashboard.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=788837390994
VITE_FIREBASE_APP_ID=1:788837390994:web:...
```

> All values come from the `firebaseConfig` object you saved in Step 2d. Both `.env` files are in `.gitignore` and will never be pushed to GitHub. Get these values from the project lead (Seyan) privately.

---

## Step 5 — Run the App Locally

Open **two terminals** simultaneously:

**Terminal 1 — Frontend:**
```bash
cd client
npm run dev
```
Opens at http://localhost:5173

**Terminal 2 — Backend:**
```bash
cd server
node index.js
```
Runs at http://localhost:5000

Visit http://localhost:5000/health — if you see `{"status":"ok"}` the server is running.  
Visit http://localhost:5173 — you should see the login page.

---

## Step 6 — Authentication

Login is restricted to:
- Emails ending with `@srcc.du.ac.in`
- Test account: `srcc.pc.jc.fns2526@gmail.com`

Any other Google account will be signed out immediately with an error message.

> When going live, remove the test account exception from `LoginPage.tsx` and only `@srcc.du.ac.in` will be allowed.

---

## Step 7 — Git Workflow for Team

### First time setup after cloning:
```bash
git config user.name "Your Name"
git config user.email "your-github-email@gmail.com"
```

### Daily workflow:
```bash
# Pull latest changes before starting work
git pull origin master

# After making changes
git add .
git commit -m "describe what you changed"
git push origin master
```

### Adding teammates as collaborators:
Go to GitHub repo → **Settings** → **Collaborators** → **Add people** → enter their GitHub username.

---

## Firestore Data Structure

```
users/{uid}
  - name: string
  - email: string
  - role: "senior" | "junior"
  - assignedCompanies: [companyId1, companyId2, ...]
  - supervisorUid: string (juniors only)

companies/{companyId}
  - name: string
  - seniorCoordinator: uid
  - juniorCoordinators: [uid, uid]
  - phase: "phase1" | "phase2"
  - processes: [processId, ...]

withdrawals/{docId}
  - candidateName: string
  - companyName: string
  - companyId: string
  - receivedAt: timestamp
  - status: "pending" | "processed"

processes/{processId}
  - companyId: string
  - round: string
  - date: string
  - mode: "online" | "offline"
  - candidates: [{ name, phone, email, acknowledged: bool }]
```

---

## Features Roadmap

### ✅ Done
- Project scaffolded (React + Vite + Tailwind + Express)
- Firebase project created (Firestore + Auth)
- Gmail API + Pub/Sub API enabled
- OAuth credentials created
- `.env` files configured
- Login page built with Google Auth + domain restriction
- Code pushed to GitHub

### 🔲 In Progress
- Fix login authentication error (browser console error pending diagnosis)

### 🔲 Upcoming
- Dashboard page with company cards per coordinator
- Gmail withdrawal mail feed (real-time via Firestore)
- WhatsApp Business message composer
- Acknowledgement tracking → Google Sheets sync
- Role-based views (senior vs junior)
- Admin panel to assign companies to coordinators
- Round progression tracker (R1 → R2 → Offer)
- Automated reminders (T-1 hour before interview)
- Volunteer read-only dashboard

---

## Files Never to Commit (already in .gitignore)
- `server/.env`
- `client/.env`
- `server/serviceAccount.json`
- `server/gmail-credentials.json`
- All `node_modules/` folders

Share these files privately (WhatsApp/email) with teammates — never through GitHub.

---

## Key Contacts
- **Project Lead:** Seyan (seyan.sonone@gmail.com)
- **GitHub Repo:** https://github.com/FnS-JCs/company-coordinator-dashboard
- **SRCC Account:** srcc.pc.jc.fns2526@gmail.com
