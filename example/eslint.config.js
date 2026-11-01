// @ts-check
import tseslint from "typescript-eslint";

// Architectural boundaries are enforced by lint, not just written in CLAUDE.md.
const noAppImports = (allowed) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@app/*", ...allowed.map((a) => `!@app/${a}`)],
          message: "Boundary violation: only @app/shared may be imported. Move shared code into packages/shared.",
        },
        { group: ["../../*", "../../../*"], message: "Do not import across packages with relative paths." },
      ],
    },
  ],
});

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.turbo/**", "**/dist/**", "**/.next/**", "**/.expo/**"] },
  ...tseslint.configs.recommended,
  { files: ["apps/**/*.ts", "apps/**/*.tsx"], rules: noAppImports(["shared"]) },
  { files: ["packages/shared/**/*.ts"], rules: noAppImports([]) },
);
