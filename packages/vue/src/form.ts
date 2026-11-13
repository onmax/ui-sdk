import { createParts, type Parts } from "./create-parts"

import { formPrimitive, type FormPrimitive } from "@ui-sdk/core/form"

type FormTags = { root: "form" }

const parts: Parts<FormPrimitive, FormTags> = createParts(formPrimitive, {
  root: "form",
})

/**
 * A `<form>` that ties its fields to one submission. `@form-submit` gets the
 * values by name once the browser's validation passes. `v-model:errors` shows
 * errors from your code, like a server's, in the Field of the control with the
 * same `name`, until the person edits it.
 */
export const Form: Parts<FormPrimitive, FormTags>["Root"] = parts.Root

export type {
  FormApi,
  FormErrors,
  FormErrorsChangeReason,
  FormOptions,
  FormPrimitive,
  FormState,
  FormValues,
} from "@ui-sdk/core/form"
