// Type is open to allow additional actions by the site
export type ThemeActions = typeof server & {
	[action: string]: unknown;
};

export const server = {};
