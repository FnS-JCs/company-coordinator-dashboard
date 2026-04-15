# SRCC Placement Cell — Company Coordinator Dashboard
## Developer Setup Guide
> Follow this guide exactly from top to bottom. Estimated time: 20–30 minutes.

---

## PREREQUISITES — SOFTWARE TO INSTALL

### 1. Node.js
- Go to **https://nodejs.org**
- Click the **LTS** button (left side — do NOT click "Current")
- Run the installer with all default settings
- On one of the screens, there will be a checkbox saying **"Automatically install necessary tools"** — leave it checked
- A black PowerShell window will open after installation and run for 5–10 minutes — **do not close it**, let it finish
- Once it closes, verify by opening a terminal and typing:
  ```
  node -v
  ```
  You should see something like `v24.x.x`

---

### 2. Git
- Go to **https://git-scm.com/downloads**
- Click **Windows** → download the installer
- Run with all default settings
- Verify:
  ```
  git --version
  ```
  You should see something like `git version 2.x.x`

---

### 3. VS Code (or Trae)
**Option A — VS Code (recommended for most teammates)**
- Go to **https://code.visualstudio.com**
- Download and install with default settings

**Option B — Trae (if you want AI Builder capabilities)**
- Go to **https://trae.ai**
- Download and install the standalone app

---

## STEP 1 — GET THE SECRET FILES

You need two `.env` files that contain API keys. These are **not on GitHub** for security reasons.

Contact **Seyan** (`seyan.sonone@gmail.com`) or check the shared Google Drive folder to get:

| File | Where to place it |
|------|------------------|
| `server/.env` | Inside the `server` folder of the project |
| `client/.env` | Inside the `client` folder of the project |

> ⚠️ Do not share these files publicly or commit them to GitHub.

---

## STEP 2 — CLONE THE REPOSITORY

Open a terminal (VS Code terminal or Windows PowerShell) and run:

```bash
git clone https://github.com/FnS-JCs/company-coordinator-dashboard.git
cd company-coordinator-dashboard
```

---

## STEP 3 — PLACE THE .ENV FILES

After cloning, your folder structure will look like:

```
company-coordinator-dashboard/
├── client/
└── server/
```

- Copy `server/.env` into the `server/` folder
- Copy `client/.env` into the `client/` folder

**Important:** Make sure the files are named exactly `.env` (starting with a dot, no `.txt` extension).

To verify on Windows — open PowerShell inside the folder and run:
```bash
dir server
dir client
```
Both should show a file named `.env` in the list.

If it shows `.env.txt` instead, rename it:
```bash
cd server
Rename-Item .env.txt .env
cd ../client
Rename-Item .env.txt .env
```

---

## STEP 4 — INSTALL DEPENDENCIES

Open a terminal inside the project root folder and run:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

Both commands will take 1–2 minutes each.

---

## STEP 5 — RUN THE PROJECT

You need **two terminals running at the same time**.

**Terminal 1 — Backend server:**
```bash
cd server
node src/index.js
```
✅ Success message: `Server running on port 5000`

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
✅ Success message: `VITE ready on localhost:5173`

> In VS Code, open a second terminal by clicking the **+** icon in the terminal panel.

---

## STEP 6 — OPEN THE APP

Open your browser and go to:
```
http://localhost:5173
```

Log in using your **SRCC email** (`@srcc.du.ac.in`).

---

## STEP 7 — PUSH YOUR CHANGES TO GITHUB

After making any changes, push them to GitHub:

```bash
# From the root project folder
cd company-coordinator-dashboard
git add .
git commit -m "describe what you changed"
git push
```

When asked for credentials, use the SRCC GitHub account details provided by Seyan.

---

## COMMON ERRORS & FIXES

### ❌ `node: command not found` or `node -v` doesn't work
Node.js is not installed or the terminal needs to be restarted. Close and reopen the terminal after installing Node.js.

### ❌ `Cannot find module '...'` when running `node src/index.js`
You forgot to run `npm install` in the server folder. Run:
```bash
cd server
npm install
```

### ❌ `Service account object must contain a string "project_id" property`
The `server/.env` file is missing or not named correctly. Make sure:
- The file is inside the `server/` folder
- It is named `.env` not `env` or `.env.txt`

### ❌ `auth/invalid-api-key` in browser console
The `client/.env` file is missing or not named correctly. Make sure:
- The file is inside the `client/` folder
- It is named `.env` not `env` or `.env.txt`
- Restart the frontend after placing the file

### ❌ `ERR_CONNECTION_REFUSED` on port 3001
The backend server is not running. Open a terminal and run:
```bash
cd server
node src/index.js
```

### ❌ Login page shows but login fails
Make sure the backend is running on port 5000 AND the `client/.env` has this line:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### ❌ `cd server` gives "Cannot find path" error
You are already inside the `server` folder. Just run `node src/index.js` directly without `cd server`.

### ❌ Frontend running on port 5174 instead of 5173
This happens when another instance is already using port 5173. Port 5174 works fine — just open `http://localhost:5174` instead.

---

## WHAT EACH PART DOES

| Part | Port | What it is |
|------|------|-----------|
| Frontend (React) | 5173 | The dashboard UI you see in the browser |
| Backend (Express) | 5000 | The server that handles Gmail, Firebase, WhatsApp |
| Firebase | Cloud | Database and authentication |

---

## DAILY WORKFLOW

Every time you sit down to work:

1. Open VS Code → open the `company-coordinator-dashboard` folder
2. Pull latest changes from GitHub:
   ```bash
   git pull
   ```
3. Open Terminal 1 → `cd server` → `node src/index.js`
4. Open Terminal 2 → `cd client` → `npm run dev`
5. Open `http://localhost:5173` in browser
6. Make your changes
7. Push to GitHub:
   ```bash
   git add .
   git commit -m "what you changed"
   git push
   ```

---

## REPOSITORY

https://github.com/FnS-JCs/company-coordinator-dashboard
