import type { Err, Ok } from "../types.ts";

export type ScriptureRef = {
	osis: string;
	ref: string;
	shortRef: string;
	expandedRef: string[];
};

export type ParseScriptureRefSuccess = Ok<ScriptureRef>;
export type ParseScriptureRefResult = ParseScriptureRefSuccess | Err;
