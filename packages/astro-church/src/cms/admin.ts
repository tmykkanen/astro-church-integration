import type { APIRoute } from "astro";

import { configKeys } from "./configs.ts";
export const prerender = true;

export const GET: APIRoute = () => {
	const links = configKeys
		.map(
			(key) =>
				`<link href="/cms/config/${key}.yaml" type="application/yaml" rel="cms-config-url">`,
		)
		.join("\n\t\t");

	const html = `<!doctype html>
<html lang="en">
        <head>
                <meta charset="utf-8">
                <meta name="robots" content="noindex">
                <title>Sveltia CMS</title>
                ${links}
        </head>
        <body>
                <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
                <script type="module" src="/cms/scripts/scriptureField.js"></script>
        </body>
</html>`;

	return new Response(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
};
