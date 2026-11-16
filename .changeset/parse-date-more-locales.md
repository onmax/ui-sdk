---
"@ui-sdk/core": patch
---

`parseDate` reads a date written the way the locale writes its medium, long or full date, part by part as `Intl` writes it. Month and weekday names with spaces, dots, joiners or a prefix now read, as do months written with their number and full dates with a weekday: Irish "16 Deireadh Fómhair 2026", Thai "16 ต.ค. 2569", Malayalam, Hebrew "16 באוקטובר 2026", Catalan "16 d’octubre del 2026", Vietnamese "16 tháng 10, 2026", Mongolian, Basque, Persian, Danish "fredag den 16. oktober 2026" and Japanese "2026年10月16日金曜日".
