import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/**",
                "next",
                "next/**",
                "zustand",
                "zustand/**",
                "@tanstack/**",
                "firebase",
                "firebase/**",
                "**/infrastructure/**",
                "**/features/**",
                "**/application/**",
              ],
              message:
                "Domain logic must remain independent of frameworks and outer layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/**",
                "react",
                "zustand",
                "zustand/**",
                "@tanstack/**",
                "**/infrastructure/**",
                "**/features/**",
              ],
              message:
                "Application use cases depend on ports, not concrete adapters or UI.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/features/**",
                "**/application/**",
                "**/infrastructure/**",
                "**/domain/**",
                "zustand",
                "zustand/**",
                "@tanstack/**",
              ],
              message:
                "Design-system components must not depend on business data or stores.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "dist/**",
    ".cache/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
