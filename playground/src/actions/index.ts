import {
	server as astroChurchServer,
	type ThemeActions,
} from "astro-church/actions";

export const server = { ...astroChurchServer } satisfies ThemeActions;
