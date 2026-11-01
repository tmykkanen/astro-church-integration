import type { AstroIntegration } from "astro";

export function integration(): AstroIntegration {
	return {
		name: "astro-church",
		hooks: {},
	};
}
