// Shared helpers for tests that run the integration's `astro:config:setup`
// hook directly, with the hook's parameters mocked.

import type { HookParameters } from "astro";
import { vi } from "vitest";

import { integration } from "#/integration.ts";
import type { AstroChurchOptions } from "#/options.ts";

// Options and `site` that pass validation, for tests about something else.
export const validOptions = { cms: { repo: "example/grace-church" } };
export const validSite = "https://example.church";

export const setupParams = ({
	site,
	vitePlugins,
	integrations = [],
}: {
	site: string;
	// The Site's own `vite.plugins`, as written in its `astro.config.mjs`.
	vitePlugins?: unknown[];
	// The Site's own `integrations`. Astro's resolved config always has the
	// array, already flattened.
	integrations?: unknown[];
}) => {
	return {
		// Astro's resolved config defaults `vite` to `{}`.
		config: {
			site,
			integrations,
			vite: vitePlugins ? { plugins: vitePlugins } : {},
		},
		injectRoute: vi.fn(),
		updateConfig: vi.fn(),
	} as unknown as HookParameters<"astro:config:setup">;
};

// Names of every integration the hook passed to `updateConfig`, across all calls.
export const addedIntegrationNames = (
	params: HookParameters<"astro:config:setup">,
) =>
	vi
		.mocked(params.updateConfig)
		.mock.calls.flatMap(([update]) => update.integrations ?? [])
		.map((integration) => integration.name);

// Names of every Vite plugin the hook passed to `updateConfig`, across all
// calls. Vite accepts nested plugin arrays, and `@tailwindcss/vite` returns one.
export const addedPluginNames = (
	params: HookParameters<"astro:config:setup">,
) =>
	vi
		.mocked(params.updateConfig)
		.mock.calls.flatMap(([update]) => update.vite?.plugins ?? [])
		.flat(Number.POSITIVE_INFINITY)
		.map((plugin) => (plugin as { name?: unknown } | null)?.name);

export const runSetup = async ({
	options,
	params,
}: {
	options: unknown;
	params: HookParameters<"astro:config:setup">;
}) => {
	const hook = integration(options as AstroChurchOptions).hooks[
		"astro:config:setup"
	];
	if (!hook) throw new Error("astro:config:setup hook missing");
	return hook(params);
};
