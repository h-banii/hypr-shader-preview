import globals from "globals";
import pluginJs from "@eslint/js";
import { globalIgnores } from "eslint/config";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: globals.browser }},
  {
      "rules": {
          "no-unused-vars": ["warn", {
              "argsIgnorePattern": "^_"
          }]
      }
  },
  globalIgnores(["src/lib"]),
  pluginJs.configs.recommended,
];
