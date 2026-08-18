import type {ESLint, Linter} from "eslint";
import acrocase from "./rules/acrocase.ts";

const plugin: ESLint.Plugin = {
  rules: {acrocase},
};

// Flat config, which is the only format ESLint 10 understands. The config has
// to reference the plugin object itself, so it is assigned after construction.
const recommended: Linter.Config = {
  plugins: {acrocase: plugin},
  rules: {"acrocase/acrocase": "error"},
};

plugin.configs = {recommended};

export default plugin;
