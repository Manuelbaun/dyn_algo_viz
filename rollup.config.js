import { terser } from "rollup-plugin-terser";
import builtins from "rollup-plugin-node-builtins";
import commonjs from "@rollup/plugin-commonjs";
import css from "rollup-plugin-css-only";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.ts",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js",
    intro: "const global = window;",
    // intro: 'var global = typeof self !== undefined ? self : this;'
  },
  plugins: [
    typeCheck(),
    typescript({ sourceMap: !production }),
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        dev: !production,
        css: (css) => {
          css.write("public/build/bundle.css");
        },
      },
    }),
    builtins(),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: "bundle.css" }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      extensions: [".svelte", ".ts", ".js"],
      dedupe: ["svelte"],
    }),
    commonjs(),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    terser(),
  ],
};

function typeCheck() {
  return {
    writeBundle() {
      require("child_process").spawn("svelte-check", {
        stdio: ["ignore", "inherit", "inherit"],
        shell: true,
      });
    },
  };
}
