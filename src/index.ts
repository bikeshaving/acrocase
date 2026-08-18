import type {ESLint} from "eslint";
import acrocase from "./rules/acrocase.ts";

const plugin: ESLint.Plugin = {
  rules: {acrocase},
};

export default plugin;
