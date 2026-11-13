import { describe, expect, test } from "vitest"
import { aspectRatioPrimitive } from "../src/components/aspect-ratio/aspect-ratio"
import { visuallyHiddenPrimitive } from "../src/components/visually-hidden/visually-hidden"
import { attrs as partAttrs } from "../src/foundation/kernel/part"

describe("aspect ratio and visually hidden", () => {
  test("aspect ratio sets aspect-ratio and its variable", () => {
    expect(
      partAttrs(aspectRatioPrimitive({ id: "a", ratio: 2 }).part("root")).style
    ).toBe("aspect-ratio:2;--aspect-ratio:2")
  })

  test("visually hidden hides from sight, and from screen readers when fully hidden", () => {
    const focusable = partAttrs(
      visuallyHiddenPrimitive({ id: "v" }).part("root")
    )
    expect(focusable.style).toContain("clip-path:inset(50%)")
    expect(focusable["aria-hidden"]).toBeUndefined()
    const fully = partAttrs(
      visuallyHiddenPrimitive({ id: "v", feature: "fully-hidden" }).part("root")
    )
    expect(fully).toMatchObject({ "aria-hidden": "true", tabindex: "-1" })
  })
})
