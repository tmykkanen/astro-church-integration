import { describe, expect, it } from "vitest";

import { runSetup, setupParams } from "./setup.ts";

describe("integration options", () => {
	const validOptions = { cms: { repo: "example/grace-church" } };
	const validSite = "https://example.church";

	it("accepts valid options with no error", async () => {
		const params = setupParams({ site: validSite });

		await expect(
			runSetup({ options: validOptions, params }),
		).resolves.toBeUndefined();
	});

	it.each<{
		name: string;
		options: unknown;
		mentions: RegExp[];
		notMentions?: RegExp[];
	}>([
		{
			name: "rejects no options at all, naming cms.repo",
			options: undefined,
			mentions: [/cms\.repo/],
		},
		{
			name: "rejects options without cms, naming cms.repo",
			options: {},
			mentions: [/cms\.repo/],
		},
		{
			name: "rejects options without cms.repo, naming cms.repo and owner/name",
			options: { cms: {} },
			mentions: [/cms\.repo/, /owner\/name/],
		},
		{
			name: "rejects a cms.repo with no slash, naming cms.repo and owner/name",
			options: { cms: { repo: "grace-church" } },
			mentions: [/cms\.repo/, /owner\/name/],
		},
		{
			name: "rejects a cms.repo with two slashes, naming cms.repo and owner/name",
			options: { cms: { repo: "example/grace-church/extra" } },
			mentions: [/cms\.repo/, /owner\/name/],
		},
		{
			name: "rejects a cms.repo with a space, naming cms.repo and owner/name",
			options: { cms: { repo: "example church/grace-church" } },
			mentions: [/cms\.repo/, /owner\/name/],
		},
		{
			name: "rejects a customCss that is a string, naming customCss",
			options: { ...validOptions, customCss: "theme.css" },
			mentions: [/customCss/],
		},
		{
			name: "rejects a customCss with a non-string entry, naming customCss",
			options: { ...validOptions, customCss: ["theme.css", 42] },
			mentions: [/customCss/],
		},
		{
			name: "rejects an unknown option, naming it",
			options: { ...validOptions, customCSS: ["theme.css"] },
			mentions: [/customCSS/],
			notMentions: [/cms\.repo is required/],
		},
		{
			name: "rejects an unknown key inside cms, naming it",
			options: {
				cms: { repo: "example/grace-church", repository: "example/other" },
			},
			mentions: [/repository/],
		},
	])("$name", async ({ options, mentions, notMentions = [] }) => {
		const params = setupParams({ site: validSite });

		const error = await runSetup({ options, params }).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(Error);
		for (const mention of mentions) {
			expect((error as Error).message).toMatch(mention);
		}
		for (const notMention of notMentions) {
			expect((error as Error).message).not.toMatch(notMention);
		}
	});
});

describe("Astro config", () => {
	it("rejects a config without site, naming site", async () => {
		const options = { cms: { repo: "example/grace-church" } };
		// `setupParams` takes a string; a missing `site` is `undefined`.
		const params = setupParams({ site: undefined as unknown as string });

		const error = await runSetup({ options, params }).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toMatch(/\bsite\b/);
	});
});
