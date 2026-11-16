---
"@ui-sdk/core": patch
---

`parseDate` reads an era name with a space as one name, as `Intl` writes the ROC era in Arabic ("5/1/115 جمهورية الصي"). When two forms write the same text for different years, like German ROC "05.01.15 Minguo" for 1926 in the numeric date and for 2026 in the short one, it reads the year the way the numeric date a Date Picker shows writes it.
