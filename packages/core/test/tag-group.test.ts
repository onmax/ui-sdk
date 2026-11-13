import { describe, expect, test } from "vitest"
import { tagGroupPrimitive } from "../src/components/tag-group/tag-group"
import { attrs as partAttrs } from "../src/foundation/kernel/part"

describe("tag group", () => {
  test("is a grid of rows with one tab stop", () => {
    const instance = tagGroupPrimitive({
      id: "g",
      selectionMode: "multiple",
      defaultValue: ["b"],
    })
    expect(partAttrs(instance.part("root"))).toMatchObject({
      role: "grid",
      "aria-multiselectable": "true",
    })
    expect(partAttrs(instance.part("item", { value: "a" }))).toMatchObject({
      role: "row",
      tabindex: "0",
      "aria-selected": "false",
    })
    expect(partAttrs(instance.part("item", { value: "b" }))).toMatchObject({
      tabindex: "-1",
      "aria-selected": "true",
      "data-selected": "",
    })
  })

  test("asks to remove tags through onRemove", () => {
    const removed: string[][] = []
    const instance = tagGroupPrimitive({
      id: "g",
      onRemove: (values) => removed.push(values),
    })
    expect(instance.api.remove(["a"])).toBe(true)
    expect(removed).toEqual([["a"]])
  })
})
