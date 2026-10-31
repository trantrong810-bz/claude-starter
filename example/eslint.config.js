// @ts-check
import tseslint from "typescript-eslint";

// Ranh giới kiến trúc được ép bằng lint, không chỉ ghi trong CLAUDE.md.
const noAppImports = (allowed) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@app/*", ...allowed.map((a) => `!@app/${a}`)],
          message: "Vi phạm ranh giới: chỉ được import @app/shared. Đưa code dùng chung vào packages/shared.",
        },
        { group: ["../../*", "../../../*"], message: "Không import xuyên package bằng đường dẫn tương đối." },
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
