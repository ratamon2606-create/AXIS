/** Minimal server-render declaration for the installed react-dom runtime.
 * React 18 includes the implementation; this project does not ship @types/react-dom.
 * Used by lightweight SSR regression tests without changing package-lock.json.
 */
declare module "react-dom/server" {
  export function renderToStaticMarkup(element: import("react").ReactNode): string;
}
