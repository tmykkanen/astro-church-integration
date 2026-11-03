// Fixture: a `.d.ts` with no top-level import or export, so TypeScript reads
// it as a script and every declaration in it is global. The no-globals check
// must reject it.

declare const astroChurchFixture: string;
