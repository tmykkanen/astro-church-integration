import tailwindcss from "@tailwindcss/vite";
import type { AstroIntegration } from "astro";
import { fontProviders } from "astro/config";
import { AstroError } from "astro/errors";
import { z } from "astro/zod";

import {
	type AstroChurchOptions,
	astroChurchOptionsSchema,
} from "./options.ts";

export function integration(options: AstroChurchOptions): AstroIntegration {
	return {
		name: "astro-church",
		hooks: {
			"astro:config:setup": ({ updateConfig, injectRoute, config }) => {
				const parsedOptions = astroChurchOptionsSchema.safeParse(options);

				if (!parsedOptions.success) {
					const message = z.prettifyError(parsedOptions.error);

					throw new AstroError(
						`Invalid astro-church options:\n${message}`,
						"Pass astroChurch({ cms: { repo: 'owner/name' } }) in astro.config.mjs",
					);
				}

				if (!config.site) {
					throw new AstroError(
						"Missing site",
						"Set site in astro.config.mjs, e.g. https://example.church",
					);
				}

				updateConfig({
					fonts: [
						{
							provider: fontProviders.google(),
							name: "Poppins",
							cssVariable: "--font-sans",
							subsets: ["latin"],
						},
					],
				});

				const sitePlugins: unknown[] = config.vite.plugins ?? [];
				const siteHasTailwind = sitePlugins
					.flat(Number.POSITIVE_INFINITY)
					.some(
						(plugin) =>
							typeof plugin === "object" &&
							plugin !== null &&
							"name" in plugin &&
							typeof plugin.name === "string" &&
							plugin.name.startsWith("@tailwindcss/vite"),
					);

				if (!siteHasTailwind) {
					updateConfig({
						vite: {
							plugins: [tailwindcss()],
						},
					});
				}

				injectRoute({
					pattern: "/theme-skeleton",
					entrypoint: new URL("./pages/theme-skeleton.astro", import.meta.url),
				});
			},
		},
	};
}
