# After Hours interface — 9 October 2026

The interface uses deep plum surfaces, ivory type, coral controls, DM Sans body text and Space Grotesk headings. It preserves the original home composition: greeting and semester card, three summary cards, timetable, tasks, daily progress, attendance snapshot, marks/exam glances, and expandable attendance insights. The original floating five-page dock remains Today, Attendance, Tasks, Planner and Marks. Existing sync and storage fixes are retained.

## Motion and references

- [Anime.js timelines](https://animejs.com/documentation/timeline/) coordinate greeting entrances, safe page elements, spring dock movement and icon rebounds. Animations revert on cleanup; route roots stay still so fixed overlays remain attached to the viewport.
- [Kokonut Smooth Tab](https://kokonutui.com/docs/navigation/smooth-tab) informed the sliding indicator and coordinated transitions.
- [Kunal Chaudhary’s liquid buttons](https://kunal-chaudhary-design.github.io/liquid-buttons/) informed the impact, rebound, ripple and rolling visual layer. The app uses native controls with CSS and Web Animations; labels and hit areas stay still. This adaptation does not implement the demo’s transmission shader.
- [Originkit Cursor Ring Field](https://www.originkit.dev/components/cursor-ring-field) informed the reactive background field. [Starfield Button](https://www.originkit.dev/components/starfield-button) informed deterministic twinkles and lights moving along the rounded outline. These are local adaptations of the public descriptions; gated code is not distributed.
- [Bklit Heatmap](https://bklit.com/docs/components/heatmap-chart), [Line Chart](https://bklit.com/docs/components/line-chart) and [Ring Chart](https://bklit.com/docs/components/ring-chart) informed local chart primitives: Monday-first animated cells, touch/keyboard details, continuous range morphing and expandable concentric status rings. Tooltips use actual recorded dates and counts.
- [Thinking Gods](https://thinkingods.com/prompts) informed the warm plum materials and tactile depth.

The semester dial is real Three.js geometry: enamel face, metal rim, raised progress arc and gimbal ring, with a studio environment. Its percentage and day count come from the existing semester configuration. Dragging changes the object while DOM text stays readable. Three.js loads lazily, uses a pixel-ratio cap of 1.5 and a 30fps cap, and pauses while offscreen or hidden. The background and starfield effects also pause appropriately. No new dependencies were added for this revision.

## Usability and correctness

- The polish pass uses quieter surface borders, more readable secondary text, sentence-case headings, consistent page widths and larger native controls. It retains the original home sections, five-page dock, liquid interactions, animated graphs and 3D semester dial.
- Home attendance actions display Present, Absent and Cancelled in full. Completed tasks have an explicit Undo action, and task creation remains available beside the next task. Loading placeholders now match the final dashboard layout.
- Attendance cards show full subject names, actual percentages, the 75% target and clear next-step guidance. Register cells and status menus support touch and keyboard navigation, preserve focus after edits and retain saved records after reload.
- Task lists share the same materials and typography as home. Open/completed views, due-date groups, quick date choices, editing completed tasks and nested work-session dialogs keep their existing data flow.
- Marks and planner pages use readable projections, wrapping subject rails and touch-sized actions. Saved grade boundaries preload correctly, zero-percent scenarios remain zero, and soft-deleted entries are excluded from visible lists.
- Study-plan setup exposes the existing planner configuration through an upcoming endsem selector, daily study time, buffer days and revision rounds. Saving generates the existing plan and persists the settings. Reverse-countdown dates use local calendar days, including split sessions.
- The weekly schedule shows the real start/end times and uses the timetable's actual end time for the current-class indicator. Account inputs have visible associated labels and a password visibility control; sign-in and signup handlers are unchanged.
- Phone inputs remain at least 16px to avoid focus zoom. The dock respects safe areas, keeps its five labels visible and hides during text input focus. Its targets are at least 44px.
- Reduced motion skips decorative movement and uses a static dial. Missing/lost WebGL preserves the vector dial and its data.
- Attendance charts exclude future, cancelled and unmarked classes from the attendance denominator. Cumulative totals are computed before filtering the visible date range. Empty history has an explicit empty state.
- The forecast avoids treating no records as 0% attendance and uses remaining unmarked classes from today onward.
- Task menus render outside animated card ancestors. Delete confirmations, manual planning and smart-plan review preserve focus, Escape dismissal and nested scroll locks.
- Marks and planner dialogs retain their existing handlers and data flow; escaped symbols in the scorecard were replaced with readable symbols. Populated assessment/scenario rows wrap on small phones, and exam/topic actions are visible on touch screens. Exam countdowns use local calendar days to avoid the previous one-day timezone error.

## Verification

- All 35 automated tests pass, including seven chart-data tests covering denominators, future/cancelled records, range boundaries, calendar alignment and bounded morph geometry.
- TypeScript and production build pass. Lint has no errors; existing unused-code warnings remain.
- Charts were checked in touch-enabled mobile contexts at 393 × 852 and 320 × 740: range morphs, history scrubber, ring selection, heatmap tap previews, keyboard navigation, empty states and reduced motion.
- Homepage checks cover both phone widths and desktop, real WebGL rendering/drag feedback, static reduced-motion fallback and the original fixed dock. Attendance/register, subject detail, tasks, populated marks, planner, schedule and settings were checked at 320 × 740 and 1440 × 1000; content stays within the viewport and final controls clear the dock.
- Isolated guest browser flows verify attendance marking/undo, task creation/completion/undo, marks entry and exam entry with saved local records surviving reload. Nested manual-plan dismissal preserves the parent's scroll lock and restores focus.
- The final polish was checked at 320 × 852, iPhone 15's 393 × 852 viewport and 1440 × 1000. Home, attendance, tasks, marks, planner, schedule and settings fit without page-level horizontal overflow. Account labels, 16px fields, password visibility and blank-form disabled actions were checked without signing in. Study-plan settings and generated schedules survive reload in an isolated guest session.

Browser checks use isolated guest sessions and temporary local fixtures. Physical iPhone Safari and signed-in cloud synchronization were not retested in this interface-only revision.

## Data

No database schema, auth configuration, sync/storage providers or production records were changed. The private application-data backup from 7 October remains outside the repository; its scope and recovery notes are recorded in the earlier UI and sync review.
