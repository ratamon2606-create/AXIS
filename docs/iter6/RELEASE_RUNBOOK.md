# AXIS Iteration 6 — Deployment and Rollback Runbook

**Scope:** final gallery improvements; 10 image attachments per follow-up, carousel and thumbnail navigation, persistent cover selection on main announcements, and announcement title when list thumbnail is absent. Existing UI layout and permission rules must be preserved.

## Release preconditions

- Work in the `iter6/final-gallery-release` branch; review the PR before merging.
- Obtain approval from project administrators for production database, object-storage access and Google OAuth callback addresses. **Never commit secrets.**
- Verify the proposed Prisma migration `20261120_cover_image` is additive. Existing announcements use first-image fallback; no image data migration is needed.
- Back up PostgreSQL and object storage and confirm rollback/recovery ownership. The new `coverAttachmentId` field is optional; the application must not be deployed against an unmigrated database.
- Confirm the patched Next.js dependency integrity gate can complete successfully in CI. Do not disable it.

## Local and CI verification

From `source/`:

```bash
npm ci
npx prisma generate
npm run typecheck
npm test
npm run security:gate
npm run quality:comments
npm run build
```

Start local dependencies when performing integration tests:

```bash
docker compose up -d db minio createbucket
npx prisma migrate deploy
npm run dev
```

Do not execute migrations against the live database until backup and approval are confirmed.

## Production target (not automatically deployed)

The planned production architecture is Next.js on Vercel, external PostgreSQL and private S3-compatible storage. Configure Vercel project root as `source`. Populate `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL_DOMAINS`, `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY` and `S3_SECRET_KEY` using the hosting secret-management interface. Set the Auth.js hosting URL/callback configuration appropriate to the final domain and verify provider settings. Configure CORS for direct browser PUT to the object store.

### Release order
1. Deploy preview with staging database/storage and valid OAuth callback.
2. Apply the `20261120_cover_image` migration on the staging database.
3. Run acceptance scenarios from `docs/iter6/ACCEPTANCE.md`.
4. Obtain sign-off for permissions and data protection.
5. Back up production PostgreSQL and object store; apply reviewed migration to production database.
6. Deploy approved commit to production, then run post-deploy smoke tests for auth, uploads, cover selection, list fallback, downloads and audit.
7. Capture deployed URL, exact commit, migrations applied, Actions run, and timestamp in the final report.

## Rollback

If the release fails, prefer redeploying the previous known-good application commit after halting writes as appropriate. **Do not automatically drop the additive `coverAttachmentId` column**: the old application should ignore it and destructive schema rollback can lose selected-cover metadata. If a full data rollback is necessary, restore consistent PostgreSQL and object-store backups together. Recheck direct attachment URLs and role boundaries after rollback.

## Known release gates

- The GitHub branch and PR are code delivery, **not** proof of passing checks or a live production rollout.
- OAuth, production credentials, hosted data stores, CORS, final domain and deployment approvals require team access.
- Record failed or blocked checks without representing them as passed.
