// @vitest-environment jsdom
import { createApp, defineComponent, h, mergeProps, nextTick } from "vue"
import { expect, test } from "vitest"
import { Button } from "../src/button"
import { withSource } from "../src/observe"

test("a press hands the @click handler its event and how the button was pressed", () => {
  const calls: [string, string][] = []
  const el = document.body.appendChild(document.createElement("div"))
  const app = createApp(
    defineComponent({
      setup: () => () =>
        h(
          Button,
          {
            onClick: (event: MouseEvent, { source }) =>
              calls.push([event.type, source]),
          },
          () => "Save"
        ),
    })
  )
  app.mount(el)
  withSource("agent", () => el.querySelector("button")!.click())
  expect(calls).toEqual([["click", "agent"]])
  app.unmount()
  el.remove()
})

test("runs every click listener that Vue merged into one prop", async () => {
  const calls: string[] = []
  let settle!: () => void
  const el = document.body.appendChild(document.createElement("div"))
  const app = createApp(
    defineComponent({
      setup: () => () =>
        h(
          Button,
          mergeProps(
            { onClick: () => calls.push("trigger") },
            {
              onClick: () => {
                calls.push("author")
                return new Promise<void>((resolve) => (settle = resolve))
              },
            }
          ),
          () => "Save"
        ),
    })
  )
  app.mount(el)
  const button = el.querySelector("button")!
  button.click()
  expect(calls).toEqual(["trigger", "author"])
  await nextTick()
  expect(button.getAttribute("aria-busy")).toBe("true")
  settle()
  await new Promise((resolve) => setTimeout(resolve))
  expect(button.hasAttribute("aria-busy")).toBe(false)
  app.unmount()
  el.remove()
})
