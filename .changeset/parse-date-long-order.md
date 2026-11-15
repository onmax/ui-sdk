---
"@ui-sdk/core": patch
---

A Date Picker or Date Input reads a typed date with a month name in the order of the locale's long date, so Swedish "16 oktober 2026", Afrikaans and Persian dates no longer give an invalid date. A number of three digits or more beside a month name is the year, as in "2026 okt 16".
