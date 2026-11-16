// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest"
import { triggerMenu } from "../src/components/trigger-menu/trigger-menu"
import { fakeEditor } from "./fake-editor"
import { kept } from "./kept"

afterEach(() => {
  document.body.replaceChildren()
})

test("Escape closes the menu and dismisses the match in an editor that takes Escape for itself", () => {
  const editor = fakeEditor()
  const element = document.body.appendChild(document.createElement("div"))
  element.contentEditable = "true"
  // ProseMirror prevents the default of every Escape that reaches its element.
  element.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault()
    }
  })
  Object.assign(editor, { element })
  const instance = kept(
    triggerMenu({
      id: "menu",
      triggers: [{ char: "@", items: [{ value: "alice", label: "Alice" }] }],
      editor,
    })
  )
  const state = () => instance.get() as { open: boolean }
  editor.type("@a")
  expect(state().open).toBe(true)
  const escape = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  })
  element.dispatchEvent(escape)
  expect(escape.defaultPrevented).toBe(true)
  expect(state().open).toBe(false)
  // Dismissed: typing on in the match keeps it closed.
  editor.type("l")
  expect(state().open).toBe(false)
})
