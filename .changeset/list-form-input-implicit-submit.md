---
"@ui-sdk/core": patch
"@ui-sdk/react": patch
"@ui-sdk/vue": patch
"@ui-sdk/solid": patch
"@ui-sdk/svelte": patch
---

The hidden field that a Select, Combobox or Listbox submits in React, Vue, Solid and Svelte is now a `<textarea>`, not a text `<input>`. Enter in a form's only text field submits the form again when a Select is in it, as with a native `<select>`.
