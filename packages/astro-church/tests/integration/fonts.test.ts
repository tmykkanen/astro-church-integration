import { describe, expect, it } from "vitest";

import { runSetup, setupParams } from "./setup.ts";

const validOptions = { cms: { repo: "example/grace-church" } };
const validSite = "https://example.church";

describe("Theme font", () => {
	it("the integration adds the Theme's font (Poppins, Google, --font-sans, latin)", async () => {
		const params = setupParams({ site: validSite });

		await runSetup({ options: validOptions, params });

		expect(params.updateConfig).toHaveBeenCalledWith(
			expect.objectContaining({
				fonts: [
					expect.objectContaining({
						provider: expect.objectContaining({ name: "google" }),
						name: "Poppins",
						cssVariable: "--font-sans",
						subsets: ["latin"],
					}),
				],
			}),
		);
	});
});
