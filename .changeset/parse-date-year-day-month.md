---
"@ui-sdk/core": patch
---

`parseDate` reads a date in the locale's own numeric order before it reads it as an ISO date when the locale writes the year, then the day, then the month. Kyrgyz writes January 5, 2026 as "2026-05-01", so a Date Picker in `ky-KG` no longer turns the date it shows into May 1.
