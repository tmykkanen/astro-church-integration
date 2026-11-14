import sitemap from "@astrojs/sitemap";
import { describe, expect, it } from "vitest";

import {
	addedIntegrationNames,
	runSetup,
	setupParams,
	validOptions,
	validSite,
} from "./setup.ts";

describe("sitemap", () => {
	it("the integration adds @astrojs/sitemap when the Site has none", async () => {
		const params = setupParams({ site: validSite });

		await runSetup({ options: validOptions, params });

		expect(addedIntegrationNames(params)).toContain("@astrojs/sitemap");
	});

	it("the integration adds no @astrojs/sitemap when the Site already has it", async () => {
		const params = setupParams({
			site: validSite,
			// As a Site writes it, with its own options: `integrations: [sitemap({ … })]`.
			integrations: [sitemap({ filter: (page) => !page.includes("/draft/") })],
		});

		await runSetup({ options: validOptions, params });

		expect(addedIntegrationNames(params)).not.toContain("@astrojs/sitemap");
	});
});
