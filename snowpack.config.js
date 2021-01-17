const commonjs = require("@rollup/plugin-commonjs");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const { terser } = require("rollup-plugin-terser");
const css = require("rollup-plugin-css-only");
const builtins = require("rollup-plugin-node-builtins");

const production = !process.env.ROLLUP_WATCH;

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: "/", static: true },
    src: { url: "/dist" },
  },
  plugins: [
    "@snowpack/plugin-svelte",
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-typescript",
    [
      "snowpack-plugin-rollup-bundle",
      {
        emitHtmlFiles: true,
        preserveSourceFiles: true,
        // equivalent to inputOptions.input from Rollup
        // entrypoints: "src/index.ts",
        entrypoints: "build/snowpacker/entrypoints/**/*.js",

        extendConfig: (config) => {
          // https://rollupjs.org/guide/en/#outputoptions-object
          config.outputOptions = {
            sourcemap: true,
            format: "iife",
            name: "app",
            file: "public/bundle.js",
            intro: "const global = window;",
            // intro: 'var global = typeof self !== undefined ? self : this;'
          };

          // https://rollupjs.org/guide/en/#inputoptions-object
          // config.inputOptions = { ... }

          // add plugins
          config.inputOptions.plugins.push(
            ...[
              // typescript(/*{ plugin options }*/),

              builtins(),
              // we'll extract any component CSS out into
              // a separate file - better for performance
              css({ output: "bundle.css" }),

              // If you have external dependencies installed from
              // npm, you'll most likely need these plugins. In
              // some cases you'll need additional configuration -
              // consult the documentation for details:
              // https://github.com/rollup/plugins/tree/master/packages/commonjs
              nodeResolve({
                browser: true,
                dedupe: ["svelte"],
              }),
              commonjs({ sourceMap: false }),

              // In dev mode, call `npm run start` once
              // the bundle has been generated
              // !production && serve(),

              // Watch the `public` directory and refresh the
              // browser on changes when not in production
              // !production && livereload("public"),

              // If we're building for production (npm run build
              // instead of npm run dev), minify
              production && terser(),
            ]
          );

          return config;
        },
        // public,
      },
    ],
  ],
  routes: [
    /* Enable an SPA Fallback in development: */
    // {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
    /* Example: Bundle your final build: */
    // "bundle": true,
  },
  packageOptions: {
    polyfillNode: true,
    /* ... */
  },
  devOptions: {
    open: "none",
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
};
