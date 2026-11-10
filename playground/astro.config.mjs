import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import astroChurch from "astro-church";

// https://astro.build/config
export default defineConfig({
	site: "http://localhost",
	integrations: [
		astroChurch({ cms: { repo: "tmykkanen/astro-church-integration" } }),
	],
	adapter: node({
		mode: "standalone",
	}),
});
