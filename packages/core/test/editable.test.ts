// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import { editablePrimitive } from "../src/components/editable/editable"
import { attrs as partAttrs, present } from "../src/foundation/kernel/part"

describe("editable", () => {
  test("shows a focusable preview, and the input only while editing", () => {
    const instance = editablePrimitive({ id: "e", defaultValue: "Draft" })
    expect(partAttrs(instance.part("preview"))).toMatchObject({
      tabindex: "0",
      hidden: undefined,
    })
    expect(present(instance.part("input"))).toBe(false)
    expect(instance.api.edit()).toBe(true)
    expect(present(instance.part("input"))).toBe(true)
    expect(partAttrs(instance.part("preview")).hidden).toBe("")
    expect(partAttrs(instance.part("edit-trigger")).hidden).toBe("")
    instance.api.cancel()
    expect(present(instance.part("input"))).toBe(false)
  })

  test("never edits while disabled or read only", () => {
    expect(editablePrimitive({ id: "e", disabled: true }).api.edit()).toBe(
      false
    )
    expect(editablePrimitive({ id: "e", readOnly: true }).api.edit()).toBe(
      false
    )
  })

  test("submits its value through a hidden input only with a name", () => {
    expect(present(editablePrimitive({ id: "e" }).part("hidden-input"))).toBe(
      false
    )
    const input = editablePrimitive({
      id: "e",
      defaultValue: "Draft",
      name: "title",
    }).part("hidden-input")
    expect(partAttrs(input)).toMatchObject({
      type: "hidden",
      name: "title",
      value: "Draft",
    })
  })
})
