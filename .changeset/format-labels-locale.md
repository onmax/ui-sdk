---
"@ui-sdk/core": patch
---

A Select or Combobox value with `maxLabels` and no `getMoreLabel` now joins its labels in English, the language of the default "2 more". It no longer mixes the page's "y" with "more". On the server, the labels join in English instead of the machine's language.
