# Dark mobile redesign — 9 October 2026

The dashboard now uses graphite surfaces, cobalt accents, larger Manrope typography, and a layered class card. On a phone, the next class and its attendance actions lead into the weekly schedule; the historical gauge, grades, exams, and tasks follow. Desktop uses two columns.

## Interaction and references

- [Anime.js](https://animejs.com/documentation/getting-started/using-with-react/) powers the heading entrance, dock plate, icon rebound, page fades, attendance gauge, and brief attendance confirmation particles. Scopes are reverted when components unmount.
- [Kokonut UI navigation](https://kokonutui.com/docs/navigation/morphic-navbar) and [particle buttons](https://kokonutui.com/docs/buttons/particle-button) informed the moving dock and short confirmation feedback.
- [Bklit's chart collection](https://bklit.com/docs/components) informed the segmented attendance gauge and interactive history.
- [Thinking Gods' prompt library](https://thinkingods.com/prompts) informed the layered card treatment.
- [OriginKit](https://www.originkit.dev/) informed the sculptural accent. The rings are original Three.js geometry and materials, with a procedural studio environment.

Anime.js and Three.js are installed dependencies. The other references inspired original app-specific components; their libraries and paid templates were not copied or installed. No signup was needed.

## Usability

- The five dock labels stay visible, with separate left/right safe-area spacing and at least 44px touch targets. Settings and Schedule do not falsely highlight a main tab.
- Text input focus hides the phone dock; sliders and checkboxes keep it available.
- The 3D rings support horizontal dragging while allowing vertical scrolling. Rendering is capped at 30 frames per second and pixel ratio 1.5, pauses offscreen or in a hidden tab, and disposes resources on unmount.
- Reduced motion uses a static vector sculpture and skips nonessential movement. Unavailable or lost WebGL also shows the vector.
- The gauge shows actual cumulative attendance through one of the last seven recorded dates. Future and cancelled records are excluded; an empty history stays empty.
- Planner forms use the existing portal dialog, keeping them within the viewport with Escape dismissal, focus trapping/restoration, associated labels, scrolling, and safe-area padding.
- Marks forms have associated labels and explicit close controls. Task completion, menus, and editing have labeled 44px targets.
- Page transitions avoid transforms on the page root because those change the containing block for fixed popups.

## Verification

- 28 existing automated tests passed.
- Production build and TypeScript passed; lint reported zero errors and the same 23 existing unused-code warnings.
- Browser checks covered the home, attendance, tasks, planner, marks, schedule, and settings screens at 320px width, iPhone 15 dimensions (393 × 852), and desktop (1440 × 1000).
- Checked attendance marking and undo, keyboard focus when the class advances, rapid tab navigation, active state and plate positioning, keyboard focus, form dismissal, primary-action contrast, range keyboard/pointer interaction, and populated/empty attendance.
- Checked genuine WebGL rendering, ring dragging, reduced-motion fallback, and simulated WebGL context loss.

Browser checks use isolated anonymous sessions and local fixtures. They do not replace physical iPhone Safari testing or a signed-in cloud sync test.

## Data

This release changes the interface and dependencies only. It does not change database tables, auth configuration, sync/storage providers, or existing records. The private application-data backup from 7 October remains outside the repository; its scope and recovery notes are documented in the earlier UI and sync review.
