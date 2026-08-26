# ⚡ Vortex Tiers Staff Application Platform (`apply.vortextiers.xyz`)

> **Production-grade staff recruitment, candidate evaluation, and review platform for the Vortex Tiers Minecraft PvP tiering community.**

Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Radix UI**, **Supabase PostgreSQL (Prisma)**, **Google Drive API (Chunked Resumable Uploads)**, **Discord OAuth2**, and **Resend** transactional emails. Deployable directly to **Vercel Serverless**.

---

## 🌟 Key Features

### 1. Ecosystem Visual Identity & Experience
- **Tailored Design System**: Faithful to `vortextiers.xyz` and `verify.vortextiers.xyz` brand palette (Obsidian dark `#0f1319`, Gold accent `#f59e0b`, Emerald `#10b981`, Inter + JetBrains Mono typography).
- **Supported PvP Modes**: Official support for all 8 Vortex Tiers disciplines: *Crystal, Netherite Pot, Pot (Nodebuff), Sword, UHC, SMP, Axe, Mace*.
- **Minecraft Player Avatar Integration**: Dynamic player skin head rendering via Minotar with Steve fallback.

### 2. Applicant Workflow & Multi-Step Wizard
- **Discord OAuth2 Identity**: Zero-password authentication capturing Discord ID, username, avatar, and verified email.
- **5-Step Application Wizard**:
  1. **Applicant Identity & Minecraft Profile**: Discord verification status + Minecraft Java IGN input with live skin head avatar.
  2. **Staff Position & Mode Selection**: Interactive cards for *Tier Tester, Moderator, Trial Staff, Event Staff* with PvP specialty tagging.
  3. **Dynamic Question Renderer**: Short text, paragraphs with live character limit meters (`142 / 500`), MCQs, multi-select, number, and URL fields.
  4. **Resumable Evidence Uploader**: Direct chunked streaming (bypassing Vercel's 4.5MB serverless limit) with progress tracking for gameplay videos, duel clips, and screenshots.
  5. **Review & Confirmation**: Full summary breakdown with required accuracy affirmation before final submission lock.
- **Debounced Autosave**: Automatic draft persistence (1.2s debounce) with real-time status indicator pill (*"Draft saved"*, *"Autosaving..."*).
- **Applicant Dashboard**: Live application tracking, status badge indicators (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`), and reviewer feedback.

### 3. Comprehensive Staff Review Suite (`/admin`)
- **Operational Overview**: Real-time metrics for Pending, Under Review, Accepted, and Acceptance Rate.
- **Application Management Table**: Server-side search (ID, Discord ID, IGN, Email), status filters, position/mode filters, and pagination.
- **Immutable Question Snapshots**: Reviewers evaluate responses against the exact question snapshot captured at submission time, ensuring historic integrity even if active questions change.
- **Media Lightbox & HTML5 Video Player**: Stream gameplay evidence directly through authenticated proxy routes (`/api/drive/file/[fileId]`).
- **Private Internal Notes Thread**: Private reviewer comments and second-opinion remarks completely isolated from applicants.
- **Decision Modals**:
  - **Accept Modal**: Optional customized welcome remarks and Discord onboarding instructions dispatched via email.
  - **Reject Modal**: Optional polite constructive feedback dispatched via email.
- **Status History & Audit Timeline**: Chronological log of every status transition and sensitive admin action.
- **Decoupled Transactional Email Delivery**:
  - Dedicated `EmailEvent` audit log tracking Resend provider IDs, attempt counts, and timestamps.
  - Single-click **"Resend Email Notification"** retry mechanism from the reviewer suite.

### 4. Admin Management Controls
- **Dynamic Question Builder**: Full CRUD, reordering, validation rules, position targeting, and live preview.
- **Staff Positions Manager**: Add, edit, reorder, and configure evidence requirements for staff roles.
- **Game Modes Manager**: Manage supported PvP modes and ordering.
- **Platform Settings**: Toggle applications open/closed, configure rejection cooldowns (default 14 days), upload size limits, and announcement banners.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
  User([Applicant / Staff]) -->|HTTPS / OAuth2| Vercel[Vercel Serverless Next.js 14]
  Vercel -->|Database Queries| Supabase[(Supabase PostgreSQL / Prisma)]
  Vercel -->|Resumable Chunk Stream| GDrive[(Google Drive API v3)]
  Vercel -->|Transactional Emails| Resend[Resend API]
  Vercel -->|Auth Identity| Discord[Discord OAuth2 API]
```

- **Frontend & Server**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Radix UI Primitives.
- **Database**: PostgreSQL (Prisma ORM) with graceful in-memory dev fallback (`store.ts`).
- **File Storage**: Google Drive API v3 (Folder Hierarchy: `Root / <Year> / VT-<ID> - <Username> / {Images, Videos, Documents}`).
- **Authentication**: Discord OAuth2 with HMAC-SHA256 HttpOnly signed session cookies.
- **Email Delivery**: Resend API (`no-reply@vortextiers.xyz`).

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18.x or 20.x
- npm / yarn / pnpm

### 2. Clone & Install
```bash
git clone https://github.com/vortextiers/staff-apply.git
cd staff-apply
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your configuration:
```env
# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Discord OAuth2 (https://discord.com/developers/applications)
DISCORD_CLIENT_ID="1422296301768540240"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/callback"
ADMIN_DISCORD_IDS="1422296301768540240"

# Session Security
SESSION_SECRET="generate_a_random_32_character_secret_here"

# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL="vortex-drive@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...=\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID="your_google_drive_folder_id"

# Resend Transactional Email (https://resend.com)
RESEND_API_KEY="re_your_resend_api_key_here"
RESEND_FROM_EMAIL="no-reply@vortextiers.xyz"
```

### 4. Database Push & Seeding
```bash
# Push Prisma schema to your database
npx prisma db push

# Seed initial 8 Game Modes, 4 Staff Positions, and 9 Core Questions
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suite

### Unit & Integration Tests (Vitest)
```bash
npm test
```
Runs comprehensive test suites for:
- Session token generation, HMAC-SHA256 signatures, and tamper protection.
- Zod validation schemas and Minecraft IGN regex matching.
- Google Drive MIME categorization, filename sanitization, and token verification.
- Application state machine transitions and RBAC permissions.

### End-to-End Tests (Playwright)
```bash
npx playwright test
```

---

## 🚢 Deploying to Vercel

1. **Import Repository**: Connect your GitHub repository to Vercel.
2. **Framework Preset**: Next.js.
3. **Environment Variables**: Add all variables from `.env` in the Vercel Project Settings.
4. **Discord OAuth**: Ensure `https://apply.vortextiers.xyz/api/auth/callback` is added to your Discord Developer Portal **Redirects**.
5. **Google Drive**: Ensure the Google Service Account email has **Editor** permissions on your Google Drive root folder.
6. **Deploy**: Click Deploy. Vercel will automatically build and deploy the serverless functions.

---

## 🛡️ Security Highlights

- **RBAC Guards**: Multi-layer authorization guards (`requireAuth`, `requireReviewer`, `requireAdmin`) protecting all API routes and server components.
- **IDOR Protection**: Strict applicant ownership verification prevents candidates from viewing or tampering with another user's application draft or evidence files.
- **Decoupled Email Failure Handling**: Application status changes never roll back due to email provider rate limits or downtime. Failures are captured in `EmailEvent` for review and retry.
- **Chunked Resumable Uploads**: Multi-megabyte video files are streamed in 2MB chunks directly to Google Drive, ensuring standard serverless memory limits are never exceeded.

---

## 📜 License
Internal proprietary software developed exclusively for **Vortex Tiers**.
