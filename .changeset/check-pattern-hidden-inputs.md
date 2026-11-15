---
"@ui-sdk/core": patch
---

`checkPattern` no longer counts elements hidden with `aria-hidden`, like the native inputs a `RadioGroup` or a required `CheckboxGroup` renders for forms. A radio group passes with one checked radio, and a required checkbox group has no unnamed input.
