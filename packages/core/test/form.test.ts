import { describe, expect, test } from "vitest"
import { formPrimitive } from "../src/components/form/form"
import { attrs as partAttrs, partState } from "../src/foundation/kernel/part"

describe("form", () => {
  test("the root shows whether it has errors", () => {
    expect(
      partAttrs(formPrimitive({ id: "f" }).part("root"))["data-invalid"]
    ).toBeUndefined()
    const root = formPrimitive({
      id: "f",
      defaultErrors: { email: "Taken." },
    }).part("root")
    expect(partAttrs(root)["data-invalid"]).toBe("")
    expect(partState(root)).toEqual({
      errors: { email: "Taken." },
      invalid: true,
    })
  })

  test("setErrors reports the change and keeps controlled errors", () => {
    const changes: unknown[] = []
    const instance = formPrimitive({
      id: "f",
      errors: {},
      onErrorsChange: (errors, details) =>
        changes.push([errors, details.reason]),
    })
    instance.api.setErrors({ email: "Taken." })
    expect(changes).toEqual([[{ email: "Taken." }, "imperative"]])
    expect(instance.get().errors).toEqual({})
  })
})
