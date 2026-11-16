import {
  button as buttonPrimitive,
  type ButtonActionDetails,
} from "@ui-sdk/core/button"
import { defineComponent, type PropType } from "vue"
import { withElement } from "./create-parts"
import {
  optionalBoolean,
  usePart,
  usePrimitive,
  type PartSlots,
} from "./use-primitive"

type ClickHandler = (event: MouseEvent, details: ButtonActionDetails) => unknown

// Runs every listener. The button stays pending until all of their Promises settle.
function runClick(
  handlers: ClickHandler | ClickHandler[] | undefined,
  event: MouseEvent,
  details: ButtonActionDetails
) {
  if (!Array.isArray(handlers)) return handlers?.(event, details)
  const results = handlers.map((handler) => handler(event, details))
  return results.some((result) => result instanceof Promise)
    ? Promise.all(results)
    : undefined
}

/**
 * A button, or a link or any element that acts as one through the `render` slot.
 * @stable
 */
const Button = withElement(
  "button",
  defineComponent({
    name: "Button",
    inheritAttrs: false,
    props: {
      disabled: optionalBoolean,
      focusableWhenDisabled: optionalBoolean,
      type: String as PropType<"button" | "submit" | "reset">,
      pendingAnnouncement: String,
      debug: optionalBoolean,
      // `@click="save"` binds here, so the button gets the handler's Promise and
      // stays pending until it settles. Vue merges two click listeners, such
      // as a trigger's props and the author's `@click`, into an array.
      onClick: [Function, Array] as PropType<ClickHandler | ClickHandler[]>,
    },
    slots: Object as PartSlots<typeof buttonPrimitive, "root">,
    setup(props) {
      const button = usePrimitive(buttonPrimitive, () => ({
        disabled: props.disabled,
        focusableWhenDisabled: props.focusableWhenDisabled,
        type: props.type,
        pendingAnnouncement: props.pendingAnnouncement,
        debug: props.debug,
        action: (event, details) =>
          runClick(props.onClick, event as MouseEvent, details),
      }))
      return usePart(button, "root", undefined, undefined, "button")
    },
  })
)

export { Button }

export type {
  ButtonActionDetails,
  ButtonApi,
  ButtonOptions,
  ButtonPrimitive,
  ButtonState,
} from "@ui-sdk/core/button"
