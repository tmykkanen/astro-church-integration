import tailwindcss from "@tailwindcss/vite";
import type { AstroConfig, AstroIntegration, HookParameters } from "astro";
import { fontProviders } from "astro/config";
import { AstroError } from "astro/errors";

import { type AstroChurchOptions, validateOptions } from "./options.ts";

type UpdateConfig = HookParameters<"astro:config:setup">["updateConfig"];
type InjectRoute = HookParameters<"astro:config:setup">["injectRoute"];

export function integration(options: AstroChurchOptions): AstroIntegration {
	return {
		name: "astro-church",
		hooks: {
			"astro:config:setup": ({ updateConfig, injectRoute, config }) => {
				validateOptions(options);

				requireSite(config.site);

				addThemeFont(updateConfig);

				addTailwind(config.vite.plugins, updateConfig);

				injectRoutes(injectRoute);
			},
		},
	};
}

function requireSite(site: AstroConfig["site"]) {
	if (!site) {
		throw new AstroError(
			"Missing site",
			"Set site in astro.config.mjs, e.g. https://example.church",
		);
	}
}

function addThemeFont(updateConfig: UpdateConfig) {
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
}

function addTailwind(
	plugins: AstroConfig["vite"]["plugins"],
	updateConfig: UpdateConfig,
) {
	const sitePlugins: unknown[] = plugins ?? [];
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
}

function injectRoutes(injectRoute: InjectRoute) {
	injectRoute({
		pattern: "/theme-skeleton",
		entrypoint: new URL("./pages/theme-skeleton.astro", import.meta.url),
	});
}
