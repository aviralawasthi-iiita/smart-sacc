

# SAC-MAIN

SAC-MAIN is a two-part project that modernizes a Student Activity Center (Smart SAC). It includes:

- A React + Vite frontend (frontend) built with TypeScript, Tailwind CSS and shadcn-ui.
- A Node.js backend (backend) with Express for API and server-side logic.

This README consolidates everything you need to understand, run, and develop the project — all in one file.

---

## Table of contents

1. Project overview
2. Repository layout
3. Frontend: frontend
   - Features
   - Quick start
   - Important files
   - Environment variables
4. Backend: backend
   - Features
   - Quick start
   - Important files & exports
   - Environment variables & scripts
5. Development workflow
6. Common tasks & commands
7. Troubleshooting
8. Contributing
9. License

---

## 1. Project overview

SAC-MAIN aims to provide a modern interface for student activity center management, including real-time equipment tracking, player connections, and booking flows. The project is split into two main directories:

- Frontend (client SPA): `frontend/`
- Backend (API server): `backend/`

Both parts are developed and run independently during development; they communicate via REST endpoints.

---

## 2. Repository layout

Top-level folders and notable files:

- [frontend/](frontend/)
  - [frontend/package.json](frontend/package.json)
  - [frontend/.env.development](frontend/.env.development)
  - [frontend/src/main.tsx](frontend/src/main.tsx)
  - [frontend/index.html](frontend/index.html)
  - [frontend/bun.lockb](frontend/bun.lockb)
  - [frontend/README.md](frontend/README.md)
- [backend/](backend/)
  - [backend/package.json](backend/package.json)
  - [backend/src/app.js](backend/src/app.js)
  - [backend/src/constants.js](backend/src/constants.js)
  - [backend/.npmrc](backend/.npmrc)
- Root-level:
  - [README.md](README.md) ← this file

Use the above links to open files inside the workspace.

---

## 3. Frontend: frontend

Purpose: Single Page Application for Smart SAC admin & student dashboards, authentication, and booking UX.

Tech stack:
- Vite
- React + TypeScript
- Tailwind CSS
- shadcn-ui components
- lucide-react icons

Key features:
- Admin & student dashboards
- Authentication UI pages (login)
- Theme provider integration and global styles

Quick start (frontend)
1. Open a terminal and change directory:
   npm install
   cd frontend
   npm install
2. Start the dev server with Vite:
   npm run dev

(Use the integrated IDE terminal or external terminal; Vite runs on a default port and provides hot reload.)

Important files:
- Entry: [frontend/src/main.tsx](frontend/src/main.tsx) — bootstraps the React app and registers [`ThemeProvider`](frontend/src/components/ThemeProvider.tsx) (imported in main.tsx).
- HTML template: [frontend/index.html](frontend/index.html)
- Environment for dev API base URL: [frontend/.env.development](frontend/.env.development) — contains:
  - VITE_API_BASE_URL=http://localhost:8000/api/v1
- Lock file (binary, Bun): [frontend/bun.lockb](frontend/bun.lockb)

Notes:
- The frontend expects an API at VITE_API_BASE_URL while developing. Ensure the backend is running at that address (default in examples is http://localhost:8000).

---

## 4. Backend: backend

Purpose: REST API and server-side logic for Smart SAC including authentication, resource endpoints, image uploads, and any server middleware.

Tech stack:
- Node.js (ES Modules)
- Express (v5.x)
- dotenv for environment variables
- bcrypt, jsonwebtoken, cloudinary, etc. (see dependencies)

Quick start (backend)
1. Open a terminal and change directory:
   cd backend
   npm install
2. Start the server in development:
   npm run dev

Scripts (from [backend/package.json](backend/package.json)):
- dev: nodemon -r dotenv/config --experimental-json-modules src/index.js
- seed: node --experimental-json-modules src/seed.js

Important files & exports:
- Server setup & main express app: [backend/src/app.js](backend/src/app.js)
  - Exports: [`app`](backend/src/app.js) — exported as `export {app};` at the end of file.
  - The file contains global error handling (see the "Unhandled Error" handler).
- Constants: [backend/src/constants.js](backend/src/constants.js) — exports database name `DB_Name`.
- Package metadata & scripts: [backend/package.json](backend/package.json)
- Local npm configuration: [backend/.npmrc](backend/.npmrc) (sets local install prefix in the workspace sample)

Backend environment variables (typical)
- PORT — port to run the API server (often 8000 in this project)
- MONGO_URI or other DB connection string (if using MongoDB)
- JWT_SECRET — JSON Web Token secret for auth
- CLOUDINARY_* — cloudinary config for image uploads (if used)
- Any other provider keys your server expects

(There is no single env file shown in the workspace excerpt; create `.env` or pass environment variables in your hosting environment.)

---

## 5. Development workflow

- Frontend and backend run independently.
- Frontend uses Vite dev server and reads API URL from [frontend/.env.development](frontend/.env.development).
- Backend runs via nodemon (auto-restarts) using `npm run dev` in `backend/`.

Recommended order to start while developing locally:
1. Start the backend: cd backend && npm run dev
2. Start the frontend: cd frontend && npm run dev
3. Open the frontend app shown by Vite (default localhost:5173) — it will call the backend at configured VITE_API_BASE_URL.

Use your IDE integrated terminal or the workspace terminal for logs. Vite and nodemon both print startup output to the terminal.

---

## 6. Common tasks & commands

From repository root, use separate terminals for each subproject.

Frontend (frontend)
- Install deps: cd frontend && npm install
- Start dev server: npm run dev
- Build for production: npm run build (if present in package.json)
- Preview production build: npm run preview (if present)

Backend (backend)
- Install deps: cd backend && npm install
- Start dev server: npm run dev
- Seed DB (if seeder exists): npm run seed

General
- Run linting / formatting tools if configured (check package.json in each folder for scripts).
- Inspect logs in the integrated terminal for errors. Use the IDE output panes as needed.

---

## 7. Troubleshooting

- Frontend can't reach API:
  - Confirm backend is running on the address in [frontend/.env.development](frontend/.env.development).
  - Check browser console and Vite terminal for CORS or network errors.
- Backend server crashes:
  - Inspect [backend/src/app.js](backend/src/app.js) console error output and nodemon logs.
  - Confirm required environment variables are set.
- Dependency issues:
  - Delete node_modules and reinstall (npm ci or npm install).
  - For bun.lockb usage: if you switch to Bun, the lock file is [frontend/bun.lockb](frontend/bun.lockb). Use Bun commands only if you choose Bun as runtime.

---

## 8. Contributing

- Branch from `main` for new features or fixes.
- Keep changes scoped to either `frontend/` or `backend/` as appropriate.
- Add tests where possible and update the README when you add major features.

---

## 9. License

- Check root or each package.json for the declared license. Example: [backend/package.json](backend/package.json) shows "license": "ISC".
- Update license info here if you apply a different license.

---

