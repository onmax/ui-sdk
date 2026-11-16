---
"@ui-sdk/core": patch
---

`parseDate` reads short numbers in the order of the locale's short date when it differs from the numeric one. Zulu writes "2026-01-05" and "1/5/26", Kyrgyz "2026-05-01" and "5/1/26", so "1/5/26" in `zu-ZA` is no longer May 26, 2001, and "5/1/26" in `ky-KG` reads. A year of three digits or more still picks the order that has the year in its place.
