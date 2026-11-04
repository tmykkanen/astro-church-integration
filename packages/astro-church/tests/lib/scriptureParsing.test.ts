import { describe, expect, it } from "vitest";

import {
	isValidScriptureRef,
	parseScriptureRef,
} from "#/lib/scriptureParsing/index.ts";

describe("parseScriptureRef", () => {
	it.each(["John 121", "Bob", "jamez1"])(
		"returns false when passed an invalid scripture reference",
		(ref) => {
			const result = parseScriptureRef(ref);

			expect(result).toEqual({
				ok: false,
				error: `${ref} is not a valid scripture reference`,
			});
		},
	);

	it.each([
		["John 1", "John.1", "John 1", "John 1"],
		["james 1:3", "Jas.1.3", "James 1:3", "James 1:3"],
		[
			"1 tim 1:2-4:1",
			"1Tim.1.2-1Tim.4.1",
			"1 Timothy 1:2—4:1",
			"1 Tim. 1:2—4:1",
		],
	])(
		"parses %s correctly",
		(ref, expectedOsis, expectedRef, expectedShortRef) => {
			const result = parseScriptureRef(ref);

			expect(result.ok).toBe(true);

			if (!result.ok) return;

			expect(result.osis).toBe(expectedOsis);
			expect(result.ref).toBe(expectedRef);
			expect(result.shortRef).toBe(expectedShortRef);
		},
	);

	it("expands scripture ranges", () => {
		const result = parseScriptureRef("John 3:16-18");

		expect(result.ok).toBe(true);

		if (!result.ok) return;

		expect(result.expandedRef).toContain("John.3.16");
		expect(result.expandedRef).toContain("John.3.17");
		expect(result.expandedRef).toContain("John.3.18");
	});
});

describe("isValidScriptureRef", () => {
	it.each(["John 1", "John 3:16", "Romans 8:28-30", "1 Timothy 1:2"])(
		"returns true for valid scripture references: %s",
		(ref) => {
			expect(isValidScriptureRef(ref)).toBe(true);
		},
	);

	it.each(["Bob", "jamez1", ""])(
		"returns false for invalid scripture references: %s",
		(ref) => {
			expect(isValidScriptureRef(ref)).toBe(false);
		},
	);
});
