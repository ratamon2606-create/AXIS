# Department Information and Communication Hub

A web application for the CPE/SKE department that provides a single, searchable source for department announcements and related information.

The project is designed for students, content editors, and department administrators. It focuses on making department information easier to find, easier to update, and safer to access according to each user's permissions.

## Project Goals

Department information is often spread across multiple channels such as Discord, university portals, course platforms, and email. This can make important announcements difficult to find and easy to miss.

This project provides one place where users can:

- browse department announcements,
- search by keyword,
- sign in with a university Google account,
- view information according to visibility rules,
- create and edit announcements when authorized,
- keep follow-up updates connected to the original post.

## Core Features

### Authentication

- Google OAuth 2.0 through Auth.js
- Only approved university email domains are accepted
- New users receive the default `READER` role
- Pre-approved accounts can receive a role from the allowlist
- Server-side authorization protects write operations

### Multi-role Access

The system supports role-based access such as:

- `READER` — read available department information
- `EDITOR` — create and edit announcements
- `ADMIN` — administrative permissions and role management

Authentication answers **who the user is**, while authorization determines **what the user is allowed to do**.

### Feed and Visibility

Published content is filtered through a shared visibility rule.

The project follows a **one rule, one place** design: Feed, Search, and other read paths reuse the same visibility policy instead of implementing separate versions of the rule.

This reduces duplicated logic and helps prevent inconsistent access control.

### Search

Users can search announcement content by keyword.

The current search:

- searches both `title` and `body`,
- uses case-insensitive matching,
- searches both current and past announcements,
- applies the same shared visibility policy as the feed/archive,
- performs filtering through the database query rather than loading all records into the application first.

### Content Types

All supported announcement types use one `ContentItem` model.

Current types:

- `NEWS`
- `OPPORTUNITY`
- `ACTIVITY`
- `ALERT`
- `DOCUMENT`

An enum is used so content types stay consistent.

Type-specific display data can be stored in JSON, while values that need to be queried, compared, or sorted frequently are stored as normal database columns.

Examples:

- `details` → flexible JSON data
- `eventStart` → normal column
- `expiresAt` → normal column

### Threads and Follow-up Posts

Follow-up updates are stored as `ContentItem` records and connected to the original item using a self-relation.

```text
Main ContentItem
├── Follow-up ContentItem
└── Follow-up ContentItem
```

A main post has:

```text
parentId = null
```

A follow-up has:

```text
parentId = <parent ContentItem id>
```

This keeps later corrections or updates attached to their original context instead of appearing as unrelated posts in the feed. Editors can add follow-up posts directly from the thread page. Follow-ups inherit the parent type, department, and visibility, while read access is still checked server-side.

Deleting a parent can cascade to its follow-ups so orphan records are not left behind.

## Architecture

The application uses a **modular monolith** architecture.

It is deployed as one application, while responsibilities are separated internally.

```text
Browser
  |
  v
Next.js UI
  |
  v
Next.js Server-side Logic
  |-- Authentication
  |-- Authorization
  |-- Server Actions
  |-- Business Rules
  |
  v
Prisma
  |
  v
PostgreSQL
```

Next.js is used as a full-stack framework: it handles both the user interface and server-side application logic.

For the current project scope, a separate backend service would add API and deployment complexity without enough benefit.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Authentication | Auth.js / Google OAuth 2.0 |
| ORM | Prisma |
| Database | PostgreSQL |
| Environment | Docker Compose |
| Version Control | Git / GitHub |

## Database Design

Important models include:

### `User`

Stores user account information and the current role.

Important rules include:

- email is unique,
- the safe default role is `READER`.

### `Allowlist`

Used during a user's first sign-in to assign a predefined privileged role to approved accounts.

The allowlist does **not** determine whether an email domain is allowed to sign in. Domain validation and initial role assignment are separate concerns.

### `ContentItem`

Stores announcements and follow-up posts.

It contains common fields shared by all content types and can relate back to another `ContentItem` through `parentId`.

## Search Example

The search combines the shared visibility rule with keyword matching and includes both current and past announcements:

```ts
const results = await db.contentItem.findMany({
  where: {
    AND: [
      visibleWhere(signedIn, "all"),
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
    ],
  },
});
```

This means:

