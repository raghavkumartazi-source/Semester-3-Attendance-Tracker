# Semester 3 Attendance Tracker

Attendance, tasks, work sessions, marks and exam preparation, with offline browser storage and optional Supabase sync.

## Run

Use Node 22.12 or newer. Run `npm ci`, copy `.env.local.example` to `.env.local`, supply your Supabase project URL and public anon key, then run `npm run dev`. Never put a service-role key in a public variable. Without a configured backend, local tracking works but cloud login/sync is unavailable.

Run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` before publishing. CI runs these checks for each pull request.

## Database setup and rollout

Back up your existing database. The committed marks and planner migrations, plus `tasks_schema.sql` followed by `phase2a_migration.sql`, define the other domains. Apply the new timestamped `attendance_tombstones` migration before deploying this client. It creates the missing base attendance table on fresh installs, permits `UNMARKED`, adds an owner/session conflict key, enforces ownership and protects newer records from delayed writes. Existing status enum columns or nonstandard table schemas need inspection before applying: this migration expects `status` to be text.

The migration revokes client DELETE. Clears are timestamped rows rather than missing records. Deploy this version to all devices; older clients that delete rows will receive an error. Keep cleared rows until every device has adopted the new protocol. Sync uses client timestamps, so keep device clocks accurate. Database migrations are included for review; they are not automatically applied to your live Supabase project.

## Accounts and existing browser data

Each account and semester now has separate browser keys for attendance, tasks, work sessions, marks and study plans. The entire workspace remounts on sign-in/sign-out/account changes. Pending operations capture the original account's storage instance. Guest data never uploads automatically to an account.

**Before upgrading, export data from Settings.** Old unscoped records have ambiguous ownership and are left untouched; the new client does not claim them for the next user. Restore a chosen attendance backup using the existing Import action while signed into the intended account. Legacy keys remain recoverable in the browser until you deliberately remove them. Logging out resets the visible workspace to the guest account, while the signed-in account's offline cache remains available when that same account returns.

Semester dates, subjects and timetable are centralized in `src/lib/config.ts`. Changing the dates produces a separate cache namespace. Timetable editing and splitting the large planner/marks pages remain later work.

## Dependency maintenance

Next.js and its lint configuration are pinned to 16.3.8, and tests use Vitest 5.0.3 with current Vite tooling. The production dependency audit reports zero known advisories at this revision. The development-only Next ESLint glob dependency chain still reports the unpatched [braces denial-of-service advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm); keep lint inputs trusted and review upstream fixes. Avoid the suggested forced downgrade of Next lint tooling.
