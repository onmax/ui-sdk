---
"@ui-sdk/core": patch
---

A modal Dialog closed by a press on its backdrop no longer swallows the next click when its backdrop is gone before the release. Space or Enter on the trigger right after opens the dialog again on the first try. The click the press itself releases still doesn't reach the page.
