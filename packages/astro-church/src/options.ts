import { z } from "astro/zod";

const ERROR_CMS_REPO = "cms.repo is required, in the form owner/name";

export const astroChurchOptionsSchema = z.strictObject(
	{
		cms: z.strictObject(
			{
				repo: z
					.string({
						error: ({ input }) => {
							if (input === undefined) return ERROR_CMS_REPO;
							return "Must follow the format owner/name";
						},
					})
					.regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/),
			},
			{
				error: ({ input }) => {
					if (input === undefined) return ERROR_CMS_REPO;
					return undefined;
				},
			},
		),
		customCss: z.array(z.string()).optional(),
	},
	{
		error: ({ input }) => {
			if (input === undefined) return ERROR_CMS_REPO;
			return undefined;
		},
	},
);

export type AstroChurchOptions = z.input<typeof astroChurchOptionsSchema>;
