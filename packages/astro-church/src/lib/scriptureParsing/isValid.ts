import { parser } from "./parser.ts";

export const isValidScriptureRef = (input: string): boolean => {
	return Boolean(parser.parse(input).osis());
};
