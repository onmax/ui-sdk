import { createParts, type Parts } from "./create-parts"

import {
  visuallyHiddenPrimitive,
  type VisuallyHiddenPrimitive,
} from "@ui-sdk/core/visually-hidden"

type VisuallyHiddenTags = { root: "span" }

const parts: Parts<VisuallyHiddenPrimitive, VisuallyHiddenTags> = createParts(
  visuallyHiddenPrimitive,
  {
    root: "span",
  }
)

/**
 * Content that screen readers read and people don't see, like the name of a
 * button that shows only an icon. `feature="fully-hidden"` hides it from
 * screen readers too.
 */
export const VisuallyHidden: Parts<
  VisuallyHiddenPrimitive,
  VisuallyHiddenTags
>["Root"] = parts.Root

export type {
  VisuallyHiddenFeature,
  VisuallyHiddenOptions,
  VisuallyHiddenPrimitive,
  VisuallyHiddenState,
} from "@ui-sdk/core/visually-hidden"
