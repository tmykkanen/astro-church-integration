// Blocks the agent's file tools from editing production code (see AGENTS.md,
// "Developer-led workflow") unless the developer has created .claude/exception.
// Shell edits aren't covered; AGENTS.md covers those.
import { existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const { tool_input: input = {} } = JSON.parse(readFileSync(0, "utf8"));
const target = input.file_path ?? input.notebook_path ?? "";
// macOS paths are case-insensitive, and sessions may name the repo either way.
const file = relative(root.toLowerCase(), target.toLowerCase());
const [top, , ...rest] = file.split("/");

// The Theme's packages and the Starter Site (playground/ now, starter/ later).
const inProductionTree =
	(top === "packages" && rest.length > 0) ||
	top === "playground" ||
	top === "starter";

const isTest =
	/\.test\.[cm]?[jt]sx?$/.test(file) ||
	/^packages\/[^/]+\/(tests|src\/testing)\//.test(file);

// READMEs and sample content are docs.
// TODO(Starter Site spec): sample content in .mdx or .yaml/.json is docs too
// (AGENTS.md); widen this once the sample content's location and formats are set.
const isMarkdown = file.endsWith(".md");

if (
	inProductionTree &&
	!isTest &&
	!isMarkdown &&
	!existsSync(`${root}/.claude/exception`)
) {
	console.error(
		`${file} is production code, which the developer writes. Propose the change in chat instead.`,
	);
	process.exit(2);
}
