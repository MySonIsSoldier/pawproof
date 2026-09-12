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
                "firebase-admin",
                "firebase-admin/**",
                "**/infrastructure/**",
                "**/features/**",
                "**/components/**",
                "sonner",
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
                "firebase",
                "firebase/**",
                "firebase-admin",
                "firebase-admin/**",
                "**/infrastructure/**",
                "**/features/**",
                "**/components/**",
                "sonner",
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
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/notifications/**/*.{ts,tsx}",
    ],
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
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message:
                "Use the shared notification boundary; features publish typed feedback.",
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
