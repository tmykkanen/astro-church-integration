import { describe, expect, it } from "vitest";

import {
	addedIntegrationNames,
	runSetup,
	setupParams,
	validOptions,
	validSite,
} from "./setup.ts";

describe("icons", () => {
	// The Theme renders its icons itself (spec 3.2, Icons): `astro-icon` can't
	// find the Theme's icon sets under pnpm, so the integration must not add it.
	it("the integration doesn't add astro-icon", async () => {
		const params = setupParams({ site: validSite });

		await runSetup({ options: validOptions, params });

		expect(addedIntegrationNames(params)).not.toContain("astro-icon");
	});
});
