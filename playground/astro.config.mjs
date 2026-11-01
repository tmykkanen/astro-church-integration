import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import astroChurch from "astro-church";

// https://astro.build/config
export default defineConfig({
	integrations: [astroChurch()],
	vite: {
		plugins: [tailwindcss()],
	},
});
