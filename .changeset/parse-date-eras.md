---
"@ui-sdk/core": patch
---

`parseDate` reads a year written in an era, as the Japanese, ROC (Minguo) and Buddhist calendars write it: "R8/10/16" and "令和8年10月16日" in `ja-JP-u-ca-japanese`, "民國115/10/16" in `zh-TW-u-ca-roc` and "10/16/2569 BE" in `en-US-u-ca-buddhist`. A Date Picker in these calendars can read back the date it shows. A date outside the era it's written in, like "平成31年5月1日", and an era that counts its years down, like "民國前", still give undefined.
