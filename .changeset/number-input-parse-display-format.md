---
"@ui-sdk/core": patch
---

A Number Input reads its text with the options it shows it with, so a step that gives a currency or unit name decimals no longer shows forms it can't read back, like Russian "1,5 японской иены" for yen by name with `step: 0.01`.
