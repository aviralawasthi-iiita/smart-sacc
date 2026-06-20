# Smart SAC (Student Activity Center)

Smart SAC is an enterprise-grade, real-time Student Activity Center management platform. It digitizes operations, connects students with similar interests, and streamlines administrative tracking of sports equipment and facility issues.

The application is split into a robust **Node.js/Express Backend** and a highly interactive **React/Vite Frontend**, orchestrated by Docker and backed by MongoDB and Redis.

---

## 🌟 Comprehensive Feature Set

### 🧑‍🎓 Student Portal
*   **Authentication & Session Management:**
    *   Secure JWT-based authentication using HTTP-only cookies.
    *   Email verification workflows via Nodemailer.
    *   Password recovery flows.
*   **Profile & Activity Tracking:**
    *   Customizable profiles with profile picture uploads (handled via Cloudinary).
    *   Tracking of personal achievements, favorite games, and self-rated skill levels to facilitate matchmaking.
*   **Player Networking (Matchmaking):**
    *   Browse other students based on their game preferences and ratings.
    *   Find partners for table tennis, badminton, chess, and more.
*   **Real-time Chat System:**
    *   WebSocket-powered one-on-one and room-based chat using `Socket.io`.
    *   Real-time online status indicators and typing events.
*   **Equipment Checkout Flow:**
    *   Browse available sports equipment in real-time.
    *   Request equipment and view active/historical checkout logs.
*   **Ticketing & Complaints Desk:**
    *   Submit maintenance requests or complaints.
    *   Track ticket status (Open, In Progress, Resolved) and communicate directly with admins.

### 🛡️ Administration Dashboard
*   **Analytics Overview:**
    *   Visual representation of platform metrics using Recharts.
    *   Live view of active users, equipment in-use vs. available, and pending tickets.
*   **Inventory & Equipment Management:**
    *   Full CRUD capabilities for the equipment repository.
    *   Assign equipment directly to students via their Roll Number or Email.
    *   Track historical usage logs to identify lost or broken items.
*   **User Moderation:**
    *   Approve "Pending Users" to restrict platform access only to verified university students.
    *   View full student directories and their activity logs.
*   **Announcement Broadcasting:**
    *   Create and publish rich-text announcements visible immediately on all student dashboards.
*   **Facility/Game Configurations:**
    *   Manage available games, updating the centralized catalog that drives student matchmaking.

---

## 🏗️ In-Depth Architecture & Tech Stack

### Frontend Architecture (`/frontend`)
The frontend is a React 18 Single Page Application (SPA) built for extreme modularity and responsiveness.
*   **Core Framework:** React 18 with TypeScript, bundled by Vite for HMR and optimized builds.
*   **Routing:** `react-router-dom` (v6) implementing layout routes, protected routes (Auth Guards), and role-based access control (Admin vs. Student).
*   **State & Data Fetching:** `@tanstack/react-query` handles server state, caching, background synchronization, and optimistic UI updates.
*   **UI/UX & Styling:**
    *   **Tailwind CSS** for atomic, utility-first styling.
    *   **shadcn/ui** providing unstyled, accessible Radix UI primitives that are heavily customized for a premium look (Glassmorphism, dark mode capabilities).
    *   **Lucide React** for consistent iconography.
    *   **Embla Carousel** and **Recharts** for interactive data components.
*   **Forms:** `react-hook-form` paired with `zod` for rigorous client-side schema validation before data hits the API.

### Backend Architecture (`/backend`)
The backend is an Express-based REST API with integrated WebSockets, utilizing a layered controller-model-middleware architecture.
*   **Core Server:** Node.js + Express.js (v5).
*   **Database (MongoDB + Mongoose):**
    *   Schema definitions for `User`, `Admin`, `Game`, `Equipment`, `EquipmentHistory`, `Message`, `Room`, `Ticket`, and `Announcement`.
    *   Aggregations used for generating admin dashboard statistics.
*   **Caching & Optimization (Redis):**
    *   `ioredis` is used as a caching layer to reduce MongoDB load.
    *   Caches frequently accessed data (like auth tokens, configurations) with fallback mechanisms if the Redis instance drops.
