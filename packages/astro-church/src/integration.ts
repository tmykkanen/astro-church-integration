import type { AstroIntegration } from "astro";
import { envField } from "astro/config";

export function integration(options: {
	cms: { repo: string };
}): AstroIntegration {
	return {
		name: "astro-church",
		hooks: {
			"astro:config:setup": ({ updateConfig, injectRoute }) => {
				updateConfig({
					env: {
						schema: {
							ASTRO_CHURCH_CMS_REPO: envField.string({
								context: "server",
								access: "public",
								default: options.cms.repo,
							}),
						},
					},
				});
				injectRoute({
					pattern: "/cms/index.html",
					entrypoint: new URL("./cms/admin.js", import.meta.url),
					prerender: true,
				});
				injectRoute({
					pattern: "/cms/config/[file].yaml",
					entrypoint: new URL("./cms/config.js", import.meta.url),
					prerender: true,
				});
			},
		},
	};
}
