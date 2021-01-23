import App from "./App.svelte";

var app = new App({
  target: document.body,
});

export default app;

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
// Receive any updates from the dev server, and update accordingly.
// if (import.meta.hot) {
//   // Receive any updates from the dev server, and update accordingly.
//   import.meta.hot.accept(({ module }) => {
//     // If you have trouble accepting an update, mark it as invalid (reload the page).
//     import.meta.hot.invalidate();
//     // try {
//     //   foo = module.foo;
//     // } catch (err) {}
//   });
//   // Optionally, clean up any side-effects in the module before loading a new copy.
//   import.meta.hot.dispose(() => {
//     /* ... */
//   });
// }
