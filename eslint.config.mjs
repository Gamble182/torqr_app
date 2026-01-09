import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow unused vars for prefixed with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      // Allow img tags (Next Image has issues with dynamic Supabase URLs)
      "@next/next/no-img-element": "off",
      // Reduce no-explicit-any to warning (acceptable for Zod errors and Prisma enums in MVP)
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
]);

export default eslintConfig;
