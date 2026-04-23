# Company Coordinator Dashboard — Full Refactor Prompt (v2)
> Paste this entire document into Trae Builder to refactor the existing dashboard per the new specification.
> 
> **What's new in v2:** Adds a standalone Tools sidebar section with 3+ placeholder tool slots (CV Sorter, VCF Generator, Excel Auto-formatter, and one reserved slot). Also bypasses the full auth check during development — only `srcc.pc.jc.fns2526@gmail.com` can access any portal, with a role switcher for testing.

---

## PRE-FLIGHT CHECKLIST

Before pasting this prompt into Builder:

1. Push your current working version to GitHub first — this refactor will remove the withdrawal feed and rebuild major portions
   ```bash
   git add .
   git commit -m "checkpoint before full refactor v2"
   git push
   ```
2. Ensure both the backend (`node src/index.js`) and frontend (`npm run dev`) are currently running without errors
3. Let Builder execute steps **sequentially** — the prompt defines 16 steps. Verify each before moving to the next.
4. If Builder gets stuck or produces errors, share the error in a new message — do not force it to continue blindly.

---

## THE BUILDER PROMPT

Copy everything inside the code block below and paste it into Trae Builder in one go:

```
Refactor and extend the existing Company Coordinator Dashboard codebase for SRCC Placement Cell. 
Keep existing .env structure, Firebase setup, folder structure, and OAuth credentials intact. 
Replace the current UI and dashboard logic entirely with the specification below.

=============================================================
DESIGN SYSTEM
=============================================================

Color palette (use ONLY these):
- Primary dark: #1B3055 (SRCC navy)
- White: #FFFFFF
- Neutral greys: #F5F5F7 (background), #E5E5EA (borders), #6B7280 (secondary text), #1F2937 (primary text)
- Accent (use sparingly for CTAs only): #1B3055
- Success: #10B981 | Error: #EF4444 | Warning: #F59E0B

Typography: Inter or system-ui. Professional, clean, zero decorative elements.
Spacing: Generous whitespace. Consistent 8px grid.
No gradients, no shadows heavier than subtle (shadow-sm), no emojis in UI.
Desktop-only for now, but use semantic flex/grid so mobile breakpoints can be added later.

=============================================================
DEVELOPMENT AUTH BYPASS (temporary)
=============================================================

Add a DEV_AUTH_BYPASS flag in server/.env (default: true for now).

When DEV_AUTH_BYPASS=true:
- Login page shows three buttons in addition to "Sign in with Google":
  "Dev: Login as Admin", "Dev: Login as SC", "Dev: Login as JC"
- Each dev login auto-signs in as srcc.pc.jc.fns2526@gmail.com but sets the 
  role in session/local storage as admin/SC/JC accordingly
- No other email can use dev login
- The real Google Sign-In button also still works, but only 
  srcc.pc.jc.fns2526@gmail.com is accepted
- All API routes skip role-check middleware when DEV_AUTH_BYPASS=true, 
  and return data as if the current "dev role" from the header X-Dev-Role is authoritative
- Add a persistent yellow banner at top of every page: 
  "DEV MODE — Auth bypassed. Current role: [role]. Switch role: [Admin|SC|JC]"
- Switching role from the banner instantly re-navigates to the corresponding dashboard

When DEV_AUTH_BYPASS=false:
- Normal Firestore-backed auth flow (spec in next section) takes over
- Dev banner is hidden, dev login buttons are hidden

This lets us develop without auth friction, then flip one env var to go production.

=============================================================
USER ROLES & ACCESS CONTROL (production mode)
=============================================================

Three roles stored in Firestore users/{uid} collection:
- "admin" — full access, manages users and connects GRC inbox
- "senior_coordinator" (SC) — sees companies assigned to them via Gmail labels
- "junior_coordinator" (JC) — sees only companies delegated to them by an SC

Access rules (when DEV_AUTH_BYPASS=false):
- Only users that exist in Firestore 'users' collection can log in.
- If a Google login email is not in 'users' collection → sign out immediately with error: 
  "Access denied. Contact the administrator."
- Removing a user from Firestore immediately revokes access (no tokens kept).
- Admin email is configurable in Firestore at settings/admin.email. Default value: 
  "srcc.pc.jc.fns2526@gmail.com". Admin can change this to any other email, which 
  transfers admin rights.

=============================================================
FIRESTORE SCHEMA
=============================================================

users/{uid}
  - uid, name, email, phone, role ("admin" | "senior_coordinator" | "junior_coordinator")
  - createdAt, updatedAt

companies/{companyId}
  - name (string)
  - type ("placement" | "internship") 
  - rounds (array of { name, date, status })
  - seniorCoordinatorEmail (string — SC who owns this company)
  - delegatedToJcEmail (string | null — JC delegated by SC)
  - labelSc (string — auto-generated, e.g. "GRC 2025-26/SCs/Aaditya Goyal")
  - labelCompany (string — auto-generated, e.g. "GRC 2025-26/Placement Companies/Deloitte")
  - createdBy, createdAt, updatedAt

emailReadStatus/{compositeKey}
  - compositeKey = {userUid}_{gmailMessageId}
  - userUid, gmailMessageId, companyId, readAt (timestamp)
  - Tracks per-user read status WITHOUT modifying Gmail's own read state.

settings/admin
  - email (string) — the current admin email

settings/gmail
  - connected (bool)
  - connectedAt (timestamp)
  - lastRefresh (timestamp)

settings/academicYear
  - year (string, e.g. "2025-26") — parsed dynamically from labels, never hardcoded. 
    Backend updates this whenever it sees a new year in labels.

=============================================================
LABEL PARSING LOGIC (CRITICAL — follow exactly)
=============================================================

Valid label patterns (case-sensitive, space-sensitive):
1. "GRC <year>/SCs/<Name>" → Senior Coordinator label
2. "GRC <year>/JCs/<Name>" → Junior Coordinator label
3. "GRC <year>/Placement Companies/<CompanyName>" → Placement company label
4. "GRC <year>/Internship Companies/<CompanyName>" → Internship company label

Rules:
- <year> is dynamic (e.g. "2025-26"). NEVER hardcode the year.
- Coordinator names and company names are NEVER hardcoded.
- Any label not matching these four patterns is silently ignored.
- A mail must have BOTH a coordinator label AND a company label to appear. 
  If only one is present, ignore that mail.
- A company that appears in both "Placement Companies" and "Internship Companies" 
  should be treated as two separate entries — show in both the placement and 
  internship sections of the coordinator's dashboard.
- Company creation auto-generates labels using the above format. Admin/SC does NOT type 
  label strings manually.

=============================================================
LOGIN FLOW
=============================================================

Route: /login
- Simple centered card: SRCC crest (use placeholder until logo asset provided), 
  "The Placement Cell" title, "Company Coordinator Dashboard" subtitle
- "Sign in with Google" button
- If DEV_AUTH_BYPASS=true: three extra dev buttons directly below 
  ("Dev: Login as Admin", "Dev: Login as SC", "Dev: Login as JC")
- On success (real Google login): check Firestore users collection for email
  - If admin email → redirect to /admin
  - If SC → redirect to /dashboard
  - If JC → redirect to /dashboard  
  - If email not found → sign out + show error
- On dev button click: sets role in session, redirects to corresponding dashboard

=============================================================
ADMIN DASHBOARD (route: /admin)
=============================================================

Sidebar tabs:
1. Users — manage all coordinator accounts
2. GRC Inbox — connect/disconnect the GRC Gmail account
3. Admin Settings — change the admin email
4. Back to Dashboard (switches to SC/JC view if admin also wants to see coordination side)

USERS TAB:
- Table with columns: Name | Email | Phone | Role | Added On | Actions (Edit/Remove)
- "+ Add User" button opens a modal: Name, Email, Phone, Role (dropdown: admin/SC/JC)
- Removing a user shows confirmation: "Remove [name]? This will revoke their access immediately."
- Edit user opens same modal pre-filled.
- Search/filter bar at top.

GRC INBOX TAB:
- Shows current connection status (connected/not connected)
- If not connected: "Connect GRC Gmail Account" button → opens OAuth flow
- If connected: shows connected email + last refresh time + "Disconnect" button
- Disconnect shows confirmation: "Disconnecting will stop all email syncing across the dashboard."

ADMIN SETTINGS TAB:
- Single field: "Admin Email" with current value
- Save button with confirmation: "Transferring admin to [new email]. You will lose admin access."

=============================================================
SC / JC DASHBOARD (route: /dashboard)
=============================================================

Layout: Left sidebar (collapsible) + main content area

SIDEBAR:
- SRCC logo at top
- User's name + role + email
- Navigation:
  - "My Companies" (default view)
  - If SC: "Create Company" button
  - Divider
  - "Tools" section header (all roles see this)
    - CV Sorter
    - VCF Generator
    - Excel Auto-formatter
    - Tool 4 (placeholder)
- Bottom: Logout button

MAIN VIEW — "My Companies":
- Page title: "My Companies" + year tag (e.g. "2025-26")
- Two sections: "Placement Companies" and "Internship Companies"
- Each section shows a grid of company cards
- Company card: company name, type badge, round count, 
  unread email count (prominent red badge), "Open →" button
- Cards are clickable (opens /dashboard/company/{companyId})

For SCs: shows all companies where seniorCoordinatorEmail === loggedInUser.email
For JCs: shows all companies where delegatedToJcEmail === loggedInUser.email
Empty state: "No companies assigned yet. Contact your coordinator."

=============================================================
TOOLS SECTION (standalone, all coordinator roles)
=============================================================

Each tool is a separate route with its own placeholder page. Tools are designed to be 
built individually later — for now each route shows a clean placeholder saying 
"Tool coming soon. Drop implementation into /client/src/tools/{toolName}/ and 
/server/src/tools/{toolName}/ — it will auto-integrate."

Plugin-style folder structure:

  client/src/tools/
    cv-sorter/
      index.tsx       — placeholder page, rendered at /tools/cv-sorter
      README.md       — describes the tool's purpose and expected I/O
    vcf-generator/
      index.tsx       — placeholder page, rendered at /tools/vcf-generator
      README.md
    excel-formatter/
      index.tsx       — placeholder page, rendered at /tools/excel-formatter
      README.md
    tool-four/
      index.tsx       — placeholder page, rendered at /tools/tool-four
      README.md

  server/src/tools/
    cv-sorter/
      routes.js       — placeholder, exports empty router at /api/tools/cv-sorter
      README.md
    vcf-generator/
      routes.js       — placeholder, exports empty router at /api/tools/vcf-generator
      README.md
    excel-formatter/
      routes.js       — placeholder, exports empty router at /api/tools/excel-formatter
      README.md
    tool-four/
      routes.js       — placeholder, exports empty router at /api/tools/tool-four
      README.md

Central auto-loader:
- client/src/tools/index.ts — auto-imports all tools via dynamic glob and registers 
  their routes with React Router
- server/src/tools/index.js — auto-mounts all tool routers under /api/tools/*

Each placeholder index.tsx renders:
  - Page title (from tool README or hardcoded name)
  - Paragraph: "This tool is pending implementation. Check back later."
  - Clean card layout, same design tokens as rest of app

Tool routes (all accessible to all authenticated coordinators in dev mode, 
SC/JC/Admin in prod mode):
- /tools/cv-sorter
- /tools/vcf-generator
- /tools/excel-formatter
- /tools/tool-four

IMPORTANT: Build these as hollow placeholders only. Do NOT attempt to implement any 
functionality beyond rendering a "coming soon" message. Each tool's actual behavior 
will be developed separately and pushed as a self-contained module.

=============================================================
CREATE COMPANY MODAL (SC only)
=============================================================

Triggered by "Create Company" sidebar button.

Fields:
- Company Name (text, required)
- Type (radio: Placement / Internship, required) 
  — note: if recruiting for both, SC creates TWO separate entries
- Rounds (dynamic list — add/remove rounds, each with: Round Name, Date)
- Submit button: "Create Company & Generate Labels"

On submit:
- Create Firestore company doc
- Auto-generate labels:
  - labelSc = `GRC {year}/SCs/{SC's name from users collection}`
  - labelCompany = `GRC {year}/Placement Companies/{companyName}` 
    OR `GRC {year}/Internship Companies/{companyName}`
- Year is read from settings/academicYear
- Show success toast with the generated labels displayed, so SC can inform GRC what 
  labels to apply on future mails

=============================================================
COMPANY DETAIL VIEW (route: /dashboard/company/{companyId})
=============================================================

Header:
- Back button → "My Companies"
- Company name + type badge
- Meta row: Coordinator name, rounds count, "Refresh Inbox" button (manual refresh)
- If SC and no JC delegated: "Delegate to JC" button
- If SC and JC already delegated: shows "Delegated to: [JC Name]" with "Revert delegation" option

Tabs below header:
1. Inbox (default)
2. Rounds (list of rounds with dates, status)
3. Details (company metadata, labels, edit button for SC only)

INBOX TAB:
- Filter bar:
  - Sort: "Latest first" / "Oldest first" (default: latest first)
  - Filter: "All" / "Unread" / "Read" (read status is per-user, tracked in emailReadStatus)
  - Search: searches subject and sender
- Email list: each row shows Sender Name | Subject | Date | unread dot (if unread by current user)
- Click row → opens email detail panel on the right (or modal on smaller screens)
- Email detail:
  - Full sender info
  - Subject
  - Date
  - Full email body — render HTML with images, formatting, links (sanitize HTML for safety)
  - Attachments if present (download links)
  - Marks email as read for the current user ONLY (write to emailReadStatus, do NOT modify Gmail)
- Auto-refresh every 5 minutes in background. Refresh does NOT change read status.
- Manual "Refresh Inbox" button available at all times. Refresh does NOT change read status.

=============================================================
DELEGATE TO JC MODAL (SC only)
=============================================================

- Dropdown of all JCs from users collection
- Confirmation: "Delegating [Company] to [JC Name]. You will still have full access."
- On confirm: updates company.delegatedToJcEmail
- JC now sees this company on their dashboard
- SC continues to see it too (dual visibility)

=============================================================
BACKEND API ROUTES (Express)
=============================================================

AUTHENTICATION MIDDLEWARE:
- Every protected route verifies Firebase ID token
- Checks user exists in users collection
- Attaches user object to request
- If DEV_AUTH_BYPASS=true, middleware reads X-Dev-Role header and treats email as 
  srcc.pc.jc.fns2526@gmail.com with the declared role

/api/users (admin only)
  GET /     — list all users
  POST /    — create user
  PATCH /:uid — update user
  DELETE /:uid — remove user

/api/companies  
  GET /     — returns companies visible to current user (based on role + labels)
  POST /    — SC creates company (auto-generates labels)
  GET /:id  — single company details
  PATCH /:id — edit company
  POST /:id/delegate — SC delegates to JC (body: { jcEmail })
  POST /:id/revert-delegation

/api/gmail/emails?companyId=...
  GET — returns emails for that company by matching BOTH coordinator + company labels
  Response: array of { id, from, subject, date, snippet }

/api/gmail/emails/:messageId
  GET — full email body (HTML), attachments list

/api/gmail/mark-read
  POST — body: { messageId, companyId } — marks read for current user only in Firestore

/api/gmail/refresh
  POST — manually triggers a Gmail fetch

/api/gmail/connect-url (admin only)
  GET — returns OAuth URL

/api/gmail/oauth/callback
  GET — handles OAuth callback, stores tokens in settings/gmail

/api/gmail/disconnect (admin only)
  POST — clears stored tokens

/api/settings/admin-email
  GET — returns current admin email
  POST — admin only, transfers admin rights (body: { newEmail })

/api/tools/* — auto-mounted by server/src/tools/index.js from each tool folder's routes.js

=============================================================
GMAIL SYNC LOGIC
=============================================================

- Single OAuth connection to GRC inbox, tokens stored in server/data/gmail-tokens.json 
  AND mirrored to settings/gmail in Firestore
- When fetching emails for a company:
  1. Use Gmail API q parameter to search mails with BOTH labels applied
  2. Parse labels from each message; verify they match the expected patterns
  3. Cross-reference with current user's own coordinator label — user only sees mails that 
     carry their own SC or JC coordinator label PLUS the company label
  4. Return structured list to frontend
- Background job (setInterval): every 5 minutes, pre-fetch unread counts for all companies 
  visible to currently logged-in users (use simple in-memory counter — no need for jobs queue)
- Read/unread tracking: 
  - Each user has their own read state in emailReadStatus/{uid}_{messageId}
  - Gmail's actual read/unread state is never touched
  - Marking as read writes to Firestore only

=============================================================
AUTO-SYNC & YEAR DETECTION
=============================================================

On every Gmail fetch:
- Parse the year from labels encountered
- If settings/academicYear.year is different from what's seen in labels, update it
- This keeps the app future-proof across academic years

=============================================================
EDGE CASES TO HANDLE
=============================================================

- Company recruiting for both placement & internship: two separate company docs, 
  shown in respective sections. SC creates two entries manually.
- Mail has coordinator label but no company label: ignore
- Mail has company label but no coordinator label: ignore
- Mail's coordinator label doesn't match any user in the system: ignore
- Admin email is also an SC/JC in companies collection: admin sees admin dashboard by 
  default but can switch to SC/JC view
- GRC inbox disconnected mid-session: show a banner across all dashboards saying 
  "GRC inbox disconnected. Contact admin." and disable refresh buttons
- User removed from Firestore while logged in: next API call returns 401, frontend 
  force-logs-them-out

=============================================================
IMPLEMENTATION ORDER
=============================================================

Build in this sequence (do not skip ahead):

1. Update Firestore security rules and create collections schema (users, companies, 
   emailReadStatus, settings). Seed settings/admin with srcc.pc.jc.fns2526@gmail.com.
2. Seed the users collection with ONLY srcc.pc.jc.fns2526@gmail.com as admin initially 
   (no SCs or JCs added — admin adds them via UI).
3. Implement DEV_AUTH_BYPASS flag in .env, auth middleware that honors it, and dev 
   login buttons / role switcher banner on frontend.
4. Backend: /api/users CRUD (admin only, bypassed in dev mode).
5. Frontend: new Login page (spec above). Redirects based on role.
6. Frontend: Admin dashboard — Users tab only (first).
7. Backend: /api/gmail/connect-url, /api/gmail/oauth/callback, /api/gmail/disconnect.
8. Frontend: Admin dashboard — GRC Inbox tab.
9. Backend: /api/companies CRUD with label auto-generation.
10. Frontend: SC/JC dashboard with company cards grid + Create Company modal (SC only).
11. Set up Tools plugin architecture: client/src/tools/ and server/src/tools/ with 
    auto-loaders. Create four placeholder tools (cv-sorter, vcf-generator, 
    excel-formatter, tool-four) each with index.tsx + README.md (client) and 
    routes.js + README.md (server).
12. Frontend: Add Tools section to sidebar with routes to all four tool placeholders.
13. Backend: /api/gmail/emails, label parsing, year detection.
14. Frontend: Company detail view with inbox, read/unread tracking, filters, sort.
15. Backend + Frontend: delegate-to-JC flow.
16. Frontend: 5-minute auto-refresh + manual refresh button. Admin Settings tab: 
    change admin email.

=============================================================
DO NOT INCLUDE
=============================================================

- Withdrawal feed (remove all existing code related to /withdrawals route, 
  GmailConnect component on withdrawal page, CC-Withdrawal label)
- WhatsApp integration (keep folder structure/placeholder routes so we can build 
  this later without disturbing the rest)
- Any hardcoded company names
- Any hardcoded coordinator names
- Any hardcoded academic year
- Any role-switching for non-admin users (except the dev banner)
- Emojis anywhere in UI
- ANY actual implementation inside the four tool folders — hollow placeholders only

=============================================================
STYLING NOTES
=============================================================

Use Tailwind. Color tokens in tailwind.config.js:
  colors: {
    navy: '#1B3055',
    'navy-light': '#2A456F',
    grey: { 50: '#F5F5F7', 200: '#E5E5EA', 500: '#6B7280', 900: '#1F2937' }
  }

Reusable components:
- <Button variant="primary|secondary|danger|ghost">
- <Modal>
- <Table>
- <Card>
- <Badge>
- <Toast>
- <DevBanner> (only renders when DEV_AUTH_BYPASS=true)

Layout:
- Sidebar: 240px fixed, navy background, white text
- Main content: grey-50 background, max-width 1400px, centered
- Cards: white background, 1px grey-200 border, 12px border radius, shadow-sm

Start with step 1 and work sequentially. Confirm each step before moving to the next.
```

---

## POST-REFACTOR CHECKLIST

After Builder finishes all 16 steps, verify these before using the app:

- [ ] `DEV_AUTH_BYPASS=true` in `server/.env` — dev mode active
- [ ] Yellow "DEV MODE" banner visible at top of every page with role switcher
- [ ] Can click "Dev: Login as Admin" and land on `/admin`
- [ ] Can switch to SC / JC via banner without logging out
- [ ] Admin dashboard has Users, GRC Inbox, and Admin Settings tabs
- [ ] Admin can add a user, they appear in the users table
- [ ] Admin can connect GRC Gmail via OAuth
- [ ] SC can create a new company — labels auto-generate correctly
- [ ] Labels follow the format `GRC {year}/SCs/{name}` and `GRC {year}/Placement Companies/{name}`
- [ ] Applying those labels to a test email in GRC inbox → email shows up in the company's inbox tab
- [ ] Email body renders HTML + images correctly
- [ ] Marking as read only changes status for the current user, NOT in Gmail itself
- [ ] Filters (All / Unread / Read) work
- [ ] Sort (Latest / Oldest) works
- [ ] Manual refresh button works
- [ ] Auto-refresh kicks in every 5 minutes
- [ ] Tools section in sidebar shows CV Sorter, VCF Generator, Excel Auto-formatter, Tool 4
- [ ] Clicking any tool opens its placeholder page ("Tool coming soon")
- [ ] `client/src/tools/` and `server/src/tools/` folders exist with all four subfolders
- [ ] Each tool folder has its own `README.md`
- [ ] Setting `DEV_AUTH_BYPASS=false` successfully re-enables the Firestore-backed auth
- [ ] With bypass off, only `srcc.pc.jc.fns2526@gmail.com` can log in
- [ ] Removing a user from admin panel → logs them out and blocks re-entry
- [ ] Transferring admin email works and old admin loses privileges
- [ ] No emojis anywhere in the UI
- [ ] Colors match the navy + white + neutral grey palette

---

## FUTURE TOOL DEVELOPMENT WORKFLOW

When you're ready to build a tool (e.g. CV Sorter):

1. Pull latest from GitHub
2. Navigate to `client/src/tools/cv-sorter/` and `server/src/tools/cv-sorter/`
3. Replace the placeholder `index.tsx` and `routes.js` with actual implementation
4. Update the `README.md` inside that folder with final behavior/I/O
5. Commit and push — the auto-loader in `tools/index.ts` and `tools/index.js` picks it up
6. Teammates pull → tool is live on their machines without any integration work

Each tool is self-contained. Breaking one doesn't break the rest.

---

## REPOSITORY

https://github.com/FnS-JCs/company-coordinator-dashboard
