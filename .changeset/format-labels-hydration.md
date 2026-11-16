---
"@ui-sdk/core": patch
---

A Select or Combobox value with `maxLabels` now joins its labels in English on the server and in the first client render, then in the page's language once the trigger or input binds, like the other components that format text. Before, the first client render used the page's language, so its text differed from the server's at hydration.
