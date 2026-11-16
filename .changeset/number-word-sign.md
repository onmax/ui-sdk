---
"@ui-sdk/core": patch
---

`formatNumber` and `formatNumberToParts` keep the sign of a number that a long unit or currency name writes as a word alone, which `Intl` drops: -2 days in Arabic is "‎-يومان", not "يومان", and -2 days in Hebrew is "‎-יומיים". `parseNumber` reads the sign back, so a Number Input no longer shows a negative value as a positive one.
