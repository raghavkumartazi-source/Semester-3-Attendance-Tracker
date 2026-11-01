# SPI and CGPA calculators

Marks has three modes: Scorecard, SPI calculator and CGPA calculator. The calculators use independent drafts; editing them does not alter assessments, grade configurations, attendance or cloud data.

SPI uses credit-weighted course grade points. The grade options follow the IIT (BHU) [UG Ordinances Appendix 7](https://www.iitbhu.ac.in/contents/institute/dean/doaa/doc/ordinance_appendix-7.pdf), 2014–15 onwards: A*/A 10, A− 9, B 8, B− 7, C 6, C− 5, F 0. Failed graded courses remain in the denominator. Non-graded courses can be excluded; incomplete grades remain pending. Course names start from the existing subject list. Credits are only prefilled from explicitly saved grade settings, never inferred from timetable hours.

CGPA combines semester SPIs using their counted credits. A previous cumulative index and its cumulative credits can also be entered as one row. IIT (BHU) uses the name CPI. Rounded semester inputs make this an estimate; repeated-course replacements require adjusted transcript totals and are not automatically reconciled. The in-app explanation links to the [official ordinances](https://www.iitbhu.ac.in/dean/doaa/ordinances).

The current SPI can be copied to CGPA once all included courses are complete; later copies update the same semester snapshot. Full precision is retained through calculations, with the final index displayed to two decimals. Missing values produce a provisional result, invalid values block the index, and no data displays a dash rather than zero.

Drafts persist under the versioned local key `semester-academic-calculator-v1`. Stored data is validated before loading. Save failures are visible; no database migration or new dependency is required. Course/semester removal has Undo; clearing a mode requires confirmation and keeps the other mode intact.

Verification: six new calculation/storage-validation tests (45 total passing), production build and scoped lint pass. Isolated browser checks cover weighted totals, zero-grade failures, SPI transfer without duplication, removal/Undo, invalid entries, reload persistence, clear confirmation and adding rows. Both modes are checked at 320, 393 and 1440 px widths, with reduced-motion support. Physical iPhone Safari has not been tested.
