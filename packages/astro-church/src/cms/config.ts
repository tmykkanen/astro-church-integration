import { ASTRO_CHURCH_CMS_REPO } from "astro:env/server";
import type { APIRoute, GetStaticPaths } from "astro";

import { configKeys, configs } from "./configs.ts";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => {
	return configKeys.map((key) => ({ params: { file: key } }));
};

const isConfigKey = (key: string | undefined): key is keyof typeof configs => {
	return key !== undefined && Object.hasOwn(configs, key);
};

export const GET: APIRoute = ({ params }) => {
	let body = "";
	if (params.file === "backend") {
		body = `backend:\n  name: github\n  repo: ${ASTRO_CHURCH_CMS_REPO}`;
	} else if (isConfigKey(params.file)) {
		body = configs[params.file];
	}

	if (body === "") {
		return new Response("", { status: 404 });
	}
	return new Response(body, {
		headers: { "Content-Type": "application/yaml" },
	});
};
