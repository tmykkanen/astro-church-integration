// Smoke check (ticket 07): the CMS field bundle registers the scripture field
// with Sveltia, and its control validates with the real parser. Node has no
// Sveltia, so this script stubs the three globals the bundle uses (`CMS`,
// `createClass`, `h`), then imports the bundle. It covers registration and
// validation, not rendering in Sveltia (spec 3.5).
//
// The harness runs this in its own Node process, so the stub globals never
// reach the rest of the harness.
//
// Usage: node register-validator.mjs <path to the installed bundle>
// Exits 0 when every check passes, 1 on the first failure.

import { pathToFileURL } from "node:url";

// From the ported scripture tests (tests/lib/scriptureParsing.test.ts).
const VALID_REF = "John 3:16";
const INVALID_REF = "Bob";

const bundle = process.argv[2];
if (!bundle) {
	console.error("FAIL: usage: node register-validator.mjs <bundle path>");
	process.exit(1);
}

function fail(message) {
	console.error(`FAIL: ${message}`);
	process.exit(1);
}

// `createClass` returns the spec it's given, so the check can call the
// control's `isValid` directly.
const registrations = [];
globalThis.CMS = {
	registerFieldType: (...args) => registrations.push(args),
};
globalThis.createClass = (spec) => spec;
globalThis.h = () => null;

await import(pathToFileURL(bundle).href);

if (registrations.length !== 1) {
	fail(
		`the bundle called CMS.registerFieldType ${registrations.length} times, expected 1`,
	);
}
const [name, control] = registrations[0];
if (name !== "scripture") {
	fail(`the bundle registered a field named "${name}", expected "scripture"`);
}
if (typeof control?.isValid !== "function") {
	fail("the scripture field's control has no isValid function");
}

const validResult = control.isValid(VALID_REF);
if (validResult !== true) {
	fail(
		`isValid("${VALID_REF}") returned ${JSON.stringify(validResult)}, expected true`,
	);
}

const invalidResult = control.isValid(INVALID_REF);
if (typeof invalidResult?.error?.message !== "string") {
	fail(
		`isValid("${INVALID_REF}") returned ${JSON.stringify(invalidResult)}, expected { error: { message } }`,
	);
}

console.log(
	"PASS: the CMS field bundle registers the scripture field, and its validator accepts and rejects references",
);
