import tailwindcss from "@tailwindcss/vite";
import type { HookParameters } from "astro";
import { describe, expect, it, vi } from "vitest";

import { runSetup, setupParams } from "./setup.ts";

const validOptions = { cms: { repo: "example/grace-church" } };
const validSite = "https://example.church";

// Every plugin `@tailwindcss/vite` returns has a name with this prefix.
const tailwindPluginName = expect.stringMatching(/^@tailwindcss\/vite/);

// Names of every Vite plugin the hook passed to `updateConfig`, across all
// calls. Vite accepts nested plugin arrays, and `@tailwindcss/vite` returns one.
const addedPluginNames = (params: HookParameters<"astro:config:setup">) =>
	vi
		.mocked(params.updateConfig)
		.mock.calls.flatMap(([update]) => update.vite?.plugins ?? [])
		.flat(Number.POSITIVE_INFINITY)
		.map((plugin) => (plugin as { name?: unknown } | null)?.name);

describe("Tailwind", () => {
	it("the integration adds the Tailwind Vite plugin when the Site has none", async () => {
		const params = setupParams({ site: validSite });

		await runSetup({ options: validOptions, params });

		expect(addedPluginNames(params)).toContainEqual(tailwindPluginName);
	});

	it.each<{ name: string; vitePlugins: unknown[] }>([
		{
			// As a Site writes it: `vite: { plugins: [tailwindcss()] }`.
			name: "the Site's own plugins",
			vitePlugins: [tailwindcss()],
		},
		{
			// Vite allows falsy entries, such as `isDev && somePlugin()`.
			name: "the Site's plugins, after a falsy entry",
			vitePlugins: [false, null, tailwindcss()],
		},
	])(
		"the integration adds no Tailwind Vite plugin when it's in $name",
		async ({ vitePlugins }) => {
			const params = setupParams({ site: validSite, vitePlugins });

			await runSetup({ options: validOptions, params });

			expect(addedPluginNames(params)).not.toContainEqual(tailwindPluginName);
		},
	);
});
