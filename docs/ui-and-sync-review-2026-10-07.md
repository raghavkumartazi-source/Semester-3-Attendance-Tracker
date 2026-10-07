# UI and sync review — 7 October 2026

The phone dashboard now prioritizes the next class and attendance actions. Database changes have been applied to the connected attendance project. The frontend release uses the repository's existing Vercel production project; its deployment status and commit are recorded in Vercel.

## Problems found and addressed

| Problem | Result |
| --- | --- |
| The large semester hero pushed daily actions down the screen. | Compact greeting and 3D progress ring; current, upcoming, or unmarked class appears first. |
| Completed classes kept the same large controls as unmarked classes. | Completed rows collapse to time, subject, status, and an edit control. |
| The bottom bar consumed too much phone space. | Smaller dock, clear active tab, safe-area spacing, and hidden controls while an input is focused. |
| Animated numbers restarted from zero on every update. | Numbers transition from their previous value; reduced-motion preferences are respected. |
| The task sheet lacked modal semantics and a keyboard focus boundary. | Named dialog, associated field labels, focus trapping, Escape dismissal, and focus restoration. |
| Local attendance regeneration discarded update timestamps. | Timestamps survive reload, including explicit attendance undo. |
| Undo deleted the cloud row, letting an older offline mark reappear. | Undo is a timestamped `UNMARKED` record; untouched timetable slots are not uploaded. |
| Marks and Planner referenced 11 missing cloud tables. | Added their tables, update triggers, ownership policies, and indexes. |
| Marks and Planner payloads could omit the signed-in owner. | Sync payloads attach the current user ID. |
| Deleted feature records lost their deletion timestamps during mapping. | Tombstones survive sync and deleted items are hidden from visible lists. |
| Existing ownership policies and foreign keys had performance advisories. | Added missing indexes and updated ownership expressions without changing their access rules. |

## Data protection

Before either database migration, a single read-only snapshot captured 237 attendance records, 7 tasks, and 7 work sessions. The private backup archive is outside the repository and contains JSON records, schema metadata, checksums, recovery SQL, and recovery instructions. It includes soft-deleted records.

A row-by-row comparison after the changes found **zero missing and zero changed original records** across all three tables. Archive integrity, primary-key uniqueness, and typed recovery parsing were checked. Recovery SQL inserts missing rows without overwriting newer rows.

This is an application-data backup for the same Supabase project. It does not export authentication credentials or unsynced data held only in another browser or on an iPhone. There were no Storage objects at the time of the snapshot. Keep an additional copy of the private archive in a separate location.

## Verification

- 28 automated tests passed, including next-class selection, timestamp preservation, undo upload, and feature sync contracts.
- Production build and TypeScript checks passed.
- Lint completed with zero errors and 23 existing unused-code warnings.
- Browser checks passed at 393 × 852 (iPhone 15 layout), 320 × 694, 852 × 393, and 1440 × 1000. No horizontal overflow was found.
- Attendance marking, undo, reload persistence, compact-row editing, day selection, reduced motion, task-sheet focus behavior, and all five navigation routes were checked.
- Authenticated database probes passed for all 11 feature tables, attendance undo, soft deletion, and cross-user read/write protection. The transactions were rolled back; no probe rows were committed.

The browser used an isolated local session. A full signed-in browser-to-cloud flow and real iPhone Safari keyboard behavior still need device verification.

## Remaining findings

- Supabase reports that [leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). This Auth setting was left unchanged.
- Browser storage still uses shared keys across accounts. Database ownership policies pass the checks above, but account switching on the same browser needs a separate review of local storage and sync lifecycle.
- The 23 lint warnings are unused imports or variables, rather than build failures.

## Applied migrations

- `20261007131651_restore_feature_sync_and_attendance_undo.sql`
- `20261007132313_improve_feature_indexes_and_owner_policy_plans.sql`

These local versions match the migration history of the connected project.
