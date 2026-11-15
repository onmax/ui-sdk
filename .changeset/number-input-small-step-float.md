---
"@ui-sdk/core": patch
---

A Number Input's default small step no longer carries floating point noise. With `step: 0.7`, Alt+ArrowUp from 1 gives 1.05, not 1.0499999999999998.
