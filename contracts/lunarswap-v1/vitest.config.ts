import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["**/*.test.ts"],
		hookTimeout: 100000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"**/*.d.ts",
				"**/*.test.ts",
				"**/*.spec.ts",
				"**/coverage/**",
				"**/dist/**",
				"**/build/**",
				"**/.next/**",
				"**/vitest.config.*",
				"**/tsconfig.*",
				"**/package.json",
				"**/package-lock.json",
				"**/pnpm-lock.yaml",
				"**/yarn.lock",
			],
			all: true,
			clean: true,
			cleanOnRerun: true,
			reportsDirectory: "./coverage",
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
	},
});
