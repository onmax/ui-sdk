import { describe, expect, test } from "vitest"
import { stepperPrimitive } from "../src/components/stepper/stepper"
import { attrs as partAttrs } from "../src/foundation/kernel/part"

describe("stepper", () => {
  test("marks steps complete, current, or upcoming", () => {
    const instance = stepperPrimitive({ id: "s", defaultValue: 2 })
    const attrsOf = (value: number) =>
      partAttrs(instance.part("item", { value }))
    expect(attrsOf(1)["data-complete"]).toBe("")
    expect(attrsOf(2)["data-current"]).toBe("")
    expect(attrsOf(3)["data-upcoming"]).toBe("")
  })

  test("a linear stepper reaches back and one step ahead", () => {
    const instance = stepperPrimitive({ id: "s", defaultValue: 2 })
    const trigger = (value: number) =>
      partAttrs(instance.part("trigger", { value }))
    expect(trigger(1).disabled).toBeUndefined()
    expect(trigger(3).disabled).toBeUndefined()
    expect(trigger(4).disabled).toBe("")
    expect(trigger(2)).toMatchObject({ tabindex: "0", "aria-current": "step" })
  })
})
