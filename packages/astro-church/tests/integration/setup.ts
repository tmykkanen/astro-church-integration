// Shared helpers for tests that run the integration's `astro:config:setup`
// hook directly, with the hook's parameters mocked.

import type { HookParameters } from "astro";
import { vi } from "vitest";

import { integration } from "#/integration.ts";
import type { AstroChurchOptions } from "#/options.ts";

export const setupParams = ({ site }: { site: string }) => {
	return {
		config: { site },
		injectRoute: vi.fn(),
		updateConfig: vi.fn(),
	} as unknown as HookParameters<"astro:config:setup">;
};

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
