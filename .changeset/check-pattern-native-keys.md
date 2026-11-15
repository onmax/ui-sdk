---
"@ui-sdk/core": patch
---

`checkPattern` and the testing kit's `keys` now do what a browser does for arrow keys, Home, End, Page Up and Page Down on a native `<input type="range">`, and for arrow keys in a native radio group. A key sent from script never does it, so native sliders and radio groups no longer fail their pattern.