```text
visibility conditions
AND
(title contains keyword OR body contains keyword)
```

## Shared Visibility Rule

The project centralizes the main read policy in `src/lib/items.ts`.

Conceptually, the function builds a Prisma `where` condition from three concerns: thread level, account visibility, and lifecycle scope (`current`, `past`, or `all`). Current items must be published and not expired; past items are explicitly marked `PAST` or have passed `expiresAt`; `HIDDEN` items are excluded from reader scopes.

The function does not retrieve content by itself. Feed, Search, Past, and other read paths reuse the same policy rather than maintaining separate copies.

## Seed Data

`prisma/seed.ts` provides a reproducible development dataset.

Before inserting the seed data, existing development records are cleared so each developer can return to the same known starting state.

This helps with:

- consistent development environments,
- repeatable demos,
- easier bug reproduction,
- avoiding duplicate seed records.

> The destructive reset strategy is intended for development/testing, not production data.

## Docker

Docker Compose is used to keep the development environment consistent across team members.

The current Compose stack contains:

- `db` — PostgreSQL 16 for application data,
- `minio` — S3-compatible object storage for attachments,
- `createbucket` — a short-lived helper that creates the `hub-files` bucket.

PostgreSQL and MinIO both use health checks so dependent work starts only after the service is actually ready.

Current local ports are:

```text
PostgreSQL  localhost:5432
MinIO API   localhost:9000
MinIO UI    localhost:9001
```

The Next.js application itself currently runs on the local Node.js runtime (`npm run dev`) rather than in its own container.

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- Docker with Docker Compose
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in the required values in `.env`, including the database connection and Google OAuth configuration.

The project also supports configuring allowed email domains through environment configuration.

### 4. Start PostgreSQL and MinIO

```bash
docker compose up -d
```

### 5. Apply the Prisma schema

```bash
npx prisma db push
```

### 6. Seed the development database

```bash
npm run db:seed
```

### 7. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Project Structure

```text
prisma/
├── schema.prisma
└── seed.ts

src/
├── app/
│   ├── actions/
│   ├── admin/
│   ├── api/
│   ├── denied/
│   ├── items/
│   ├── me/
│   ├── onboarding/
│   ├── search/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── Card.tsx
│   ├── ItemForm.tsx
│   └── Menu.tsx
│
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── fonts.ts
│   └── items.ts
│
└── types/
    └── next-auth.d.ts
```

## Current Status

### Iteration 1 — Completed

- university Google sign-in
- domain validation
- initial role assignment
- create and edit announcements
- feed and thread flow
- shared visibility rule
- keyword search
- sign out and restricted-content checks

### Iteration 2 — Completed

- authenticated attachments stored in MinIO,
- permission-checked five-minute download links,
- expiry and completed-item lifecycle,
- past-items archive and search,
- role management and allowlist administration,
- audit logging for writes,
- follow-up posting from the thread page,
- automated unit tests and GitHub Actions CI.

## Testing

The current project has manual behavior-based checks covering important flows such as:

- accounts outside the allowed domain are rejected,
- required fields are validated,
- restricted information is hidden from visitors,
- Feed, Search, and direct-address access are treated as separate entry points.

Automated unit tests cover shared visibility/thread rules and expiry behavior. GitHub Actions runs dependency installation, Prisma generation, TypeScript checking, unit tests, and a production build on pushes and pull requests.

## Design Principles

### One rule, one place

Security and visibility policies are centralized instead of duplicated across pages.

### Safe defaults

New users default to `READER`, and content visibility can use a restrictive default.

### Server-side enforcement

Frontend controls improve the user experience, but security is enforced on the server.

### Reproducible development

Docker and seed data help team members work with consistent environments and test conditions.

### Keep the architecture appropriate to the scope

The project uses a modular monolith rather than microservices because independent service scaling and deployment are not currently required.

## Known Limitations

- Search currently uses simple substring matching rather than advanced relevance ranking.
- Automated test coverage is still focused on shared business rules rather than full end-to-end browser tests.
- The current UI is functional and will receive a larger UX/design pass in the next iteration.
- The current architecture is optimized for the web application; additional clients such as a native mobile application may require a more explicit reusable API design.

## Team

**Team AXIS — Project C**

Department Information and Communication Hub for the CPE/SKE department.
