---
"@ui-sdk/core": patch
---

A Number Input reads every plural form of a long unit or currency name, like Russian "50 километров", Polish "2 kilometry" and Lithuanian "2,00 eurai". Before, it learned only one or two forms, so typing in those fields was blocked and a commit reverted the value.
