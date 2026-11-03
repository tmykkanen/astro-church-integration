// Fixture: a module that adds an ambient global. The no-globals check must
// reject it.

export {};

declare global {
	var astroChurchFixture: string;
}
