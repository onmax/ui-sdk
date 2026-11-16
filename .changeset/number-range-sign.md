---
"@ui-sdk/core": patch
---

`formatNumberRange` writes each end whole when one end is negative. `Intl` shares one minus sign between two negative ends, so -5 to -2 read as -5 to 2: "‎-5–2 يوم" in Arabic, "-5–2%" for -5% to -2% in English. Now they are "‎-5 أيام–‎-يومان" and "-5%–-2%".
