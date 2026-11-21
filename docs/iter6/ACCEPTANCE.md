# AXIS Iteration 6 — Final Acceptance Checklist

Status: **PENDING EXECUTION** until each scenario is verified in a running environment. Record tester, date, URL and commit SHA.

| ID | Area | Action | Expected result |
|---|---|---|---|
| F01 | Upload | Add five or more JPEG/PNG/WebP photos to a follow-up | More than four upload successfully; counts and existing images remain correct |
| F02 | Limit | Add more than ten images to one follow-up | Server rejects the excess; no inconsistent attachment records |
| F03 | Carousel | Open an announcement or follow-up with multiple images | Previous/Next and thumbnail selector show all images; layout works on mobile |
| F04 | Cover | On a main announcement select a non-first image as cover | Main announcement list/shelf displays selected image after reload and new session |
| F05 | Cover security | Try to assign a cover from another announcement via forged FormData | Server rejects; original cover remains |
| F06 | Cover delete | Delete the current cover with other images remaining | System selects a remaining image; no broken cover URL |
| F07 | No image | Open List View on item with no image | Thumbnail fallback shows announcement title, not just category |
| F08 | Attachments | Download private attachment while signed in with access | Authorized redirect works; unauthorized direct route returns 404 |
| F09 | Existing behavior | Browse Bookshelf and List, search, saved items, follow-ups | No functional or visual regression |
| F10 | Roles | Reader attempts to upload/set cover; Editor uses another editor's item | Server denies modifications |
| F11 | Migration | Apply additive cover migration to existing database | Existing attachments and content preserved; Prisma Client matches schema |
| F12 | Date | Test Smart Dates around Bangkok midnight | Timezone display and archive logic unchanged |
| F13 | CI | Check TypeScript, Vitest, security gate and production build | Required workflow checks pass on release commit |
| F14 | Production | From an external browser run Login, content creation, upload, choose cover, download | All endpoints and providers work; capture proof/screenshots |
| F15 | Recovery | Confirm backup and rollback procedure | Recovery owner and backup artifacts verified |

## Defect record

Record: issue ID, environment, commit, exact reproduction steps, expected vs observed behavior, screenshots/logs, severity, assignee, fix commit and retest outcome.

## Team handoff

- Jehan: verify UI, carousel, List View and mobile behavior.
- Not: verify upload cap, cover storage, migration and file lifecycle.
- Ploy: verify authorization, direct file routes, role invariants and OAuth.
- Tar: coordinate CI, release gating, staging, production smoke tests and evidence.

**Exit criteria:** No unresolved severe defects; verified migration/backup, successful required checks, real production URL and explicit team sign-off. Do not present a prepared deployment configuration as a completed deployment.
