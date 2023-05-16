import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json" assert { type: "json" };
import { defineConfig } from "rollup";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

const targets = "defaults and supports es6-module";

export default defineConfig([
  {
    input: "src/picoapp-ts.ts",
    output: {
      name: "picoapp-ts",
      file: pkg.browser,
      format: "esm",
    },
    plugins: [
      typescript(),
      resolve(),
      getBabelOutputPlugin({
        presets: [
          [
            "@babel/preset-env",
            {
              modules: "umd",
              targets,
            },
          ],
        ],
      }),
    ],
  },
  {
    input: "src/picoapp-ts.ts",
    external: ["@offday/evx-ts"],
    plugins: [
      typescript(),
      getBabelOutputPlugin({
        presets: [["@babel/preset-env", { targets }]],
      }),
    ],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
  },
]);
