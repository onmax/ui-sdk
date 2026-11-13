import {
  defineComponent,
  h,
  type Component,
  type VNode,
  type VNodeChild,
} from "vue"

type RootSlots<State> = {
  default?: (scope: { state: State }) => VNodeChild
}

/**
 * Wraps a root from `createParts` so that its content ends with the hidden
 * inputs a form submits, made from the root's state. The root keeps its props,
 * events, and slots, so it needs no hand-written props like `Switch` has.
 */
export function withFormInputs<Root extends Component, State>(
  root: Root,
  inputs: (state: State) => VNode[]
): Root {
  const name =
    "name" in root && typeof root.name === "string" ? root.name : undefined
  // SAFETY: the wrapper passes every attribute and slot to `root`, so it takes the same props and emits the same events.
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const own = slots as RootSlots<State>
      return () =>
        h(root, attrs, {
          ...slots,
          default: (scope: { state: State }) => [
            own.default?.(scope),
            ...inputs(scope.state),
          ],
        })
    },
  }) as unknown as Root
}
