import format from "bible-reference-formatter";

import { parser } from "./parser.ts";
import type { ParseScriptureRefResult } from "./types.ts";
import { expandRange } from "./utils.ts";

export const parseScriptureRef = (input: string): ParseScriptureRefResult => {
	const osis = parser.parse(input).osis();

	if (!osis)
		return { ok: false, error: `${input} is not a valid scripture reference` };

	return {
		ok: true,
		osis,
		ref: format("esv-long", osis),
		shortRef: format("esv-short", osis),
		expandedRef: expandRange(osis),
	};
};
