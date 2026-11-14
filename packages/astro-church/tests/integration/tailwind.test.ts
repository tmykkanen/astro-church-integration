import tailwindcss from "@tailwindcss/vite";
import { describe, expect, it } from "vitest";

import {
	addedPluginNames,
	runSetup,
	setupParams,
	validOptions,
	validSite,
} from "./setup.ts";

// Every plugin `@tailwindcss/vite` returns has a name with this prefix.
const tailwindPluginName = expect.stringMatching(/^@tailwindcss\/vite/);

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
