# AquaAlert — Community Water Watch

AquaAlert is a full-stack web application for reporting water quality concerns, water shortages, and water infrastructure damage. It is based on the supplied AquaAlert project abstract and includes separate citizen and administrator workflows.

## What is included

- Responsive landing page and community issue map.
- Citizen registration and login with role-based access.
- Submit a report with title, issue type, description, map coordinates, locality/landmark, and optional evidence photo.
- Citizen workflow: register, submit water reports with a location and optional photo evidence, track report status, and edit or delete reports while they are still new.
- Admin workflow: review incoming water reports, inspect map locations and category statistics, update report statuses, add administrative notes, and remove reports when necessary.
- SQLite persistence, password hashing, HTTP-only session cookies, input validation, photo size/type limits, security headers, and rate limiting for authentication.
- Vite development server and Express API; one server can serve the built frontend in production.

## Technology

**Frontend:** React, Vite, React Router, Leaflet / OpenStreetMap, Recharts, Lucide icons.  
**Backend:** Node.js, Express, SQLite (`better-sqlite3`), bcrypt, JWT session cookie, Multer.  
**Version control:** Git and GitHub.

## Run it in Visual Studio Code (Windows/macOS/Linux)

1. Install **Node.js 22.12+ (or Node.js 24 LTS)** and **Git**. In VS Code, open the `AquaAlert` folder.
2. Copy `server/.env.example` to `server/.env`. In VS Code, right-click `.env.example`, choose Copy, and paste it in the same folder as `.env`. Keep `.env` private; it is excluded by `.gitignore`.
3. Open **Terminal → New Terminal** in VS Code. Check the versions with `node -v` and `npm -v`.
4. Install dependencies from the project root (the folder containing this README and root `package.json`):

   ```bash
   npm install
   ```

5. Start the API and frontend together:

   ```bash
   npm run dev
   ```

6. Open **http://127.0.0.1:5173**. The API health check is **http://127.0.0.1:4000/api/health**.

The first run creates `server/data/aquaalert.db` automatically and seeds one administrator using the credentials in `server/.env`. In the example configuration, the local-only admin account is:

- Email: `admin@aquaalert.local`
- Password: `AquaAlert@123`

**Change this password and set a unique, long `JWT_SECRET` before deploying or exposing the site to the internet.** The example credentials are for local development only. Admin accounts are seeded by server configuration; the public registration form can only create citizen accounts.

## Build and verify

From the root terminal:

```bash
npm run check
npm run build
```

To run the built app with Express after building:

```bash
# Set NODE_ENV=production and configure production environment variables first.
npm start
```

For the single-server production mode, Express serves `client/dist` if the build folder exists. A production deployment also needs persistent storage for `server/data` and `server/uploads`; otherwise the SQLite data and uploaded photos may be lost when the host restarts or redeploys. Use HTTPS and a persistent disk/database on your chosen host.

## Push the project to GitHub

Create an **empty repository** on GitHub (do not add a README there if you already have this one). In the VS Code terminal, from the project root, run:

```bash
git init
git add .
git commit -m "Build AquaAlert community water reporting platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the URL with your own repository URL. GitHub may ask you to authenticate. You can also use the Source Control panel in VS Code to initialize, commit, and publish the repository.

Before the first push, verify `server/.env` is **not** staged. `.gitignore` excludes `.env`, SQLite database files, uploaded evidence photos, and build artifacts. Keep real user data and uploaded photos out of public GitHub repositories.

## Project structure

```text
AquaAlert/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── components/       # Navigation and interactive map
│       ├── pages/            # Landing, map, auth, reporting, dashboards
│       ├── api.js
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── server/
│   ├── .env.example
│   ├── data/                 # SQLite DB created locally (gitignored)
│   ├── uploads/              # Evidence photos (gitignored)
│   └── src/
│       ├── middleware/       # Authentication and role checks
│       ├── routes/           # Auth and report APIs
│       ├── db.js
│       └── index.js
├── .gitignore
├── package.json
└── README.md
```

## Main API routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a citizen account |
| `POST` | `/api/auth/login` | Public | Sign in |
| `POST` | `/api/auth/logout` | Public/session | Sign out |
| `GET` | `/api/auth/me` | Signed in | Get current user/session |
| `GET` | `/api/reports/public/stats` | Public | Aggregate homepage statistics |
| `GET` | `/api/reports/public/map` | Public | Minimal, public-safe map markers |
| `GET` | `/api/reports` | Signed in | Citizen's reports or all reports for an admin; supports `status`, `issueType`, and `search` filters |
| `POST` | `/api/reports` | Citizen | Submit a report (multipart form, optional `photo`) |
| `PUT` | `/api/reports/:id` | Owner of a new report or admin | Edit a new report or update status/admin note |
| `DELETE` | `/api/reports/:id` | Owner of a new report or admin | Delete a report |
| `GET` | `/api/health` | Public | API health check |

## Notes before a public/graded demo

- The OpenStreetMap tiles require an internet connection. Keep the visible map attribution in place and respect the tile provider's usage policy.
- The map uses user-selected coordinates. In a real deployment, define the target panchayat/ward, coordinate moderation, and decide whether exact public map pins are appropriate for every issue type.
- Admin status changes currently support an administrative note through the API. The included dashboard provides status changes; richer assignment, escalation, notification, export, and audit-trail workflows are sensible future improvements.
- This is an academic project starter, not an audited production service. Before a real public launch, add automated integration tests, CSRF protection appropriate to the deployment topology, backup/retention rules, stronger operational monitoring, and a documented privacy policy.

## Troubleshooting

- **`npm` is not recognized:** Install Node.js, restart VS Code, and check `node -v` in a fresh terminal.
- **Port 4000 is already in use:** Change `PORT` in `server/.env` and update the proxy target in `client/vite.config.js` to match.
- **Database/native dependency installation fails:** Use an active Node.js LTS release, remove `node_modules` and `package-lock.json` only if you understand this will require reinstalling dependencies, then rerun `npm install`.
- **No map tiles:** Check the internet connection; tile loading is external to AquaAlert.
- **Can't sign in as admin:** Confirm the values in `server/.env`. If the admin was already seeded, changing `ADMIN_PASSWORD` won't automatically reset the existing account's password; update it in the database or add a secure password-reset flow before deployment.
