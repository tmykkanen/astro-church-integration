import { describe, expect, it } from "vitest";

import { socialIcon } from "#/lib/socialIcon.ts";

describe("socialIcon", () => {
	it("returns the SVG attributes and body for a known icon name", () => {
		const { attributes, body } = socialIcon("youtube");

		expect(attributes).toEqual({
			width: "1em",
			height: "1em",
			viewBox: "0 0 24 24",
		});
		expect(body).toMatch(/^<path\b[^>]*\bfill="currentColor"/);
		expect(socialIcon("youtube")).not.toEqual(socialIcon("facebook"));
	});

	// Icon names are content a Site writes in `socials[].icon`, so they're public
	// contract (PRD §9). @iconify-json/simple-icons ships every update as a
	// patch, which `^` accepts: this fails CI if a lockfile bump drops a name.
	it.each([
		// The names sojourners.church's site.yaml uses.
		"youtube",
		"facebook",
		"spotify",
		"whatsapp",
		// Names Simple Icons removed but Iconify's set keeps, so they work today.
		"linkedin",
		"twitter",
	])("still resolves the published icon name %s", (name) => {
		expect(socialIcon(name).body).toMatch(/^<path\b/);
	});

	it("returns the parent icon for an alias in the set", () => {
		// In @iconify-json/simple-icons, "airbrakedotio" is an alias of "airbrake".
		expect(socialIcon("airbrakedotio")).toEqual(socialIcon("airbrake"));
	});

	it("throws for an unknown name, naming it and pointing at simpleicons.org", () => {
		let error: unknown;
		try {
			socialIcon("not-a-real-icon");
		} catch (caught) {
			error = caught;
		}

		expect(error).toMatchObject({
			message: expect.stringContaining('"not-a-real-icon"'),
			hint: expect.stringContaining("https://simpleicons.org/"),
		});
	});
});
