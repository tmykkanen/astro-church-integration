import type { AstroIntegration } from "astro";

export function integration(): AstroIntegration {
	return {
		name: "astro-church",
		hooks: {
			"astro:config:setup": ({ injectRoute }) => {
				injectRoute({
					pattern: "/theme-skeleton",
					entrypoint: new URL("./pages/theme-skeleton.astro", import.meta.url),
				});
			},
		},
	};
}
