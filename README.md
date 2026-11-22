# AXIS — Department Information and Communication Hub

**A centralized, searchable announcement platform for CPE and SKE students at Kasetsart University.**

## Team

| Name | Student ID | GitHub | Contribution areas |
| --- | --- | --- | --- |
| **Jehan Tohdeng** | 6810545514 | [@jehan-t](https://github.com/jehan-t) | UI/UX, Bookshelf, Calendar, responsive layouts, gallery |
| **Thanakorn Innok** | 6810545620 | [@NtNyx](https://github.com/NtNyx) | Content creation, attachments, Smart Dates, cover data model |
| **Piyatida Muanjaingam** | 6810545760 | [@piyatida-pm](https://github.com/piyatida-pm) | Authentication, role management, authorization and auditing |
| **Ratamon Charoenratanakun** | 6810545883 | [@ratamon2606-create](https://github.com/ratamon2606-create) | Database/environment setup, integration, testing, CI/CD and deployment |

---

[![CI](https://github.com/ratamon2606-create/AXIS/actions/workflows/ci.yml/badge.svg)](https://github.com/ratamon2606-create/AXIS/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.29-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[**Live application**](https://axis-isp.vercel.app/) · [**Build & run**](#getting-started-local-development) · [**Documentation**](#documentation) · [**CI results**](https://github.com/ratamon2606-create/AXIS/actions/workflows/ci.yml)

> **Academic project notice:** AXIS is a student-developed software engineering project, not an officially operated Kasetsart University information service. The hosted demonstration uses free-tier services and may not always be available.

## Table of contents

- [Overview](#overview)
- [Core features](#core-features)
- [Roles and permissions](#roles-and-permissions)
- [Architecture and design decisions](#architecture-and-design-decisions)
- [Technology stack](#technology-stack)
- [Getting started (local development)](#getting-started-local-development)
- [Building and running a production build](#building-and-running-a-production-build)
- [Testing and continuous integration](#testing-and-continuous-integration)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Development process](#development-process)
- [Troubleshooting](#troubleshooting)
- [Security and data safety](#security-and-data-safety)
- [Release status and limitations](#release-status-and-limitations)
- [Team](#team)

## Overview

Department information—scholarships, internships, activities, alerts, forms, and other announcements—was spread across Discord, university portals, course platforms, and forwarded email. Students could miss important updates and struggle to find them again.

**AXIS** provides one place to publish, discover, organize, and revisit department information, with separate permissions for visitors, readers, editors, and administrators.

The team developed AXIS across **six iterations** for the **Individual Software Development Process (ISP), 2026** course. Our process applied requirements engineering, SRS, iterative planning, version control, integration, automated quality checks, and deployment.

## Core features

| Area | Capabilities |
| --- | --- |
| Announcements | News, Opportunities, Activities, Alerts, and Documents |
| Discovery | Home feed, search, filters, Bookshelf and List views, Saved posts, and Calendar |
| Publishing | Drafts, publishing, audience/year targeting, Smart Dates, and follow-up updates |
| Content lifecycle | Deadlines, event periods, archive policy, current and past posts |
| Attachments | Private files, image previews, gallery carousel, thumbnails, and selectable cover images |
| Identity and management | University Google sign-in, account roles, profiles, allowlist, and audit logging |

### Roles and permissions

| Action | Visitor | Reader | Editor | Admin |
| --- | :---: | :---: | :---: | :---: |
| View public announcements | Yes | Yes | Yes | Yes |
| View authorized university-only posts | No | Yes | Yes | Yes |
| Browse, search, and use Calendar | Yes | Yes | Yes | Yes |
| Save announcements | No | Yes | Yes | Yes |
| Create announcements | No | No | Yes | Yes |
| Edit announcements | No | No | Own posts | Authorized posts |
| Manage user roles and administrative logs | No | No | No | Yes |

**Target audience is not an access permission.** Program and year help identify *relevant* content. Visibility, publication status, and server-side authorization determine who may actually access or modify it.

## Architecture and design decisions

AXIS follows a **modular monolith** architecture. One Next.js application handles the UI and server-side logic, with internally separated modules for authentication, authorization, business rules, validation, and database access.

This design was selected because a four-person project with one main content domain does not require the extra deployment and communication complexity of independent microservices.

```text
                     Browser
                        |
                     Next.js
              (UI + Server Actions)
                 /          \
        Auth.js / RBAC     Business Logic
                 \          /
                    Prisma
                       |
                  PostgreSQL

          Protected attachment routes
                       |
             S3-compatible storage
```

**Key decisions**

- **PostgreSQL and Prisma** store structured, relational records: users, content items, follow-up threads, saved items, attachment metadata, and audit events.
- **S3-compatible object storage** keeps binary attachments separate from the database. File download links are issued only after an access check and expire after five minutes.
- **Shared read policies** apply the same visibility and content-lifecycle rules to feeds, search, details, and related entry points.
- **Google OAuth + role-based authorization** distinguish who a user is from what they are allowed to do.
- **Smart Dates** distinguish registration deadlines, event periods, and archiving instead of overloading one date field.

| Layer | Local development | Hosted release |
| --- | --- | --- |
| Web application | Next.js with Node.js | Vercel |
| Relational data | PostgreSQL 16 (Docker Compose) | Supabase PostgreSQL |
| File storage | MinIO (Docker Compose) | Supabase Storage |
| Authentication | Google OAuth / Auth.js | Google OAuth / Auth.js |
| Quality checks | npm scripts and Vitest | GitHub Actions |

> The checked-in `source/docker-compose.yml` starts **PostgreSQL and MinIO**, not the Next.js app. Start Next.js separately with `npm run dev` or `npm run start`.

## Technology stack

| Area | Technologies |
| --- | --- |
| Framework | Next.js 15.5.29, React 18 |
| Language and UI | TypeScript, Tailwind CSS |
| Authentication | Auth.js / NextAuth, Google OAuth 2.0 |
| Database | PostgreSQL, Prisma 5.22 |
| Storage | AWS SDK, S3-compatible API, MinIO for local development |
| Testing | Vitest, TypeScript |
| CI/CD | GitHub Actions, Vercel |
| Local infrastructure | Docker, Docker Compose |

The application manifest specifies **Node.js 22.x**.

## Getting started (local development)

### Prerequisites

- Git
- **Node.js 22.x** and npm
- Docker Engine or Docker Desktop with **Docker Compose v2**
- A Google Cloud OAuth client configured with a local callback
- Available ports **3000**, **5432**, **9000**, and **9001** (or an appropriately adapted local configuration)

### 1. Clone the repository

```bash
git clone https://github.com/ratamon2606-create/AXIS.git
cd AXIS/source
node --version
npm --version
```

The `node --version` output should show version **22.x**.

### 2. Install dependencies

```bash
npm ci
```

`npm ci` installs from the committed lockfile and is preferred over an unpinned installation.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `source/.env` and replace **all placeholder values**. See the tracked [environment template](source/.env.example).

| Variable | Purpose |
| --- | --- |
| `POSTGRES_PASSWORD` | Local PostgreSQL password |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Local MinIO credentials |
| `DATABASE_URL` | PostgreSQL connection string, with the same password as the container |
| `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT` | Server-side and browser-reachable object storage endpoints |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Credentials matching the MinIO account |
| `S3_BUCKET`, `S3_REGION` | S3-compatible storage bucket and region |
| `AUTH_SECRET` | Strong authentication secret |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client ID and secret |
| `ALLOWED_EMAIL_DOMAINS` | Approved account domains, e.g., `ku.th` |

Generate a local authentication secret with:

```bash
openssl rand -base64 32
```

In Google Cloud, register the authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

Also configure `http://localhost:3000` as an authorized JavaScript origin where applicable, and allow your test users if the Google OAuth app is in testing mode.

**Never commit `.env`, credentials, database passwords, or OAuth secrets.** If your database password contains URL-special characters, URL-encode it in `DATABASE_URL`.

### 4. Start PostgreSQL and MinIO

From the `source/` directory:

```bash
docker compose up -d
docker compose ps
```

| Service | Local endpoint |
| --- | --- |
| PostgreSQL | `127.0.0.1:5432` |
| MinIO API | `http://127.0.0.1:9000` |
| MinIO Console | `http://127.0.0.1:9001` |

The Compose configuration creates persistent `dbdata` and `miniodata` volumes, and a helper initializes the `hub-files` bucket.

### 5. Prepare the local database

For a **new local development database**:

```bash
npx prisma generate
npx prisma db push
```

`prisma db push` is convenient for a disposable local environment. The repository also includes committed Prisma migrations for controlled release changes.

**Optional: destructive demo seed**

The seed script **deletes existing database records**, including users, announcements, saved items, attachments, and audit logs. Run it **only on a disposable local database**:

```bash
ALLOW_DESTRUCTIVE_SEED=YES_LOCAL_ONLY npm run db:seed
```

This is the exact opt-in value required by `source/prisma/seed.ts`. The script refuses to run in production. **Never run the seed on shared or production data.**

### 6. Run the application

```bash
npm run dev
```

Open **http://localhost:3000**.

Public content can be browsed as a visitor; university-only content and privileged actions require an eligible Google account.

### 7. Stop the local environment

Stop the Next.js process with `Ctrl+C`, then:

```bash
docker compose down
```

This preserves named volumes. **Do not run `docker compose down -v` unless you intend to delete all local database and object-storage data in those volumes.**

## Building and running a production build

After configuring the environment and starting its dependent services:

```bash
cd source
npm ci
npx prisma generate
npm run build
npm run start
```

The default server listens on **http://localhost:3000**. A production-style local build still requires the configured database, authentication, and file storage for the relevant runtime workflows.

### Hosted deployment checklist

1. Provision PostgreSQL and S3-compatible object storage. Configure Google OAuth for the actual deployed domain.
2. Set the required environment variables in the hosting provider's secure settings, **not in Git**.
3. Back up existing production data and review schema migrations. Use `npx prisma migrate deploy` for committed migrations against the intended database.
4. Deploy the Next.js application with `source/` as the project root. AXIS uses Vercel for its hosted release.
5. Verify sign-in, access control, Create/Edit, search, uploads, file previews, cover selection, and major navigation routes in the deployed environment.

Never execute destructive seeding, `prisma db push --force-reset`, or `docker compose down -v` against a production dataset.

## Testing and continuous integration

From `source/`, run the project verification script:

```bash
npm run verify
```

You can also run checks individually:

```bash
npm run typecheck          # TypeScript validation
npm test                   # Vitest unit and regression tests
npm run security:gate      # Next.js version and lockfile checks
npm run quality:comments   # Source comment policy
npm run build              # Production build
```

The [GitHub Actions workflow](.github/workflows/ci.yml) also validates the Prisma schema, generates the Prisma client, audits production dependencies, builds the application, and runs a limited smoke test.

**Documented final release evidence (22 November 2026):** 84 automated tests passed across 15 files, and the release build and deployment checks passed. The automated smoke test serves the public `/denied` route; it does **not** prove that live Google OAuth, uploads, storage permissions, and all browser workflows work end to end. Those require separate manual acceptance checks.

## Project structure

```text
AXIS/
├── .github/
│   └── workflows/ci.yml       # Continuous integration
├── docs/
│   ├── report/                # SRS and iteration reports
│   ├── diagram/               # KAOS, activity/sequence and use-case diagrams
│   └── chart/                 # Planning exports
├── source/
│   ├── .env.example           # Environment template
│   ├── docker-compose.yml     # PostgreSQL and MinIO locally
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app/               # Routes, actions, API
│   │   ├── components/        # UI components
│   │   └── lib/               # Business rules, auth, storage and validation
│   ├── scripts/               # Security and quality checks
│   └── package.json
└── README.md
```

## Documentation

The following links point to files and folders **verified in this repository**:

| Resource | Link |
| --- | --- |
| Original SRS / Software Proposal | [AXIS SRS](docs/report/AXIS_ISP.pdf) |
| Iteration 1 report | [Iteration 1](docs/report/AXIS_Iteration1_Report.docx%20%281%29.pdf) |
| Iteration 2 report | [Iteration 2](docs/report/AXIS_Iteration2_Report.docx.pdf) |
| Iteration 3 report | [Iteration 3](docs/report/AXIS_Iteration3_Report.docx.pdf) |
| Iteration 4 report | [Iteration 4](docs/report/AXIS_Iteration4_Report.docx.pdf) |
| Iteration 5 report | [Iteration 5](docs/report/AXIS_Iteration5_Report.docx.pdf) |
| Iteration 6 report | [Iteration 6](docs/report/AXIS_Iteration6_Report.docx.pdf) |
| KAOS, activity, sequence, and use-case diagram sources | [Diagrams](docs/diagram/) |
| Planning and Gantt chart exports | [Charts](docs/chart/) |
| CI workflow and run results | [GitHub Actions](https://github.com/ratamon2606-create/AXIS/actions/workflows/ci.yml) |
| Production application | [AXIS on Vercel](https://axis-isp.vercel.app/) |

Some diagram/chart files are JSON exports, not rendered images. Files that are not present in the repository are intentionally not linked as though they were already published.

## Development process

We used a repeatable workflow: **requirements and sprint planning → task ownership → feature branches → integration → verification → retrospective and scope adjustment**.

| Iteration | Focus | Main outcomes |
| --- | --- | --- |
| 1 | Secure foundation | University login, roles, Create/Edit, feed, 22 manual tests |
| 2 | Complete content lifecycle | Protected attachments, expiry/past workflow, roles/audit, CI |
| 3 | Discovery | Bookshelf/List, Home/Saved, Calendar, follow-up images, program/audience correction |
| 4 | Responsive UX | Mobile/desktop usability, accessible alternative views, responsive editor/admin pages |
| 5 | Maintainability and reliability | Smart Dates, shared validation, authorization safeguards, refactoring, 63 tests |
| 6 | Release preparation | Ten-image follow-ups, carousel, cover selection, 84 tests, hosted deployment |

Changes were organized using feature branches and pull requests. Re-run automated checks before integration and carefully review any changes affecting access control, file handling, or schema migrations.

## Troubleshooting

| Problem | Check / suggested action |
| --- | --- |
| Wrong Node.js version | Use **Node 22.x**; re-run `npm ci` |
| PostgreSQL or MinIO unavailable | Run `docker compose ps` and `docker compose logs db minio`; check ports 5432/9000/9001 |
| Prisma cannot connect | Verify `DATABASE_URL`, the PostgreSQL password, and that the container is healthy |
| OAuth `redirect_uri_mismatch` | Make the configured Google callback match the actual host and `/api/auth/callback/google` path |
| Non-KU login denied | Check `ALLOWED_EMAIL_DOMAINS`, Google OAuth test users, and app access rules |
| Browser upload fails | Check `S3_PUBLIC_ENDPOINT`, object-storage CORS, and the origin `http://localhost:3000` |
| Files cannot be previewed | Verify bucket/credentials, permitted content visibility, and signed-link expiry |
| UI or routes appear stale | Stop Next.js, remove only the local `source/.next` build cache, and restart |
| CI/build fails | Run `npm ci`, `npx prisma generate`, and `npm run verify`; inspect the earliest error |

## Security and data safety

- Enforce access control **on the server**, not only by hiding UI buttons.
- Use permission-checked access to private attachments; presigned links expire after five minutes.
- Validate upload count, file type, and size. Current upload handling supports up to **10 files per upload**, **20 MB per file**, and **200 MB total**; follow-up updates support up to **10 images**.
- Never commit `.env`, OAuth credentials, passwords, storage keys, database exports, or real student data.
- Back up live data and review migrations before changing production schemas.
- A green CI status does not replace browser acceptance tests or an independent security audit.

## Release status and limitations

The documented academic release reached a **READY** Vercel deployment with Supabase services on **22 November 2026**. The hosted version uses free-tier infrastructure and may be affected by usage or availability limits.

**Deferred scope:** Facebook imports, AI-assisted extraction, and iCalendar subscriptions were not part of the final delivered release. Manual content publishing remains the core workflow.

**Verification boundary:** Automated unit tests and limited smoke tests do not prove every OAuth, storage, permission, or browser workflow. The project does not claim a complete penetration test or guaranteed uptime.



**Developed for Individual Software Development Process (ISP), Kasetsart University, 2026.**

**License:** No repository license file was found during this review. Please do not assume a right to copy, modify, or redistribute the source without appropriate permission.
