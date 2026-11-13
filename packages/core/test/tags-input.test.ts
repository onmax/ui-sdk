import { describe, expect, test } from "vitest"
import { tagsInputPrimitive } from "../src/components/tags-input/tags-input"
import { attrs as partAttrs } from "../src/foundation/kernel/part"

describe("tags input", () => {
  test("adds trimmed tags once, and refuses more than max", () => {
    const instance = tagsInputPrimitive({ id: "t", max: 2 })
    expect(instance.api.add("  vue ")).toBe(true)
    expect(instance.api.add("vue")).toBe(false)
    expect(instance.get().invalid).toBe(true)
    expect(instance.api.add("nuxt")).toBe(true)
    expect(instance.api.add("vite")).toBe(false)
    expect(instance.get().value).toEqual(["vue", "nuxt"])
  })

  test("names a delete button after its tag's text, out of the tab order", () => {
    const instance = tagsInputPrimitive({ id: "t", defaultValue: ["vue"] })
    expect(
      partAttrs(instance.part("item-delete", { value: "vue" }))
    ).toMatchObject({
      type: "button",
      tabindex: "-1",
      "aria-labelledby": "t-item-delete-vue t-item-text-vue",
    })
    expect(instance.api.remove("vue")).toBe(true)
    expect(instance.get().value).toEqual([])
  })
})