*   **Real-time Engine:** `Socket.io` attached to the Express HTTP server, utilizing JWT verification during the WebSocket handshake to prevent unauthorized event emitting.
*   **Media Management:** `multer` intercepts multipart/form-data, temporarily storing files before uploading them directly to **Cloudinary** via their SDK.
*   **Security & Auth:**
    *   Bcrypt for salting and hashing passwords.
    *   Short-lived Access Tokens and long-lived Refresh Tokens (JWT) stored in secure cookies (`cookie-parser`).

---

## 🚀 DevOps, CI/CD, and Deployment

### Dockerized Infrastructure
The entire platform is containerized for seamless local development and production parity.
*   **Frontend Container:** Multi-stage build. Compiles the React app via Node alpine and serves the static `/dist` folder using a lightweight `nginx:alpine` image. Includes SPA routing fallbacks in `nginx.conf`.
*   **Backend Container:** Node 18 alpine image running the Express API.
*   **Service Containers:** Official `mongo:latest` and `redis:alpine` images spun up alongside the app.
*   **Docker Compose:** Orchestrates the bridge network, maps persistent named volumes (`mongodb_data`, `redis_data`), and automatically injects service hostnames as environment variables.

### GitHub Actions Pipeline
A production-grade `.github/workflows/ci.yml` pipeline is established to ensure code reliability:
1.  **Monorepo Path Filtering:** `dorny/paths-filter` guarantees frontend jobs only run on frontend edits, and backend jobs on backend edits.
2.  **Dependency Caching:** Built-in `actions/setup-node` caching slashes workflow execution times.
3.  **Frontend Validation:** Enforces strict TypeScript checks (`tsc --noEmit`) and tests the Vite production build.
4.  **Backend Integration Testing:** Spins up ephemeral Mongo and Redis service containers directly within the GitHub Runner to execute actual integration tests.
5.  **Docker Dry-Runs:** Automatically executes `docker compose build` on every PR to guarantee Dockerfiles are never broken by code merges.

---

## 🛠️ Local Development Setup

### 1. Requirements
*   Node.js 18+
*   Docker & Docker Compose (Optional, but highly recommended)

### 2. Quick Start via Docker
The easiest way to boot the entire stack:
```bash
# In the root directory of the project
docker compose up --build
```
*   Frontend will be available at: `http://localhost:5173`
*   Backend will be available at: `http://localhost:8000`

### 3. Manual Startup (Without Docker)

**Backend Setup:**
1.  Navigate to `/backend` and run `npm install`.
2.  Create a `.env` file based on `.env.example`. You will need a local MongoDB URI (`mongodb://localhost:27017/Smart-Sac`) and a Redis URI.
3.  Run the development server: `npm run dev`.
4.  *(Optional)* Seed the database with dummy data: `npm run seed` and `node seed-student.js`.

**Frontend Setup:**
1.  Navigate to `/frontend` and run `npm install`.
2.  Create `/frontend/.env.development` with: `VITE_API_BASE_URL=http://localhost:8000/api/v1`
3.  Run the Vite dev server: `npm run dev`.

---

## 📂 Project Structure Overview

```text
Smart-Sac/
├── .github/workflows/    # CI/CD Pipelines
├── docker-compose.yml    # Infrastructure orchestration
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components (shadcn, etc)
│   │   ├── pages/        # View-level components (Admin/Student dashboards)
│   │   ├── lib/          # Utilities and API config
│   │   └── main.tsx      # Application entrypoint
│   ├── Dockerfile        # Multi-stage Nginx build
│   └── nginx.conf        # Web server routing rules
└── backend/              # Node.js API
    ├── src/
    │   ├── controllers/  # Business logic & request handling
    │   ├── middlewares/  # JWT Auth & Error handlers
    │   ├── models/       # Mongoose Schemas
    │   ├── db/           # Mongo & Redis connection singletons
    │   └── app.js        # Express app initialization
    └── Dockerfile        # Node alpine build
```
