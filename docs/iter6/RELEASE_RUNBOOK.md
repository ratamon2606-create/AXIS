# AXIS — Production Deployment and Rollback Runbook (Iteration 6)

**Release branch:** `release/production-readiness-20261121` → `main` after required checks pass.
**Release status:** Code prepared and verified by GitHub CI; **hosted deployment not yet verified**.
**Release baseline:** Next.js 15.5.29, Node.js 22.x, Prisma 5.22.0, external PostgreSQL, and private S3-compatible object storage.

## 1. Preconditions and evidence

- Confirm the proposed deployment commit is merged into `main` and both GitHub Actions workflows pass.
- From `source/`, run `npm ci`, `npx prisma generate`, `npm run verify`, and `npm audit --omit=dev`. CI verifies these quality gates but does **not** establish a database or OAuth session.
- The `20261120_cover_image` migration adds the nullable `ContentItem.coverAttachmentId` column. Preserve all existing records.
- Keep secrets in the hosting provider settings; never push `.env`, SQL connection credentials, tokens, or bucket keys. Do not upload `axis-before-iter6.dump` to GitHub.
- Review `docs/iter6/ACCEPTANCE.md` and record exact tested commit, URL, date, environment and tester.

## 2. Hosting architecture

Use a Vercel **Next.js** project imported from `ratamon2606-create/AXIS`, with **Root Directory** set to `source`. Set the **Node.js runtime** to 22.x (matching `source/package.json`). Build command `npm run build`; no separate API server is needed. Do not expose a Docker-only MinIO endpoint such as `localhost:9000` to a hosted application.

Use a hosted PostgreSQL database (e.g. Supabase or another service) and a private S3-compatible object store with public HTTPS access for **browser-to-storage presigned PUTs** (e.g. Cloudflare R2). Keep storage objects private; browser access must use signed URLs, not public bucket permissions.

Required app environment variables in Vercel:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Hosted PostgreSQL connection string for Prisma runtime; use TLS and the provider's compatible pooler where appropriate |
| `AUTH_SECRET` | Strong random Auth.js secret |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | OAuth client credentials from Google Cloud |
| `ALLOWED_EMAIL_DOMAINS` | `ku.th` (or the approved institution domains) |
| `S3_ENDPOINT` | Server-reachable HTTPS S3 endpoint |
| `S3_PUBLIC_ENDPOINT` | Browser-reachable HTTPS signing endpoint; must resolve to the same storage service for SigV4 |
| `S3_BUCKET` | Private object bucket name |
| `S3_REGION` | Storage region, provider-specific |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Restricted S3-compatible access credentials |

Use the Auth.js hosting configuration appropriate to the selected Vercel URL, and check Google's **Authorized redirect URIs** include the exact deployed origin plus `/api/auth/callback/google`. If the hostname changes, update Google's settings and the environment. Avoid wildcard OAuth redirect URIs.

## 3. Storage and CORS

Browser uploads call a server action to request a short-lived signed `PUT` URL, then upload directly to storage. Before enabling real uploads:

1. Configure storage CORS for the deployed Vercel origin(s) and methods `PUT, GET, HEAD` (and `OPTIONS` for preflight handling as supported by the provider), including `Content-Type` as an allowed request header.
2. Verify the object store accepts presigned SigV4 requests using the exact host in `S3_PUBLIC_ENDPOINT`.
3. Make a test upload as an authorized editor, then confirm server-side `HEAD`, file-type inspection, and object promotion succeed.
4. Test files larger than Vercel's server-action size limit through direct upload; no file bytes should be sent through the Next.js Server Action.

## 4. Database migration (non-destructive)

**Do not run `prisma migrate reset`, `prisma db push`, or destructive seed on production.**

1. Confirm you are pointing at the intended **staging** database. Back up its data and capture the backup destination.
2. Set a suitable direct database URL for migration, if required by the provider. Run `npx prisma migrate status` from `source/`. This is a read-only inspection; **stop** on `P3005`, drift, or unknown migration history.
3. For a pristine database with verified migration history, run `npx prisma migrate deploy` using a supported direct connection. Confirm `20261120_cover_image` is applied with `npx prisma migrate status`.
4. Test all acceptance scenarios against staging.
5. Before production deployment, obtain an independently recoverable PostgreSQL backup **and** object-storage backup, confirm target environment and approval, and apply only reviewed pending migrations.
6. Do not run migration automatically from every Vercel build. A deployment must not race with schema changes.

If an existing DB has tables but no Prisma migration history, baseline it **only after verifying the schema matches the migration**; never mark migrations applied blindly.

## 5. Release order

1. Import the GitHub repository into Vercel; choose `source` as root and Node 22.x.
2. Configure hosted database, storage, and Google OAuth credentials on Vercel using the provider settings UI.
3. Deploy **Preview** against staging database and storage; configure its exact OAuth redirect URI.
4. Apply the reviewed Prisma migrations to staging, then test `docs/iter6/ACCEPTANCE.md`.
5. With written acceptance and backups, configure the **Production** environment separately and deploy the approved `main` commit.
6. Verify on an external browser: Google sign-in (Reader/Editor/Admin), create/edit, 10-image follow-up, carousel and retry, selected cover persistence, cover deletion fallback, List View, saved items, search, calendar, and authorized/unauthorized attachment URLs.
7. Capture the live URL, deployed commit SHA, migration status, relevant Actions runs, acceptance screenshots, tester, timestamp, and remaining defects in the final report.

## 6. Rollback and incident handling

If the release fails, stop writes if data integrity is in question, preserve logs, and redeploy the previous known-good application commit. The cover migration is additive: **do not drop the cover column automatically** because that would lose selection metadata. Restore PostgreSQL and object-store snapshots consistently only if necessary and authorized. Re-test OAuth, roles, file access and the cover fallback after rollback.

## 7. Exit criteria / known blockers

- Passing **CI/Build/unit tests** does not prove a live deployment; **full browser integration remains pending** until connected provider accounts, production environment variables, and an actual Vercel URL exist.
- Verify costs and free-tier limits with each provider before enabling production usage.
- The `npm audit --omit=dev` gate checks production dependencies; separate development-tool advisories still require risk review.
- Do not claim "deployed" or "accepted" without an independently reachable URL and completed acceptance evidence.
