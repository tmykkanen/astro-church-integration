import type { APIRoute } from "astro";

import body from "../../dist/client/scriptureField.js?raw";

export const prerender = true;

export const GET: APIRoute = async () => {
	return new Response(body, {
		headers: { "Content-Type": "text/javascript; charset=utf-8" },
	});
};
