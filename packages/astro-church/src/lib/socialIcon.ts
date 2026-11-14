import { getIconData, iconToSVG } from "@iconify/utils";
import { icons } from "@iconify-json/simple-icons";
import { AstroError } from "astro/errors";

export interface SocialIconSvg {
	attributes: {
		width?: string;
		height?: string;
		viewBox: string;
	};
	body: string;
}

export function socialIcon(name: string): SocialIconSvg {
	const data = getIconData(icons, name);

	if (!data) {
		throw new AstroError(
			`Unknown social icon "${name}"`,
			"Use an icon identifier from https://simpleicons.org/, e.g. youtube",
		);
	}

	const { attributes, body } = iconToSVG(data);
	return { attributes, body };
}
