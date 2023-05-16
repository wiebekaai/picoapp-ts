import { State, create } from "@offday/evx-ts";

type Context = ReturnType<typeof create>;
type Component = (node: HTMLElement, ctx?: Context) => any | undefined;
type Plugin = (node: HTMLElement, evx?: Context) => State;

export const component =
  (create: (...args: Parameters<Component>) => any) =>
  (node: HTMLElement, ctx: Context) => {
    let subs: (() => void)[] = [];
    return {
      subs,
      unmount: create(node, {
        ...ctx,
        on: (evs, fn) => {
          const u = ctx.on(evs, fn);
          subs.push(u);
          return u;
        },
      }),
      node,
    };
  };

type a = ReturnType<typeof component>;

export function picoapp(
  initialComponents: Record<string, Component> = {},
  initialState = {},
  initialPlugins: Plugin[] = []
) {
  const evx = create(initialState);

  let cache: ReturnType<ReturnType<typeof component>>[] = [];
  let components = { ...initialComponents };
  let plugins = [...initialPlugins];

  return {
    on: evx.on,
    emit: evx.emit,
    getState: evx.getState,
    add: (index: Component) => {
      components = { ...components, ...index };
    },
    use: (fn: Plugin) => {
      plugins = [...plugins, fn];
    },
    hydrate: (data: State) => evx.hydrate(data),
    mount: (attr = "data-component") => {
      (Array.isArray(attr) ? attr : [attr]).forEach((attr) => {
        const nodes = Array.from(
          document.querySelectorAll("[" + attr + "]")
        ) as HTMLElement[];

        nodes.forEach((node) => {
          const [module] = node.getAttribute(attr)?.split(/\s/) || [];

          const component = components[module];

          if (component) {
            node.removeAttribute(attr); // so can't be bound twice

            try {
              const ext = plugins.reduce(
                (res, fn) => ({
                  ...res,
                  ...fn(node, evx),
                }),
                {}
              );
              const instance = component(node, { ...ext, ...evx });
              if (instance?.unmount) cache = [...cache, instance];
            } catch (e) {
              console.error(e);
              evx.emit("error", { error: e });
              evx.hydrate({ error: undefined });
            }
          }
        });
      });

      evx.emit("mount");
    },
    unmount: () => {
      for (let i = cache.length - 1; i > -1; i--) {
        const { unmount, node, subs } = cache[i];

        unmount(node);
        subs.map((u) => u());
        cache.splice(i, 1);
      }

      evx.emit("unmount");
    },
  };
}
