// Type probe (ticket 04): copied into the packed Site's `src/` by the
// harness, so the packed install's `astro check` reads it. Each probe is a
// typed value that fails `astro check` when the rule it states breaks: the
// `IsAny` probes are `false` unless the probed type is `any`, and the others
// say what they check where they're declared.
//
// Probes read the Site's own re-exports, so they cover the path a Site uses.

import type { ThemeActions } from "astro-church/actions";

import { server } from "./actions";
import type { collections } from "./content.config";

// Only `any` passes `0 extends 1 & T`: `1 & T` is `never` or `1` otherwise.
type IsAny<T> = 0 extends 1 & T ? true : false;

// The re-exported `collections` isn't `any`.
export const collectionsIsNotAny: IsAny<typeof collections> = false;

// The re-exported `server` isn't `any`.
export const serverIsNotAny: IsAny<typeof server> = false;

// The type a Site's `server` satisfies isn't `any`. Read from the package,
// where a Site imports it.
export const themeActionsIsNotAny: IsAny<ThemeActions> = false;

// A Site can add its own actions next to the Theme's: `ThemeActions` accepts
// extra keys. `satisfies` on an object literal rejects keys its type doesn't
// allow (TS2353), so a closed `ThemeActions` fails here. It can't fail while
// the Theme's `server` is empty: a closed `ThemeActions` is then `{}`, which
// accepts any key. It bites from spec 3.4, with the first Theme action.
export const serverWithSiteAction = {
	...server,
	siteAction: () => "site",
} satisfies ThemeActions;

// The same rule, checked on the type itself so it bites today: any string is
// a key of `ThemeActions`. A closed type's keys are only its own actions.
type AcceptsAnyKey = string extends keyof ThemeActions ? true : false;
export const themeActionsAcceptsSiteKeys: AcceptsAnyKey = true;
